const moment = require('moment');
const { Spot } = require("@binance/connector");
const { createMessageQueue, processMessageQueue } = require('../services/rabbitmq');
const { writeData, checkIntervalList, retrieveIntervalList, retrieveTopSymbols} = require("../services/victoriametrics");
const {redis} = require("../services/redis");
const {addWatch} = require("../services/commands");
const {createCollection, findDocuments, isCollectionEmpty, findAllDocuments} = require("../services/mongo");
const {updateMinionsFromTopSymbols, handleUpdateMinions} = require("./monitor");
require('dotenv').config();

async function warmUp() {
    try {
        // Create collections in mongodb
        await createCollection('intervals')
        await createCollection('top_symbols')

        // Check if intervalList exists inside VictoriaMetrics
        const intervalListExists = isCollectionEmpty('intervals')
        // If not, store the IntervalList
        if (!intervalListExists) {
            console.log('Interval list not found in MongoDB');
            await storeIntervalList();
        } else {
            console.log('Interval list already exists in MongoDB');
        }
        // Retrieve the interval list
        const intervalList = await findAllDocuments('intervals')
        const topSymbols = await findAllDocuments('top_symbols')

        updateMinionsFromTopSymbols(handleUpdateMinions)

        // Retrieve and store klines
        await retrieveAndStoreKlines(topSymbols, intervalList, 1000);
        console.log('Kline data retrieved and stored successfully');
    } catch (error) {
        console.error(`Error warming up: ${error.message}`);
        throw error;
    }
}

async function monitorTopKline(symbols, interval) {
    // Connect to RabbitMQ and create a message queue for the kline data

    // Connect to the Binance WebSocket API for the top symbols' klines
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${symbols.map(symbol => `${symbol.toLowerCase()}@kline_${intervals.join('/')}`).join('/')}`);

    // Write the kline data to VictoriaMetrics
    ws.on('message', async data => {
        const kline = JSON.parse(data).data.k;
        const symbol = kline.s;
        const interval = kline.i;
        const openTime = kline.t;
        const open = kline.o;
        if (!intervals.includes(interval)) {
            return;
        }
        const dataPoints = [
            {
                metric: 'klines',
                timestamp: moment(openTime).valueOf(),
                value: parseFloat(open),
                tags: { symbol, interval, namespace: process.env.VM_NAMESPACE }
            }
        ];
        await writeData(dataPoints);
        const message = JSON.stringify({ symbol, interval, openTime, open });
        createMessageQueue(channel, 'kline', Buffer.from(message));
    });

    // Process the kline data from the message queue and write it to VictoriaMetrics
    const messageQueuePromises = intervalList.flatMap(interval => {
        return topSymbols.map(symbol => {
            return processMessageQueue(channel, 'kline', async message => {
                const { symbol, interval, openTime, open } = JSON.parse(message.content.toString());
                const dataPoints = [
                    {
                        metric: 'kline',
                        timestamp: moment(openTime).valueOf(),
                        value: parseFloat(open),
                        tags: { symbol, interval, namespace: process.env.VM_NAMESPACE }
                    }
                ];
                await writeData(dataPoints);
            });
        });
    });
    await Promise.all(messageQueuePromises);

    // Return a Promise that resolves when all the kline data has been written to VictoriaMetrics
    return Promise.resolve();
}



async function retrieveAndStoreKlines(symbols, intervals, count = 1000) {
    if (count > 1000) count = 1000;
    // Create a new Binance client with the specified API key and secret
    const client = new Spot();

    // Retrieve the kline data for each symbol and interval up to `count` klines
    const promises = symbols.flatMap(async symbol => {
        const dataPointsPromises = intervals.map(async interval => {
            try {
                const response = await client.klines(symbol, interval, { limit: count });
                const dataPoints = response.data.map(kline => {
                    return {
                        metric: 'kline',
                        tags: { symbol, interval, namespace: process.env.VM_NAMESPACE },
                        fields: {
                            open: parseFloat(kline[1]),
                            high: parseFloat(kline[2]),
                            low: parseFloat(kline[3]),
                            close: parseFloat(kline[4]),
                            volume: parseFloat(kline[5]),
                            quoteAssetVolume: parseFloat(kline[7]),
                            numberOfTrades: parseInt(kline[8]),
                            takerBuyBaseAssetVolume: parseFloat(kline[9]),
                            takerBuyQuoteAssetVolume: parseFloat(kline[10]),
                        },
                        timestamp: moment(kline[0]).valueOf(),
                    };
                });

                await writeData(dataPoints);
            } catch (error) {
                console.error(`Error retrieving kline data for symbol ${symbol} and interval ${interval}: ${error.message}`);
            }
        });
        await Promise.all(dataPointsPromises);
    });

    // Wait for all the kline data to be written to VictoriaMetrics
    await Promise.all(promises);
}

async function storeIntervalList() {
    try {
        // Split the comma-separated interval list into an array
        const intervalList = process.env.INTERVALS.split(',');

        // Create a data point with the interval list
        const dataPoint = {
            metric:
            {
                "__name__": 'interval_list',
                tags: {
                    namespace: process.env.VM_NAMESPACE
                },
                job: "insert_interval_list"
            },
            values: [1],
            fields: { intervals: intervalList },
            timestamps: [moment().valueOf()],
        };

        // Write the data point to VictoriaMetrics
        await writeData([dataPoint]);
        console.log('Interval list stored in VictoriaMetrics');
    } catch (error) {
        console.error(`Error storing interval list in VictoriaMetrics: ${error.message}`);
        throw error;
    }
}


module.exports = {
    warmUp,
    monitorTopKline,
}
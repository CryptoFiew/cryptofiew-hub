const moment = require('moment');
const { Spot } = require("@binance/connector");
const { createMessageQueue, processMessageQueue } = require('../services/rabbitmq');
const { writeData, checkIntervalList, queryLatestDataPoint, retrieveIntervalList, retrieveTopSymbols} = require("../services/victoriametrics");
require('dotenv').config();

async function warmUp() {
    try {
        // Check if intervalList exists inside VictoriaMetric
        const intervalListExists = await checkIntervalList();
        // If not, store the IntervalList
        if (!intervalListExists) {
            await storeIntervalList();
            console.log('Interval list stored in VictoriaMetrics');
        } else {
            console.log('Interval list already exists in VictoriaMetrics');
        }
        // Retrieve the interval list
        const intervalList = await retrieveIntervalList();
        const topSymbols = await retrieveTopSymbols();

        // Start the websocket monitor
        await monitorTopKline(topSymbols, intervalList);

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

async function updateTopSymbolsTicker() {
    try {
        // Create a new Binance client with the specified API key and secret
        const client = new Spot();

        // Retrieve the ticker data for all symbols
        const response = await client.ticker24hr();

        // Sort the ticker data by quoteVolume and limit it to the top 100 symbols
        const topSymbols = response.data
            .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
            .slice(0, 100);

        // Transform the ticker data into an array of dataPoints objects
        const dataPoints = response.data.map(item => {
            return {
                metric: 'ticker_day',
                tags: { symbol: item.symbol, namespace: process.env.VM_NAMESPACE },
                fields: {
                    priceChange: parseFloat(item.priceChange),
                    priceChangePercent: parseFloat(item.priceChangePercent),
                    weightedAvgPrice: parseFloat(item.weightedAvgPrice),
                    prevClosePrice: parseFloat(item.prevClosePrice),
                    lastPrice: parseFloat(item.lastPrice),
                    lastQty: parseFloat(item.lastQty),
                    bidPrice: parseFloat(item.bidPrice),
                    bidQty: parseFloat(item.bidQty),
                    askPrice: parseFloat(item.askPrice),
                    askQty: parseFloat(item.askQty),
                    openPrice: parseFloat(item.openPrice),
                    highPrice: parseFloat(item.highPrice),
                    lowPrice: parseFloat(item.lowPrice),
                    volume: parseFloat(item.volume),
                    quoteVolume: parseFloat(item.quoteVolume),
                    openTime: item.openTime,
                    closeTime: item.closeTime,
                    firstId: parseInt(item.firstId),
                    lastId: parseInt(item.lastId),
                    count: parseInt(item.count),
                },
                timestamp: moment().valueOf(),
            };
        });

        // Check the age of the latest data point for the ticker_price metric
        const latestDataPoint = await queryLatestDataPoint('ticker_day');
        const ageInSeconds = (moment().valueOf() - latestDataPoint.timestamp) / 1000;

        // Write the dataPoints to VictoriaMetrics if the latest data point is older than 1 minute
        if (ageInSeconds >= 60 || isNaN(ageInSeconds)) {
            await writeData(dataPoints);
            console.log('Top symbols ticker updated successfully');
        } else {
            console.log(`Skipping update - latest data point is only ${ageInSeconds} seconds old`);
        }
    } catch (error) {
        // TODO: Handle the error appropriately, such as logging an error message or throwing the error
        console.error(`Error updating top symbols ticker: ${error.message}`);
    }
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
        const intervalList = process.env.INTERVAL_LIST.split(',');

        // Create a data point with the interval list
        const dataPoint = {
            metric: 'interval_list',
            value: 1,
            tags: { namespace: process.env.VM_NAMESPACE },
            fields: { intervals: intervalList },
            timestamp: moment().valueOf(),
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
    updateTopSymbolsTicker,
    intervalList
}
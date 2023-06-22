const moment = require('moment');
const { Spot } = require("@binance/connector");
const { writeData } = require("../services/influx");
const {createCollection, isCollectionEmpty, findAllDocuments} = require("../services/mongo");
const {updateMinionsFromTopSymbols, handleUpdateMinions} = require("./monitor");
const env = require("../env");

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
                        tags: { symbol, interval },
                        values: [
                            parseFloat(kline[1]), // open
                            parseFloat(kline[2]), // high
                            parseFloat(kline[3]), // low
                            parseFloat(kline[4]), // close
                            parseFloat(kline[5]), // volume
                            parseFloat(kline[7]), // quoteAssetVolume
                            parseInt(kline[8]),   // numberOfTrades
                            parseFloat(kline[9]), // takerBuyBaseAssetVolume
                            parseFloat(kline[10]),// takerBuyQuoteAssetVolume
                        ],
                        timestamps: [moment(kline[0]).valueOf() / 1000], // convert to seconds
                    };
                });

                await writeData(dataPoints);
            } catch (error) {
                console.error(`Error retrieving kline data for symbol ${symbol} and interval ${interval}: ${error.message}`);
            }
        });
        await Promise.all(dataPointsPromises);
    });

    // Wait for all the kline data to be written to InfluxDB
    await Promise.all(promises);
    console.log('All history data is stored inside influx DB');
}

async function storeIntervalList() {
    try {
        // Split the comma-separated interval list into an array
        const intervalList = env.klineIntervals;

        // Create a data point with the interval list
        const dataPoint = {
            metric:
            {
                "__name__": 'interval_list',
                tags: {
                    namespace: env.influxBucket
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
}
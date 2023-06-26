const { Spot } = require("@binance/connector");
const { writeData } = require("../services/influx");
const { updateTopSymbolsTicker} = require("./monitor");
const { redis } = require('../services/redis')
const { Point } = require("@influxdata/influxdb-client");
const env = require("../env");
const logger = require('./logger');
const mongo = require("../services/mongo");
const { arraysEqual } = require('./utils');
const RedisChanMsg = require("../models/redis");
const client = new Spot();
const { hopper } = require('../minion/hopper-mq')

/**
 * Warms up the application by starting the hopper,
 * initializing MongoDB,
 * updating top symbols,
 * and retrieving and storing klines.
 */
async function warmUp() {
  logger.debug('Starting warm-up...');

  try {
		// Initialize MongoDB
    const intervalList = mongoWarmUp();
    logger.info('MongoDB initialized successfully.');

    // Update top symbols
    const topSymbols = await updateTopSymbolsTicker();
    logger.info(`Top symbols updated: ${topSymbols}`);

    // Retrieve and store klines
    await retrieveAndStoreKlines(topSymbols, intervalList, 1000);
    logger.info('Klines retrieved and stored successfully.');

		// Start hopper process
		hopper().start(4);
		logger.info('Hopper started successfully.');
  } catch (error) {
      logger.error(`Error during warm-up: ${error.message}`);
  }
}

/**
 * Initializes MongoDB by creating the 'intervals' collection,
 * updating the interval list, and publishing the list to Redis.
 * @returns {Array<string>} The list of intervals.
 */
async function mongoWarmUp() {
    const intervals = env.klinesIntervals;

    // Create the 'intervals' collection in MongoDB
    await mongo.create('intervals');
    logger.debug('Created or found "intervals" collection in MongoDB.');

    // Flush Redis
    await redis.pub.flushdb((error, result) => {
        if (error) {
            logger.error(`Error flushing Redis: ${error.message}`);
        } else {
            logger.info(`Flushed Redis: ${result}`);
        }
    });

    // Update the interval list in MongoDB
    const intervalListEmpty = await mongo.isEmpty('intervals');
    const currentIntervals = await mongo.getContents('intervals');

    if (intervalListEmpty || !arraysEqual(intervals, currentIntervals)) {
        logger.debug('Updating interval list in MongoDB.');
        await mongo.purge('intervals');
        await mongo.inserts('intervals', intervals.map(interval => ({ interval })));
    } else {
        logger.info('Skipping update - interval list has not changed.');
    }

    // Update the interval list in Redis
    const intervalHash = intervals.reduce((hash, interval) => {
        hash[interval] = env.redisIntervals;
        return hash;
    }, {});

    logger.debug(`Interval hash: ${JSON.stringify(Object.keys(intervalHash))}`);
    redis.pub.hmset(env.redisIntervals, intervalHash, (error, result) => {
        if (error) {
            logger.error(`Error updating interval list in Redis: ${error.message}`);
        } else {
            logger.info(`Updated interval list in Redis: ${result}`);
        }
    });

    // Publish the interval list to the 'intervals' channel
    const channel = env.redisMinionChan;
    const message = JSON.stringify(new RedisChanMsg('intervals', JSON.stringify(intervals)));
    redis.pub.publish(channel, message);

    return intervals;
}

/**
 * Retrieves and stores klines for the given symbols and intervals in InfluxDB.
 * @param {Array<string>} symbols - The list of symbols to retrieve klines for.
 * @param {Array<string>} intervals - The list of intervals to retrieve klines for.
 * @param {number} [count=1000] - The maximum number of klines to retrieve for each symbol and interval.
 */
async function retrieveAndStoreKlines(symbols, intervals, count = 1000) {
    const maxCount = 1000;
    const actualCount = Math.min(count, maxCount);

    const dataPointsPromises = symbols.flatMap(symbol => {
        return intervals.map(interval => {
            return client.klines(symbol, interval, { limit: actualCount })
                .then(response => {
                    const points = response.data.map(kline => {
                        return new Point(`${symbol}_${interval}`)
                            .tag('asset', symbol)
                            .tag('interval', interval)
                            .tag('type', 'kline')
                            .floatField('open', parseFloat(kline[1]))
                            .floatField('high', parseFloat(kline[2]))
                            .floatField('low', parseFloat(kline[3]))
                            .floatField('close', parseFloat(kline[4]))
                            .floatField('volume', parseFloat(kline[5]))
                            .floatField('quoteAssetVolume', parseFloat(kline[7]))
                            .floatField('numberOfTrades', parseFloat(kline[8]))
                            .floatField('takerBuyBaseBAssetVolume', parseFloat(kline[9]))
                            .floatField('takerBuyQuoteAssetVolume', parseInt(kline[10]))
                            .timestamp(new Date(kline[0] * 1000));
                    });

                    return writeData(points)
                        .catch(error => {
                            logger.error(`Error writing kline data for symbol ${symbol} and interval ${interval}: ${error.message}`);
                        });
                });
        });
    });

    try {
        await Promise.all(dataPointsPromises);
        logger.debug('All kline data is stored in InfluxDB.');
    } catch (error) {
        logger.error(`Error retrieving or storing kline data: ${error.message}`);
    }
}


module.exports = {
    warmUp
}

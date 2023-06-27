const { Spot } = require("@binance/connector");
const { writeData } = require("../services/influx");
const { updateTopSymbolsTicker} = require("./monitor");
const { redis } = require('../services/redis')
const { Point } = require("@influxdata/influxdb-client");
const env = require("../env");
const logger = require('./logger');
const mongo = require("../services/mongo");
const { arraysEqual, calculateKlines} = require('./utils');
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
    await mongoWarmUp();
    logger.info('MongoDB initialized successfully.');

    // Update top symbols
    const topSymbols = await updateTopSymbolsTicker();
    logger.info(`Top symbols updated: ${JSON.stringify(topSymbols)}`);

    // Retrieve and store klines
    await retrieveAndStoreKlines(topSymbols, 1000);
    logger.info('Klines retrieved and stored successfully.');

		// Start hopper process
		hopper.start(4);
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
	let returnIntervals;
	await mongo.connect();
  const intervals = env.klinesIntervals;

  // Create the 'intervals' collection in MongoDB
  await mongo.create('intervals');
  logger.debug('Created or found "intervals" collection in MongoDB.');

  // Flush Redis
  await redis.pub.flushdb('SYNC', (error, result) => {
      if (error) {
          logger.error(`Error flushing Redis: ${error.message}`);
      } else {
          logger.info(`Flushed Redis: ${result}`);
      }
  });

  // Update the interval list in MongoDB
  const intervalListEmpty = await mongo.isEmpty('intervals');
  const mongoIntervals = await mongo.getContents('intervals');
	const currentIntervals = mongoIntervals.map((item) => (item.interval));
	logger.debug(`currentIntervals: \n${JSON.stringify(currentIntervals)}`)

  if (intervalListEmpty || !arraysEqual(intervals, currentIntervals)) {
    logger.debug('Updating interval list in MongoDB.');
    await mongo.purge('intervals');
    await mongo.inserts('intervals', intervals.map(interval => ({ interval })));
		// Update the interval list in Redis
		logger.debug(`Setting new intervals to key ${env.redisIntervals}`);
		logger.debug(`[C] Setting return intervals: ${intervals}`);
		returnIntervals = intervals;
	} else {
		logger.debug(`[N] Setting return intervals: ${JSON.stringify(currentIntervals)}`);
		returnIntervals = currentIntervals;
		logger.info('Skipping update - interval list has not changed.');
	}

	// Publish the interval list to the 'intervals' channel
  const channel = env.redisMinionChan;
	const message = { type: 'intervals', data: intervals }
	redis.pub.publish(channel, JSON.stringify(message));
	logger.info(`Publish new intervals list to ${env.redisMinionChan}`)
	redis.lPop(env.redisIntervals, 20);
	redis.lPush(env.redisIntervals, returnIntervals);
}

/**
 * Retrieves and stores klines for the given symbols and intervals in InfluxDB.
 * @param {Array<string>} symbols - The list of symbols to retrieve klines for.
 * @param {Array<string>} intervals - The list of intervals to retrieve klines for.
 * @param {number} [count=1000] - The maximum number of klines to retrieve for each symbol and interval.
 */
async function retrieveAndStoreKlines(symbols) {

	logger.debug(`Retrieve Symbols as parameter: ${JSON.stringify(symbols)}`);
	const intervals = await redis.getList(env.redisIntervals)
	logger.debug(`Retrieve Intervals from Redis: ${intervals}`)
	const klinesIntervals = calculateKlines(intervals, 30);
	logger.debug(`Kline count results: ${JSON.stringify(klinesIntervals)}`)

	const dataPointsPromises = [];
	symbols.forEach((symbol) => {
		Object.entries(klinesIntervals).forEach(([interval, limit]) => {
			dataPointsPromises.push(client.klines(symbol, interval, { limit: limit })
				.then((response) => {
					return response.data.map((kline) =>
						new Point(`${symbol}_${interval}`)
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
							.timestamp(new Date(kline[0]))
					);
				})
			);
		});
	});

  try {
		Promise.all(dataPointsPromises)
			.then((dp) => {
				const allDataPoints = [].concat(...dp)
				writeData((allDataPoints))
			})
    logger.debug('All kline data is stored in InfluxDB.');
  } catch (error) {
    logger.error(`Error retrieving or storing kline data: 
    ${error.message}`);
  }
}


module.exports = {
    warmUp
}

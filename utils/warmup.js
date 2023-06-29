const { Spot } = require("@binance/connector");
const { writeData } = require("../services/influx");
const { updateTopSymbolsTicker } = require("./monitor");
const { redis } = require('../services/redis');
const { Point } = require("@influxdata/influxdb-client");
const env = require("../env");
const logger = require('./logger');
const mongo = require("../services/mongo");
const { arraysEqual, calculateKlines } = require('./utils');
const RedisChanMsg = require("../models/redis");
const client = new Spot();
const { hopper } = require('../minion/hopper-mq');

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
		await retrieveAndStoreKlines(topSymbols);
		logger.info('Klines retrieved and stored successfully.');

		// Start hopper process
		hopper.start(4);
		logger.info('Hopper started successfully.');
	} catch (error) {
		logger.error(`Error during warm-up: ${error.message}`);
	}
}



module.exports = {
	warmUp,
};

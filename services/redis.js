const Redis = require('ioredis');
const env = require('../env');
const logger = require("../utils/logger");
const {promisify} = require("../utils/utils");

const redisConfig = {
	host: env.redisHost,
	port: env.redisPort,
	password: env.redisPass || null,
};

const pubClient = new Redis(redisConfig);
const subClient = new Redis(redisConfig);

// Promisified Redis commands
const lrangeAsync = promisify(pubClient.lrange).bind(pubClient);
const lremAsync = promisify(pubClient.lrem).bind(pubClient);
const lpushAsync = promisify(pubClient.lpush).bind(pubClient);
const lpopAsync = promisify(pubClient.lpop).bind(pubClient);

/**
 * Removes items from a Redis list by value.
 *
 * @param {string} key - The key of the Redis list.
 * @param {...string} items - The values to be removed from the list.
 * @returns {Promise} A promise that resolves when the items are removed.
 */
const removeFromList = async (key, ...items) => {
	try {
		const result = await lrangeAsync(key, 0, -1);
		const itemsToRemove = result.filter((item) => items.includes(item));
		if (itemsToRemove.length > 0) {
			const numRemoved = await lremAsync(key, 0, ...itemsToRemove);
			logger.debug(`Removed ${numRemoved} items from list ${key}: ${itemsToRemove}`);
		} else {
			logger.debug(`No items found in list ${key}: ${items}`);
		}
	} catch (error) {
		logger.error(error);
	}
};

/**
 * Get a list from Redis by key.
 *
 * @param {string} key - The key of the Redis list.
 * @returns {Promise<string[]>} A promise that resolves to an array of list items.
 */
const getList = async (key) => {
	try {
		const result = await lrangeAsync(key, 0, -1);
		logger.debug(JSON.stringify(result));
		return result;
	} catch (error) {
		logger.error(error);
		return [];
	}
};

/**
 * Push values to the beginning of a Redis list.
 *
 * @param {string} key - The key of the Redis list.
 * @param {...string} values - The values to be pushed to the list.
 * @returns {Promise<number>} A promise that resolves to the length of the updated list.
 */
const lPush = async (key, ...values) => {
	try {
		return await lpushAsync(key, ...values);
	} catch (error) {
		logger.error(error);
		return 0;
	}
};

/**
 * Pop values from the beginning of a Redis list.
 *
 * @param {string} key - The key of the Redis list.
 * @param {number} [length=1] - The number of values to pop.
 * @returns {Promise<string[]|null>} A promise that resolves to an array of popped values, or null if the list is empty.
 */
const lPop = async (key, length = 1) => {
	try {
		return await lpopAsync(key, length);
	} catch (error) {
		logger.error(error);
		return null;
	}
};

// Handle Redis connection errors
pubClient.on('error', (err) => {
	logger.error(`Error connecting to Redis: ${err}`);
});

subClient.on('error', (err) => {
	logger.error(`Error connecting to Redis: ${err}`);
});

module.exports = {
	redis: {
		pub: pubClient,
		sub: subClient,
		lPush,
		lPop,
		getList,
		remove: removeFromList,
	},
};

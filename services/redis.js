const Redis = require('ioredis');
const env = require('../env');
const logger = require("../utils/logger");

const redisConfig = {
    host: env.redisHost,
    port: env.redisPort,
    password: env.redisPass || null,
};

const pubClient = new Redis(redisConfig);
const subClient = new Redis(redisConfig);

/**
 * Removes items from a Redis list by value.
 *
 * @param {string} key - The key of the Redis list.
 * @param {...string} items - The values to be removed from the list.
 * @returns {undefined}
 */
const removeFromList = (key, ...items) => {
  pubClient.lrange(key, 0, -1, (error, result) => {
    if (error) {
      logger.error(error);
    } else {
      const itemsToRemove = result.filter((item) => items.includes(item));
      if (itemsToRemove.length > 0) {
        pubClient.lrem(key, itemsToRemove.length, ...itemsToRemove, (error, result) => {
          if (error) {
            logger.error(error);
          } else {
            logger.debug(`Removed ${result} items from list ${key}: ${itemsToRemove}`);
          }
        });
      } else {
        logger.debug(`No items found in list ${key}: ${items}`);
      }
    }
  });
}

const getList = async (key) => {
	logger.debug(pubClient.status)
	try {
		return await pubClient.lrange(key, 0, -1, (error, result) => {
			logger.debug(JSON.stringify(result));
			return result;
		});
	} catch (error) {
		logger.error(error);
		return [];
	}
};

const lPush = (key, values) => {
	try {
		return pubClient.lpush(key, values);
	} catch (error) {
		logger.error(error);
		return 0;
	}
}

const lPop = (key, length) => {
	try {
		return pubClient.lpop(key, length);
	} catch(error) {
		logger.error(error)
		return 0;
	}
}
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

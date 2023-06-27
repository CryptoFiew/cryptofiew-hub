const Redis = require('ioredis');
const env = require('../env');
const logger = require("../utils/logger");

const redisConfig = {
    host: env.redisHost,
    port: env.redisPort,
    password: env.redisPass || null,
		enableAutoPipelining: true,
};

const pubClient = new Redis(redisConfig);
const subClient = pubClient.duplicate();

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
      console.error(error);
    } else {
      const itemsToRemove = result.filter((item) => items.includes(item));
      if (itemsToRemove.length > 0) {
        pubClient.lrem(key, itemsToRemove.length, ...itemsToRemove, (error, result) => {
          if (error) {
            console.error(error);
          } else {
            console.log(`Removed ${result} items from list ${key}: \n${itemsToRemove}`);
          }
        });
      } else {
        console.log(`No items found in list ${key}: \n${items}`);
      }
    }
  });
}


// Handle Redis connection errors
pubClient.on('error', (err) => {
    logger.error(`Error connecting to Redis: \n${err}`);
});

subClient.on('error', (err) => {
    logger.error(`Error connecting to Redis: \n${err}`);
});



module.exports = {
    redis: {
        pub: pubClient,
        sub: subClient,
        remove: removeFromList,
    },
};

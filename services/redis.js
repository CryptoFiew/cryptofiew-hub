const Redis = require("ioredis");
const env = require("../env");
const logger = require("../models/logger");
const { promisify } = require("util");

const redisConfig = {
  host: env.redisHost,
  port: env.redisPort,
  password: env.redisPass || null,
};

const pubClient = new Redis(redisConfig);
const subClient = new Redis(redisConfig);

const promisifyCommands = ["lrange", "lrem", "lpush", "lpop"];

promisifyCommands.forEach((command) => {
  pubClient[command] = promisify(pubClient[command]).bind(pubClient);
});

const removeFromList = async (key, ...items) => {
  try {
    const result = await pubClient.lrange(key, 0, -1);
    const itemsToRemove = result.filter((item) => items.includes(item));
    if (itemsToRemove.length > 0) {
      const numRemoved = await pubClient.lrem(key, 0, ...itemsToRemove);
      logger.debug(
        `Removed ${numRemoved} items from list ${key}: ${itemsToRemove}`,
      );
    } else {
      logger.debug(`No items found in list ${key}: ${items}`);
    }
  } catch (error) {
    logger.error(error);
  }
};

const getList = async (key) => {
  try {
    const result = await pubClient.lrange(key, 0, -1);
    if (result.length === 0) {
      logger.debug(`No list found for key: ${key}`);
    }
    return result;
  } catch (error) {
    logger.error(error);
    return [];
  }
};

const lPush = async (key, ...values) => {
  try {
    return await pubClient.lpush(key, ...values);
  } catch (error) {
    logger.error(error);
    return 0;
  }
};

const lPop = async (key, length = 1) => {
  try {
    return await pubClient.lpop(key, length);
  } catch (error) {
    logger.error(error);
    return null;
  }
};

pubClient.on("error", (err) => {
  logger.error(`Error connecting to Redis: ${err}`);
});

subClient.on("error", (err) => {
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

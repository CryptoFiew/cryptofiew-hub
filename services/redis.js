const Redis = require('ioredis');

// Set the Redis configuration
const redisConfig = {
    host: 'localhost',
    port: 6379,
    db: 0
};

// Connect to Redis
const clientRedis = new Redis(redisConfig);

module.exports = {
    clientRedis
};

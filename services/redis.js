const Redis = require('ioredis');
const dotenv = require('dotenv');
dotenv.config();

const redisConfig = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    db: process.env.REDIS_DB || 0,
    password: process.env.REDIS_PASSWORD || undefined,
};

const pubClient = new Redis(redisConfig);
const subClient = pubClient.duplicate();

// Handle Redis connection errors
pubClient.on('error', (err) => {
    console.error('Error connecting to Redis:', err);
});

subClient.on('error', (err) => {
    console.error('Error connecting to Redis:', err);
});

module.exports = {
    redis: {
        pub: pubClient,
        sub: subClient,
    },
};

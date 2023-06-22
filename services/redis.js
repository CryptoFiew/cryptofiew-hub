const Redis = require('ioredis');
const env = require('../env');

const redisConfig = {
    host: env.redisHost,
    port: env.redisPort,
    db: env.redisDb,
    password: env.redisPass,
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

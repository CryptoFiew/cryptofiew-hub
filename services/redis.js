const Redis = require('ioredis');
const env = require('../env');

const redisConfig = {
    host: env.redisHost,
    port: env.redisPort,
    password: env.redisPass || null,
};

const pubClient = new Redis(redisConfig);
const subClient = pubClient.duplicate();

const removeFromList = (key, ...items) => {
    pubClient.lrange(key, 0, -1, (error, result) => {
        if (error) {
            console.error(error);
        } else {
            const indexes = items.map((item) => result.indexOf(item));
            const indexesToRemove = indexes.filter((index) => index !== -1);
            if (indexesToRemove.length > 0) {
                const itemValuesToRemove = indexesToRemove.map((index) => result[index]);
                pubClient.lrem(key, indexesToRemove.length, ...itemValuesToRemove, (error, result) => {
                    if (error) {
                        console.error(error);
                    } else {
                        console.log(`Removed ${result} items from list ${key}: ${itemValuesToRemove}`);
                    }
                });
            } else {
                console.log(`No items found in list ${key}: ${items}`);
            }
        }
    });
}

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
        remove: removeFromList,
    },
};

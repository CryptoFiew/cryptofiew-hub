require('dotenv').config();

module.exports = {
    binanceApiKey: process.env.BINANCE_API_KEY || '',
    binanceApiSecret: process.env.BINANCE_API_SECRET || '',
    rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost',
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: process.env.REDIS_PORT || 6379,
    redisDb: process.env.REDIS_DB || 0,
    redisPass: process.env.REDIS_PASS || undefined,
    mongoHost: process.env.MONGO_HOST || 'mongodb://localhost:27017',
    mongoDb: process.env.MONGO_DB || 'crypto-pulse',
    influxUrl: process.env.INFLUXDB_URL || '',
    influxToken: process.env.INFLUXDB_TOKEN || '',
    influxOrg: process.env.INFLUXDB_ORG || '',
    influxBucket: process.env.INFLUXDB_BUCKET || 'crypto-pulse',
    tickerInterval: process.env.TICKER_INTERVAL || 15,
    topSymbols: process.env.TOP_SYMBOLS || 20,
    klineIntervals: process.env.INTERVALS || '2h,4h,6h,8h,12h,1d,3d,1w'.split(',')
};
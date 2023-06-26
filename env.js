require('dotenv').config();

// rabbitMQ Channel
const wsBinance = process.env.BINANCE_QUEUE || 'ws-binance'


// Channel
const minionChan = process.env.MINION_CHAN || 'system:minions';

const configKey = process.env.CONFIG_KEY || 'system:config';
const systemKey = process.env.SYSTEM_KEY || 'system';
const commands = process.env.COMMAND || 'commands';
const topSymbols = process.env.TOP_SYMBOLS || 'top_symbols';
const intervals = process.env.INTERVALS || 'intervals';
const webSockets = process.env.WEBSOCKETS || 'websockets';

const redisTopSymbols = `${configKey}:${topSymbols}`;
const redisIntervals = `${configKey}:${intervals}`;
const redisCommands = `${minionChan}:${commands}`;
const redisWebSockets = `${configKey}:${webSockets}`



module.exports = {
  // Debug
  debug: process.env.DEBUG,
  // Binance
  binanceApiKey: process.env.BINANCE_API_KEY || '',
  binanceApiSecret: process.env.BINANCE_API_SECRET || '',
  // RabbitMQ
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost',
	wsBinance,
  // Redis
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: process.env.REDIS_PORT || 6379,
  redisDb: process.env.REDIS_DB || 0,
  redisPass: process.env.REDIS_PASS || undefined,
  redisMinionChan: minionChan,
  redisSystemKey: systemKey,
  redisConfigKey: configKey,
  redisCommands,
  redisIntervals,
  redisTopSymbols,
  redisWebSockets,
  // MongoDB
  mongoHost: process.env.MONGO_HOST || 'mongodb://localhost:27017',
  mongoDb: process.env.MONGO_DB || 'crypto-pulse',
  // InfluxDB
  influxUrl: process.env.INFLUXDB_URL || '',
  influxToken: process.env.INFLUXDB_TOKEN || '',
  influxOrg: process.env.INFLUXDB_ORG || '',
  influxBucket: process.env.INFLUXDB_BUCKET || 'crypto-pulse',
  // Variables
  tickerInterval: process.env.TICKER_INTERVAL * 1000 || 15 * 1000,
  monitorSymbol: process.env.MONITOR_SYMBOL.toLowerCase() || 'usdt',
  topSymbolCount: process.env.TOP_SYMBOLS_COUNT || 20,
  klinesIntervals: process.env.KLINES_INTERVALS.toLowerCase().split(',') || '2h,4h,6h,8h,12h,1d,3d,1w'.split(','),
};
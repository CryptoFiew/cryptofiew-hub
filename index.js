const { redis } = require('./services/redis');
const { addWatch, delWatch, listWatch, shutdown } = require('./services/commands');
const { warmUp }  = require('./utils/warmup');
const { updateTopSymbolsTicker, processTopSymbols, startMinions} = require('./utils/monitor')
const logger = require('./utils/logger');
const hopper = require('./minion/hopper-mq');
const {redisMinionChan} = require("./env");
const env = require("./env");

/**
 * Handles incoming messages from Redis.
 * @param {string} channel - The Redis channel the message was sent on.
 * @param {string} message - The message received from Redis.
 */
function handleMessage(channel, message) {
  if (channel !== redisMinionChan) {
    return;
  }

  try {
    const { type, data } = JSON.parse(message);

    if (type === 'commands') {
      logger.debug('Received commands from Redis');
      const { exchange, command, symbol } = JSON.parse(data);

      if (exchange !== 'binance') {
        logger.warn(`Unsupported exchange: \n${exchange}`);
        return;
      }

      switch (command) {
        case 'add_watch':
          addWatch(symbol).then();
          break;
        case 'del_watch':
          delWatch(symbol);
          break;
        case 'list_watch':
          listWatch();
          break;
        default:
          logger.warn(`Unsupported command: \n${command}`);
          break;
      }
    } else if (type === 'top_symbols') {
      logger.debug('Received top symbols from Redis');
      const topSymbols = JSON.parse(data);

      // Filter symbols to add or remove from the watch list
      processTopSymbols(topSymbols).then();
    } else if (type === 'intervals') {
      // TODO: Handle intervals
    } else {
      logger.warn(`Unsupported message type: \n${type}`);
    }
  } catch (error) {
    logger.error(`Failed to parse message: \n${message}`);
  }
}

// Perform warmup
warmUp().then(() => {
  // Schedule the updateTopSymbolsTicker function to run every [n] seconds (def. 15)
  setInterval(async () => {
    try {
      await updateTopSymbolsTicker();
    } catch (error) {
      logger.error(`Error updating top symbols ticker: \n${error.message}`);
    }
  }, env.tickerInterval);


	// Subscribe to the minion_telephone channel
  redis.sub.subscribe(redisMinionChan, (error) => {
    if (error) {
      logger.error(`Failed to subscribe to channel: \n${error.message}`)
      return
    }
    logger.debug(`Subscribed to ${redisMinionChan} channel`)
  })

  redis.sub.on('message', handleMessage)
});

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)



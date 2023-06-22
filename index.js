const { redis } = require('./services/redis');
const { addWatch, delWatch, listWatch, shutdown } = require('./services/commands');
const { updateTopSymbolsTicker, warmUp}  = require('./utils/warmup');


function handleMessage(channel, message) {
  try {
    const { exchange, command, symbol } = JSON.parse(message)

    if (exchange !== 'binance') {
      console.log(`Unsupported exchange: ${exchange}`)
      return
    }

    if (command === 'add_watch') {
      addWatch(symbol)
    } else if (command === 'del_watch') {
      delWatch(symbol)
    } else if (command === 'list_watch') {
      listWatch()
    } else {
      console.log(`Unsupported command: ${command}`)
    }
  } catch (error) {
    console.error(`Failed to parse message: ${message}`)
  }
}

// Schedule the updateTopSymbolsTicker function to run every 10 seconds
setInterval(async () => {
  try {
    await updateTopSymbolsTicker();
  } catch (error) {
    console.error(`Error updating top symbols ticker: ${error.message}`);
  }
}, 10000);

// Perform db warmup
warmUp().catch(error => {
  console.error(`Error warming up: ${error.message}`);
});

// Subscribe to the minion_telephone channel
redis.sub.subscribe('minion_telephone', (error) => {
  if (error) {
    console.error(`Failed to subscribe to channel: ${error.message}`)
    return
  }
  console.log('Subscribed to channel')
})

redis.sub.on('message', handleMessage)

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)



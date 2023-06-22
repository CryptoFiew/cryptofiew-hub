const { redis } = require('./services/redis');
const { addWatch, delWatch, listWatch, shutdown } = require('./services/commands');
const { warmUp }  = require('./utils/warmup');
const { updateTopSymbolsTicker, updateMinionsFromTopSymbols} = require('./utils/monitor')


function handleMessage(channel, message) {
  if (channel === 'minion_telephone') {
    try {
      const { exchange, command, symbol } = JSON.parse(message)

      if (exchange !== 'binance') {
        console.log(`Unsupported exchange: ${exchange}`)
        return
      }

      if (command === 'add_watch') {
        addWatch(symbol, true)
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
}

// Call the updateMinionsFromTopSymbols function after handling the message
updateMinionsFromTopSymbols((error, topSymbols) => {
  if (error) {
    console.error(`Error updating subprocesses from top symbols list: ${error.message}`);
    return;
  }

  console.log(`Subprocesses updated successfully from top symbols list: ${topSymbols.join(', ')}`);
});

// Schedule the updateTopSymbolsTicker function to run every 10 seconds
setInterval(async () => {
  try {
    await updateTopSymbolsTicker();
  } catch (error) {
    console.error(`Error updating top symbols ticker: ${error.message}`);
  }
}, 15000);

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
  console.log('Subscribed to minion_telephone channel')
})

redis.sub.on('message', handleMessage)

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)



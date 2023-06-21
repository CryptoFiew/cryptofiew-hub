const Redis = require('ioredis')
const { spawn } = require('child_process')
const monitorTopKline = require('./services/db-warmup');
const WEBSOCKET_TIMEOUT_MS = 60000; // 1 minute

const redisConnection = { host: 'localhost', port: 6379 }
const subClient = new Redis(redisConnection)
const pubClient = new Redis(redisConnection)

// Store the child processes in a map
const childProcesses = new Map()

function addWatch(symbol) {
  console.log(`Adding watch for symbol ${symbol}`)

  // Check if a child process is already running for this symbol
  if (childProcesses.has(symbol)) {
    console.log(`WebSocket client process already running for symbol ${symbol}`)
    return
  }

  // Execute the binance-ws.js script as a separate node process
  const clientProcess = spawn('node', ['services/binance-ws.js', symbol])
  const clientProcessId = clientProcess.pid.toString()
  console.log(`Started WebSocket client process for symbol ${symbol}: PID ${clientProcessId}`)

  // Save the child process ID to Redis and the childProcesses map
  pubClient.lpush('minions', JSON.stringify({ exchange: 'binance', command: 'add_watch', symbol }))
  pubClient.hset('processes', symbol, clientProcessId)
  childProcesses.set(symbol, clientProcess)

  // Listen for the process to exit
  clientProcess.on('exit', (code, signal) => {
    console.log(`WebSocket client process ended for symbol ${symbol}: PID ${clientProcessId}, code ${code}, signal ${signal}`)
    pubClient.publish('minion_telephone_ended', JSON.stringify({ exchange: 'binance', command: 'add_watch', symbol }))
    pubClient.hdel('processes', symbol).then(() => {
      console.log(`Removed process ID for symbol ${symbol} from Redis`)
    }).catch((error) => {
      console.error(`Failed to remove process ID from Redis: ${error.message}`)
    })
    childProcesses.delete(symbol)
  })
}

function delWatch(symbol) {
  console.log(`Deleting watch for symbol ${symbol}`)

  // Check if a child process is running for this symbol
  if (childProcesses.has(symbol)) {
    const clientProcess = childProcesses.get(symbol)
    const clientProcessId = clientProcess.pid.toString()
    console.log(`Killing WebSocket client process for symbol ${symbol}: PID ${clientProcessId}`)
    clientProcess.kill()
    childProcesses.delete(symbol)

    // Remove the process ID from Redis
    pubClient.hdel('processes', symbol).then(() => {
      console.log(`Removed process ID for symbol ${symbol} from Redis`)
    }).catch((error) => {
      console.error(`Failed to remove process ID from Redis: ${error.message}`)
    })
  } else {
    console.log(`No WebSocket client process running for symbol ${symbol}`)
  }
}

function listWatch() {
  console.log(`Listing active watches`)

  // Get the list of active watches from the childProcesses map
  const watches = Array.from(childProcesses.keys())
  console.log(`Active watches: ${watches.join(', ')}`)

  // Publish the list of active watches to the minion_telephone channel
  const watchesJson = JSON.stringify(watches)
  pubClient.publish('minion_telephone', watchesJson)
}

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

// Perform db warmup
monitorTopKline()
    .then(() => {
      console.log('Kline data written to VictoriaMetrics');
      setTimeout(() => {
        console.log('WebSocket connection closed');
        ws.close();
      }, WEBSOCKET_TIMEOUT_MS);
    })
    .catch(error => console.error(error));

// Subscribe to the minion_telephone channel
subClient.subscribe('minion_telephone', (error) => {
  if (error) {
    console.error(`Failed to subscribe to channel: ${error.message}`)
    return
  }
  console.log('Subscribed to channel')
})

subClient.on('message', handleMessage)

// Handle SIGINT and SIGTERM signals
function shutdown() {
  console.log('Shutting down...')
  for (const [symbol, clientProcess] of childProcesses.entries()) {
    const clientProcessId = clientProcess.pid.toString()
    console.log(`Killing WebSocket client process for symbol ${symbol}: PID ${clientProcessId}`)
    clientProcess.kill()
    pubClient.hdel('processes', symbol).then(() => {
      console.log(`Removed process ID for symbol ${symbol} from Redis`)
    }).catch((error) => {
      console.error(`Failed to remove process ID from Redis: ${error.message}`)
    })
  }
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

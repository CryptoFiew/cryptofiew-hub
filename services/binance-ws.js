const WebSocket = require('ws')
const Redis = require('ioredis')

const symbol = process.argv[2] // Get the symbol from the command line arguments

// Define the time intervals to calculate high and low prices for
const intervals = Object.freeze([5, 10, 15, 30, 60, 900, 1800, 3600, 86400, 604800, 2592000, 7776000, 15552000, 31536000, Infinity])

// Initialize the high and low price objects for each time interval
const highPrices = Object.fromEntries(intervals.map(interval => [interval, -Infinity]))
const lowPrices = Object.fromEntries(intervals.map(interval => [interval, Infinity]))

// Connect to the Binance WebSocket API
const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@trade`)

// Connect to Redis
const redisUrl = 'redis://localhost:6379' // Replace with your Redis URL
const redisClient = new Redis(redisUrl)

// Handle WebSocket connections
ws.on('open', () => {
    console.log(`WebSocket connected to Binance for symbol ${symbol}`)
})

// Handle incoming WebSocket messages
ws.on('message', (data) => {
    // Parse the trade data
    const trade = JSON.parse(data)

    // Update the high and low price objects for each time interval
    const timestamp = trade.T
    const price = parseFloat(trade.p)
    for (const interval of intervals) {
        if (timestamp % interval === 0) {
            highPrices[interval] = Math.max(highPrices[interval], price)
            lowPrices[interval] = Math.min(lowPrices[interval], price)
        }
    }

    // Create a trade object with the required data
    const tradeObject = Object.freeze({
        subId: process.pid,
        exchange: 'binance',
        symbol,
        price,
        quantity: trade.q,
        timestamp
    })

    // Publish the trade object, high and low prices to Redis
    const channel = `trades:${symbol}:binance`
    const scoreValue = JSON.stringify(tradeObject)
    const cutoff = Date.now() - 60 * 60 * 1000

    redisClient.multi()
        .zadd(channel, timestamp, scoreValue)
        .zremrangebyscore(channel, 0, cutoff)
        .exec()

    for (const interval of intervals) {
        if (timestamp % interval === 0) {
            const highPriceObject = Object.freeze({
                interval,
                price: highPrices[interval]
            })
            const lowPriceObject = Object.freeze({
                interval,
                price: lowPrices[interval]
            })
            const highPriceChannel = `high:${interval}:${symbol}:binance`
            const lowPriceChannel = `low:${interval}:${symbol}:binance`

            redisClient.pipeline()
                .set(highPriceChannel, JSON.stringify(highPriceObject))
                .set(lowPriceChannel, JSON.stringify(lowPriceObject))
                .exec()
        }
    }
})

// Handle WebSocket disconnections
ws.on('close', () => {
    console.log(`WebSocket disconnected from Binance for symbol ${symbol}`)
})

// Handle SIGINT and SIGTERM signals
const shutdown = () => {
    console.log('Shutting down...')
    ws.close()
    redisClient.quit()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

const { redis } = require('./redis')
const { webSocket } = require('./binance')
const { redisIntervals, klinesIntervals } = require('../env')
const rabbit = require('./rabbitmq')
const logger = require('../utils/logger')
const R = require('ramda')
const { Ok, Err } = require('@sniptt/monads')

/**
 * Adds a watch for the specified symbols.
 * @param {string[]} symbols - The symbols to watch.
 */
const addWatch = async (symbols) => {
    try {
        logger.debug(`Accepting Symbols in addWatch: ${symbols}`)
        const intervals = await redis.getList(redisIntervals)
        const watchIntervals = intervals.length > 0 ? intervals : klinesIntervals

        const subscribeIfNeeded = async (symbol) => {
            if (!webSocket.isSubscribed(symbol)) {
                await webSocket.subscribe(symbol, watchIntervals)
            }
            return Ok() // No need to subscribe, return Ok() indicating success
        }

        const results = await Promise.all(symbols.map(subscribeIfNeeded))
        return results.every((result) => result.isOk()) ? Ok() : Err(results.find((result) => result.isErr()).error)
    } catch (error) {
        logger.error(`Error adding watch: ${error.message}`)
        return Err(error) // Return Err() to indicate failure with the error
    }
}

/**
 * Deletes the watch for the specified symbols.
 * @param {string[]} symbols - The symbols to delete the watch for.
 */
const delWatch = async (symbols) => {
    try {
        const unsubscribeIfNeeded = async (symbol) => {
            if (webSocket.isSubscribed(symbol)) {
                logger.debug(`Killing WebSocket client process for symbol ${symbol}`)
                webSocket.disconnect(symbol)
                return Ok() // Return Ok() to indicate success
            }
            logger.debug(`No WebSocket client process running for symbol ${symbol}`)
            return Ok() // No need to unsubscribe, return Ok() indicating success
        }

        const results = await Promise.all(symbols.map(unsubscribeIfNeeded))
        return results.every((result) => result.isOk()) ? Ok() : Err(results.find((result) => result.isErr()).error)
    } catch (error) {
        logger.error(`Error removing watch: ${error.message}`)
        return Err(error) // Return Err() to indicate failure with the error
    }
}

/**
 * Shuts down the application.
 */
async function shutdown() {

    logger.debug('Closing connection to WebSocket and RabbitMQ...')
    await new Promise((resolve) => setTimeout(resolve, 5000))

    const disconnectWebSocket = webSocket.disconnectAll()
    const disposeRabbitMQ = rabbit.disposeConnection()

    await Promise.all([disconnectWebSocket, disposeRabbitMQ])

    logger.debug('Buh Bye')
    process.exit(0)
}
module.exports = {
    addWatch,
    delWatch,
    shutdown,
}

const { redis } = require('./services/redis')
const { addWatch, delWatch, listWatch, shutdown } = require('./services/commands')
const { warmUp } = require('./utils/warmup')
const { updateTopSymbolsTicker, processTopSymbols } = require('./utils/monitor')
const logger = require('./utils/logger')
const { redisMinionChan } = require('./env')
const env = require('./env')

/**
 * Handles incoming messages from Redis.
 * @param {string} channel - The Redis channel the message was sent on.
 * @param {string} message - The message received from Redis.
 */
const handleMessage = async (channel, message) => {
    if (channel !== redisMinionChan) {
        return
    }

    try {
        const { type, data } = JSON.parse(message)

        switch (type) {
        case 'commands':
            logger.debug('Received commands from Redis')
            const { exchange, command, symbol } = JSON.parse(data)

            if (exchange !== 'binance') {
                logger.warn(`Unsupported exchange: ${exchange}`)
                return
            }

            handleCommand(command, symbol)
            break

        case 'top_symbols':
            logger.debug('Received top symbols from Redis')
            const topSymbols = JSON.parse(data)
            await processTopSymbols(topSymbols)
            break

        case 'intervals':
            // TODO: Handle intervals
            break

        default:
            logger.warn(`Unsupported message type: ${type}`)
            break
        }
    } catch (error) {
        logger.error(`Failed to parse message: ${message}`)
    }
}

/**
 * Handles a command based on the provided command name and symbol.
 * @param {string} command - The command to handle.
 * @param {string} symbol - The symbol associated with the command (if applicable).
 * @returns {void}
 */
const handleCommand = (command, symbol) => {
    const commandActions = {
        add_watch: () => addWatch(symbol).then(),
        del_watch: () => delWatch(symbol),
        list_watch: () => listWatch(),
        default: () => logger.warn(`Unsupported command: ${command}`)
    };

    (commandActions[command] || commandActions.default)()
}

// Perform warmup
warmUp().then(() => {
    // Schedule the updateTopSymbolsTicker function to run every [n] seconds (def. 15)
    setInterval(async () => {
        try {
            await updateTopSymbolsTicker()
        } catch (error) {
            logger.error(`Error updating top symbols ticker: ${error.message}`)
        }
    }, env.tickerInterval)

    // Subscribe to the redisMinionChan channel
    redis.sub.subscribe(redisMinionChan, error => {
        if (error) {
            logger.error(`Failed to subscribe to channel: ${error.message}`)
            return
        }
        logger.debug(`Subscribed to ${redisMinionChan} channel`)
    })

    redis.sub.on('message', handleMessage)
})

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

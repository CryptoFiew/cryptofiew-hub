const { updateTopSymbolsTicker } = require('./monitor')
const logger = require('./logger')
const { hopper } = require('../minion/hopper-mq')
const mongo = require('../services/mongo')
const {Ok, Err} = require('@sniptt/monads')

/**
 * Warms up the application by starting the hopper,
 * initializing MongoDB,
 * updating top symbols,
 * and retrieving and storing klines.
 *
 * @returns {Promise<Result<void, Error>>} - The result indicating success or error.
 */
async function warmUp() {
    logger.debug('Starting warm-up...')

    try {
        // Initialize MongoDB
        const mongoResult = await mongo.warmup()
        if (mongoResult.isErr()) {
            throw mongoResult.unwrapErr()
        }
        logger.info('MongoDB initialized successfully.')
        // Update top symbols
        const updateResult = await updateTopSymbolsTicker()
        if (updateResult.isErr()) {
            throw updateResult.unwrapErr()
        }
        const topSymbols = updateResult.unwrap()
        logger.info(`Top symbols updated: ${JSON.stringify(topSymbols)}`)

        // Retrieve and store klines
        /*
		const retrieveResult = await retrieveAndStoreKlines(topSymbols);
		if (retrieveResult.isErr()) {
			throw retrieveResult.unwrapErr();
		}
		logger.info('Klines retrieved and stored successfully.');
*/

        // Start hopper process
        hopper.start(4)
        logger.info('Hopper started successfully.')

        return Ok()
    } catch (error) {
        logger.error(`Error during warm-up: ${error.message}`)
        return Err(error)
    }
}

module.exports = {
    warmUp,
}

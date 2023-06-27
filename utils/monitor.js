const {redis} = require("../services/redis");
const {addWatch, delWatch} = require("../services/commands");
const {writeData} = require("../services/influx");
const {Spot} = require("@binance/connector");
const {webSocket} = require('../services/binance');
const {Point} = require("@influxdata/influxdb-client");
const env = require("../env");
const logger = require('../utils/logger');


/**
 •	Retrieves the 24-hour ticker data for all symbols, updates the top symbols list, and writes the ticker data to InfluxDB.
 •	@returns {Promise<Array<string>>} The updated list of top symbols.
 */
async function updateTopSymbolsTicker() {
    try {
        // Create a new Binance client with the specified API key and secret
        const client = new Spot();
        // Retrieve the ticker data for all symbols
        const response = await client.ticker24hr();
				logger.debug(`Response from 24h ticker: ${JSON.stringify(response.data.length)}`)
        if (!response.data) {
            logger.error('Error retrieving ticker data.');
            return Promise.reject(new Error('Error retrieving ticker data.'));
        }
        // Sort the top symbols by volume
        const topSymbols = response.data.sort((a, b) => b.volume - a.volume);
        // Filter and slice the top symbols list
        const filteredTopSymbols = topSymbols
            .filter(item => item.symbol.endsWith(env.monitorSymbol.toUpperCase()))
            .slice(0, env.topSymbolCount)
            .map(item => item.symbol);

				logger.debug(`filteredTopSymbols: ${filteredTopSymbols}`);
        // Process the top symbols list
        const processedTopSymbols = await processTopSymbols(filteredTopSymbols);
        // Create new points for InfluxDB
        const points = response.data.map(item => {
          return new Point('ticker_day')
            .tag('type', 'top_symbol_24h')
            .tag('openTime', item.openTime)
            .tag('source', 'updateTopSymbolsTicker')
            .floatField('priceChange', parseFloat(item.priceChange))
            .floatField('priceChangePercent', parseFloat(item.priceChangePercent))
            .floatField('weightedAvgPrice', parseFloat(item.weightedAvgPrice))
            .floatField('prevClosePrice', parseFloat(item.prevClosePrice))
            .floatField('lastPrice', parseFloat(item.lastPrice))
            .floatField('lastQty', parseFloat(item.lastQty))
            .floatField('bidPrice', parseFloat(item.bidPrice))
            .floatField('bidQty', parseFloat(item.bidQty))
            .floatField('askPrice', parseFloat(item.askPrice))
            .floatField('askQty', parseFloat(item.askQty))
            .floatField('openPrice', parseFloat(item.openPrice))
            .floatField('highPrice', parseFloat(item.highPrice))
            .floatField('lowPrice', parseFloat(item.lowPrice))
            .intField('volume', parseInt(item.volume))
            .floatField('quoteVolume', parseFloat(item.quoteVolume))
            .timestamp(new Date(item.closeTime));
        });

        // Write the ticker data to InfluxDB
        return await writeData(points).then(() => {
          logger.debug('Updated top symbols ticker successfully.');
					logger.debug(`returning processedTopSymbols: ${processedTopSymbols}`);
          return processedTopSymbols;
        });
    } catch (error) {
        logger.error(`Error retrieving or processing ticker data: ${error.message}`);
        throw error;
    }
}

/**
 * Processes the top symbols list by retrieving it from Redis, comparing it to the current list of symbols, and adding or removing symbols from the watch list as necessary.
 * @param {Array<string>} symbols - The current list of top symbols.
 * @returns {Promise<Array<string>>} The updated list of top symbols.
 */
async function processTopSymbols(symbols) {
	logger.debug(`processTopSymbols: ${symbols}`);
  try {
    // Retrieve the top symbols list from Redis
		const topSymbols = await redis.getList(env.redisTopSymbols);

    // Compare the top symbols list to the current list of symbols and determine which symbols to add or remove
    const symbolsToAdd = symbols.filter(symbol => !topSymbols.includes(symbol));
    const symbolsToRemove = topSymbols.filter(symbol => !(symbols.includes(symbol)));
    logger.debug(`symbolsToAdd: \n${JSON.stringify(symbolsToAdd)} \nsymbolsToRemove: \n${JSON.stringify(symbolsToRemove)}`);

    // Add or remove symbols from the watch list
    if (symbolsToAdd.length > 0) {
      redis.lPush(env.redisTopSymbols, symbolsToAdd);
      addWatch(symbolsToAdd); // Set isUserAdded flag to true for symbols added by the user
    }
    if (symbolsToRemove.length > 0) {
      redis.remove(env.redisTopSymbols, symbolsToRemove);
      delWatch(symbolsToRemove);
    }

		return await redis.getList(env.redisTopSymbols);
	} catch (error) {
		logger.error(`Error processing top symbols: ${error.message}`);
      throw error;
  }
}

module.exports = {
    processTopSymbols,
    updateTopSymbolsTicker
}
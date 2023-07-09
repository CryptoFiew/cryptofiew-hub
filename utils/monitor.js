const { redis } = require("../services/redis");
const { addWatch, delWatch } = require("../services/commands");
const { writeData } = require("../services/influx");
const { Spot } = require("@binance/connector");
const { Point } = require("@influxdata/influxdb-client");
const env = require("../env");
const logger = require("../models/logger");
const { Result, Ok, Err } = require("@sniptt/monads");
const R = require("ramda");
/**
 * Retrieves the 24-hour ticker data for all symbols, updates the top symbols list, and writes the ticker data to InfluxDB.
 *
 * @returns {Promise<Result<Array<string>, Error>>} - The result indicating success with the updated list of top symbols or an error.
 */
const updateTopSymbolsTicker = async () => {
  try {
    const client = new Spot(); // Create a new Binance client with the specified API key and secret
    const response = await client.ticker24hr(); // Retrieve the ticker data for all symbols

    if (!response.data) {
      throw new Error("Error retrieving ticker data.");
    }

    const topSymbols = R.pipe(
      // Filter the list based on a condition (e.g., volume > 0)
      R.filter(
        R.propSatisfies(R.endsWith(env.monitorSymbol.toUpperCase()), "symbol"),
      ),
      // Sort the list by volume in descending order
      R.sortBy(R.descend(R.prop("volume"))),
      // Take the top 20 entries
      R.take(20),
      R.reverse(),
      // Extract only the symbols
      R.pluck("symbol"),
    )(response.data);

    logger.debug(JSON.stringify(topSymbols));

    // Before: const processedTopSymbols = await processTopSymbols(topSymbols);
    const processedTopSymbolsResult = await processTopSymbols(topSymbols);
    if (processedTopSymbolsResult.isErr()) {
      const error = processedTopSymbolsResult.unwrapErr();
      throw new Error(error);
    } else {
      const processedTopSymbols = processedTopSymbolsResult.unwrap();
      const points = response.data.map((item) => {
        return new Point("ticker_day")
          .tag("type", "top_symbol_24h")
          .tag("openTime", item.openTime)
          .tag("source", "updateTopSymbolsTicker")
          .floatField("priceChange", parseFloat(item.priceChange))
          .floatField("priceChangePercent", parseFloat(item.priceChangePercent))
          .floatField("weightedAvgPrice", parseFloat(item.weightedAvgPrice))
          .floatField("prevClosePrice", parseFloat(item.prevClosePrice))
          .floatField("lastPrice", parseFloat(item.lastPrice))
          .floatField("lastQty", parseFloat(item.lastQty))
          .floatField("bidPrice", parseFloat(item.bidPrice))
          .floatField("bidQty", parseFloat(item.bidQty))
          .floatField("askPrice", parseFloat(item.askPrice))
          .floatField("askQty", parseFloat(item.askQty))
          .floatField("openPrice", parseFloat(item.openPrice))
          .floatField("highPrice", parseFloat(item.highPrice))
          .floatField("lowPrice", parseFloat(item.lowPrice))
          .intField("volume", parseInt(item.volume))
          .floatField("quoteVolume", parseFloat(item.quoteVolume))
          .timestamp(new Date(item.closeTime));
      });

      await writeData(points);

      logger.debug("Updated top symbols ticker successfully.");
      return Ok(processedTopSymbols);
    }
  } catch (error) {
    logger.error(
      `Error retrieving or processing ticker data: ${error.message}`,
    );
    return Err(error);
  }
};

/**
 * Processes the top symbols list by retrieving it from Redis, comparing it to the current list of symbols, and adding or removing symbols from the watch list as necessary.
 *
 * @param {Array<string>} symbols - The current list of top symbols.
 * @returns {Promise<Result<Array<string>, Error>>} - The result indicating success with the updated list of top symbols or an error.
 */
const processTopSymbols = async (symbols) => {
  try {
    const topSymbols = await redis.getList(env.redisTopSymbols);

    const symbolsToAdd = R.difference(symbols, topSymbols);
    const symbolsToRemove = R.difference(topSymbols, symbols);

    await Promise.all([
      symbolsToAdd.length > 0
        ? redis.lPush(env.redisTopSymbols, ...symbolsToAdd)
        : null,
      symbolsToRemove.length > 0
        ? redis.remove(env.redisTopSymbols, ...symbolsToRemove)
        : null,
    ]);

    const addWatchResult = symbolsToAdd.length > 0
      ? await addWatch(symbolsToAdd)
      : Ok();
    const delWatchResult = symbolsToRemove.length > 0
      ? await delWatch(symbolsToRemove)
      : Ok();

    if (!addWatchResult.isOk() || !delWatchResult.isOk()) {
      return Err(addWatchResult.error || delWatchResult.error);
    }

    return Ok(await redis.getList(env.redisTopSymbols));
  } catch (error) {
    logger.error(`Error processing top symbols: ${error.message}`);
    return Err(error);
  }
};

module.exports = {
  updateTopSymbolsTicker,
  processTopSymbols,
};

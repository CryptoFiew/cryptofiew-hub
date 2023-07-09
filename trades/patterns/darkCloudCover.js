/**
 * Detects the Dark Cloud Cover pattern in an array of candles.
 * @param {Candle[]} candles - The array of candlestick data.
 * @returns {boolean[]} An array indicating whether the pattern is detected for each candle pair.
 */
const detectDarkCloudCoverPattern = (candles) => {
  // Return `false` for the first candle, then map the rest
  return [
    false,
    ...candles.slice(1).map((currentCandle, i) => {
      const previousCandle = candles[i];

      return currentCandle.open > previousCandle.close &&
        currentCandle.open <=
          (previousCandle.open + previousCandle.close) / 2 &&
        currentCandle.close >= previousCandle.open &&
        currentCandle.close < previousCandle.close &&
        previousCandle.close > previousCandle.open;
    }),
  ];
};

module.exports = detectDarkCloudCoverPattern;

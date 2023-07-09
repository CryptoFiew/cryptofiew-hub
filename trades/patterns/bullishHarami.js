/**
 * Detects the Bullish Harami pattern in an array of candles.
 * @param {Candle[]} candles - The array of candlestick data.
 * @returns {boolean[]} An array indicating whether the pattern is detected for each candle pair.
 */
const detectBullishHaramiPattern = (candles) => {
  // Return `false` for the first candle, then map the rest
  return [
    false,
    ...candles.slice(1).map((currentCandle, i) => {
      const previousCandle = candles[i];

      return (currentCandle.open << 1) < (previousCandle.close << 1) &&
        (currentCandle.close << 1) > (previousCandle.open << 1) &&
        previousCandle.high > currentCandle.high &&
        previousCandle.low < currentCandle.low;
    }),
  ];
};

module.exports = detectBullishHaramiPattern;

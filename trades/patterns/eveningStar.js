/**
 * Detects the Evening Star pattern in an array of candles.
 * @param {Candle[]} candles - The array of candlestick data.
 * @returns {boolean[]} An array indicating whether the pattern is detected for each candle triple.
 */
const detectEveningStarPattern = (candles) => {
  // Start with false for the first two candles as they cannot form a pattern
  return [
    false,
    false,
    ...candles.slice(2).map((currentCandle, i) => {
      const previousCandle = candles[i + 1];
      const priorCandle = candles[i];

      return previousCandle &&
        priorCandle &&
        currentCandle.open < previousCandle.close && // Bearish gap
        currentCandle.close < previousCandle.close && // Bearish candle
        currentCandle.close > currentCandle.open && // Bullish candle
        previousCandle.close > previousCandle.open && // Bearish candle
        Math.abs(currentCandle.open - previousCandle.close) <=
          (previousCandle.close - previousCandle.open) * 0.1 && // Small body
        currentCandle.close < priorCandle.open && // Bearish close below prior candle open
        currentCandle.open > priorCandle.close; // Bullish open above prior candle close
    }),
  ];
};

module.exports = detectEveningStarPattern;

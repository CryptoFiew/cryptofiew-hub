/**
 * Detects the Gravestone Doji pattern in an array of candlestick data.
 * @param {Candle[]} candles - The array of candlestick data.
 * @returns {boolean[]} An array indicating whether the pattern is detected for each candle.
 */
const detectGravestoneDojiPattern = (candles) => {
  // Helper function to check if a candle is a Gravestone Doji
  const isGravestoneDoji = (candle, prevClose) => (
    Math.abs(candle.open - candle.close) < 0.1 * (candle.high - candle.low) &&
    candle.low === Math.min(candle.low, candle.open, candle.close) &&
    candle.open > prevClose
  );

  // Iterate through the candles and check for the Gravestone Doji pattern
  return [
    false,
    ...candles.slice(1).map((candle, index) =>
      isGravestoneDoji(candle, candles[index].close)
    ),
  ];
};

module.exports = detectGravestoneDojiPattern;

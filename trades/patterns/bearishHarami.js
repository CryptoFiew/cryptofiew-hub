/**
 * Detects the Bearish Harami pattern in an array of candles.
 * @param {Candle[]} candles - The array of candlestick data.
 * @returns {boolean[]} An array indicating whether the pattern is detected for each candle pair.
 */
const detectBearishHaramiPattern = (candles) => {
	// Return `false` for the first candle, then map the rest
	return [false, ...candles.slice(1).map((currentCandle, i) => {
		const previousCandle = candles[i];

		return currentCandle.open > previousCandle.close &&
			currentCandle.close < previousCandle.open &&
			currentCandle.open < previousCandle.open &&
			currentCandle.close > previousCandle.close &&
			previousCandle.high > currentCandle.high &&
			previousCandle.low < currentCandle.low;
	})];
};

module.exports = detectBearishHaramiPattern;

/**
 * Detects the Doji pattern in an array of candles.
 * @param {Candle[]} candles - The array of candlestick data.
 * @returns {boolean[]} An array indicating whether the pattern is detected for each candle.
 */
const detectDojiPattern = (candles) =>
	candles.map(({close, open, high, low}) => {
		const bodySize = close * 0.01;
		return (
			Math.abs(close - open) <= bodySize &&
			Math.abs(high - Math.max(close, open)) <= bodySize &&
			Math.abs(low - Math.min(close, open)) <= bodySize
		);
	});

module.exports = detectDojiPattern;

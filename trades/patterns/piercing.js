/**
 * Detects the Piercing pattern.
 * @param {Candle[]} candles - The array of candlestick data.
 * @returns {boolean} True if the pattern is detected, false otherwise.
 */
const detectPiercingPattern = (candles) =>
	candles.slice(-2).reduce(([prevCandle, isPiercingPattern], currCandle) => {
		const isOpeningBelowPreviousLow = currCandle.open < prevCandle.low;
		const isClosingAbovePreviousMidpoint = currCandle.close > (prevCandle.open + prevCandle.close) / 2;
		return [currCandle, isPiercingPattern && isOpeningBelowPreviousLow && isClosingAbovePreviousMidpoint];
	}, [candles[0], true])[1];

module.exports = detectPiercingPattern;

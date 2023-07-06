const {
	isUpperShadowAbsent,
	isLowerShadowSignificantlyLonger,
	isBodyShort,
	isBodyInTheUpperHalf,
	isUpperShadowSmall,
} = require("../algo");

/**
 * Detects the Hammer pattern in a bearish trend.
 * @param {Candle[]} candles - The array of candlestick data.
 * @returns {boolean} True if the pattern is detected, false otherwise.
 */
const detectHammerPattern = (candles) =>
	candles.slice(-2).reduce(([previousCandle, isDowntrend], currentCandle) => {
		const isBearish = previousCandle.close >= previousCandle.open;
		const isHammer = isLowerShadowSignificantlyLonger(currentCandle) &&
			isUpperShadowSmall(currentCandle) &&
			isBodyShort(currentCandle) &&
			isBodyInTheUpperHalf(currentCandle);
		return [currentCandle, isDowntrend && isBearish && isHammer];
	}, [candles[0], true])[1];

module.exports = detectHammerPattern;

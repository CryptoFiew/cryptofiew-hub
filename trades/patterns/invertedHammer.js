const { isBodyShort, isUpperShadowSignificantlyLonger, isLowerShadowSmall, isBodyInTheLowerHalf } = require("../algo");

/**
 * Detects the Inverted Hammer pattern in a bearish trend.
 * @param {Candle[]} candles - The array of candlestick data.
 * @returns {boolean} True if the pattern is detected, false otherwise.
 */
const detectInvertedHammerPattern = (candles) =>
	candles.slice(-2).reduce(([previousCandle, isDowntrend], currentCandle) => {
		const isBearish = previousCandle.close >= previousCandle.open;
		const isInvertedHammer = isUpperShadowSignificantlyLonger(currentCandle) &&
			isLowerShadowSmall(currentCandle) &&
			isBodyShort(currentCandle) &&
			isBodyInTheLowerHalf(currentCandle);
		return [currentCandle, isDowntrend && isBearish && isInvertedHammer];
	}, [candles[0], true])[1];

module.exports = detectInvertedHammerPattern;

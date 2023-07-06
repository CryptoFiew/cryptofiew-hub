const {
	isBodyShort,
	isBodyInTheUpperHalf,
	isLowerShadowSignificantlyLonger,
	isUpperShadowSmall
} = require("../algo");

/**
 * Detects the Hanging Man pattern in a bullish trend.
 * @param {Candle[]} candles - The array of candlestick data.
 * @returns {boolean} True if the pattern is detected, false otherwise.
 */
const detectHangingManPattern = (candles) =>
	candles.slice(-2).reduce(([previousCandle, isUptrend], currentCandle) => {
		const isBullish = previousCandle.close <= previousCandle.open;
		const isHangingMan = isLowerShadowSignificantlyLonger(currentCandle) &&
			isUpperShadowSmall(currentCandle) &&
			isBodyShort(currentCandle) &&
			isBodyInTheUpperHalf(currentCandle);
		return [currentCandle, isUptrend && isBullish && isHangingMan];
	}, [candles[0], true])[1];

module.exports = detectHangingManPattern;

const { isDojiStar, isUptrend, isDowntrend } = require("../algo");

/**
 * Detects the Morning Star pattern.
 * @param {Candle[]} candles - The array of candlestick data.
 * @returns {boolean} True if the pattern is detected, false otherwise.
 */
const detectMorningStarPattern = (candles) =>
	candles.slice(-3).reduce(([prevCandle, currentCandle, isMorningStarPattern], nextCandle) => {
		const isMorningStar = isDowntrend(prevCandle, currentCandle) &&
			isDojiStar(currentCandle) &&
			isUptrend(currentCandle, nextCandle);
		return [currentCandle, nextCandle, isMorningStarPattern && isMorningStar];
	}, [candles[0], candles[1], true])[2];

module.exports = detectMorningStarPattern;

/**
 * Calculates the moving average of an array of numbers over a given period.
 *
 * @param {number[]} data - The array of data points.
 * @param {number} period - The period for the moving average.
 * @returns {number|null} The moving average or null if there's not enough data.
 */
function calculateMovingAverage(data, period) {
	if (data.length < period) {
		return null;
	}

	const sum = data.slice(data.length - period).reduce((a, b) => a + b, 0);
	return sum / period;
}

/**
 * Determines the trading action (BUY, SELL, or HOLD) based on the moving average crossover algorithm.
 *
 * @param {number[]} candles - The array of candle data.
 * @param {number} fastPeriodRatio - The ratio for calculating the fast moving average period.
 * @param {number} slowPeriodRatio - The ratio for calculating the slow moving average period.
 * @returns {string|null} The trading action (BUY, SELL, or HOLD) or null if there's not enough data.
 */
function movingAverageCrossoverAlgorithm(candles, fastPeriodRatio, slowPeriodRatio) {
	const dataLength = candles.length;

	// Calculate the dynamic period based on the data length and provided ratios
	const fastPeriod = Math.floor(dataLength * fastPeriodRatio);
	const slowPeriod = Math.floor(dataLength * slowPeriodRatio);

	const fastMA = calculateMovingAverage(candles, fastPeriod);
	const slowMA = calculateMovingAverage(candles, slowPeriod);

	if (fastMA === null || slowMA === null) {
		return null;
	}

	if (fastMA > slowMA) {
		return 'BUY';
	} else if (fastMA < slowMA) {
		return 'SELL';
	} else {
		return 'HOLD';
	}
}

module.exports = movingAverageCrossoverAlgorithm;

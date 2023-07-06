const {calculateEMA} = require("../algo");

/**
 * Calculates the Moving Average Convergence Divergence (MACD) histogram based on the MACD parameters.
 *
 * @param {number[]} data - The array of data points.
 * @param {number} fastPeriod - The period for the fast EMA.
 * @param {number} slowPeriod - The period for the slow EMA.
 * @param {number} signalPeriod - The period for the signal line EMA.
 * @returns {number|null} The MACD histogram or null if there's not enough data.
 */
function calculateMACD(data, fastPeriod, slowPeriod, signalPeriod) {
	const fastEMA = calculateEMA(data, fastPeriod);
	const slowEMA = calculateEMA(data, slowPeriod);

	if (fastEMA === null || slowEMA === null) {
		return null;
	}

	const macd = fastEMA - slowEMA;
	const signalLine = calculateEMA([macd], signalPeriod);

	if (signalLine === null) {
		return null;
	}

	return macd - signalLine;
}

module.exports = calculateMACD;

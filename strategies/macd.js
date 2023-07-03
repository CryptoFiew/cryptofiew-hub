/**
 * Calculates the exponential moving average (EMA) of an array of numbers over a given period.
 *
 * @param {number[]} data - The array of data points.
 * @param {number} period - The period for the exponential moving average.
 * @returns {number|null} The exponential moving average or null if there's not enough data.
 */
function calculateEMA(data, period) {
	if (data.length < period) {
		return null;
	}

	const k = 2 / (period + 1);
	let ema = data.slice(0, period).reduce((sum, val) => sum + val, 0) / period;

	for (let i = period; i < data.length; i++) {
		ema = (data[i] * k) + (ema * (1 - k));
	}

	return ema;
}

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

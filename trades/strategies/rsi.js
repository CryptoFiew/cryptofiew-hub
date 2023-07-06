const { calculateAverageGainLoss } = require("../algo");

/**
 * Creates an array of the changes between each consecutive pair of elements in the input array.
 *
 * @param {number[]} data - The array of data points.
 * @returns {number[]} The array of changes.
 */
const calculateChanges = (data) => {
	let previousValue = data[0];
	const changes = new Array(data.length);
	changes[0] = 0;

	for (let i = 1; i < data.length; i++) {
		const value = data[i];
		changes[i] = value - previousValue;
		previousValue = value;
	}

	return changes;
}

/**
 * Calculates the Relative Strength Index (RSI) based on the RSI parameters.
 *
 * @param {number[]} data - The array of data points.
 * @param {number} period - The period for the RSI calculation.
 * @returns {number|null} - The RSI value or null if there's not enough data.
 */
const calculateRSI = (data, period) => {
	if (data.length < period) {
		return null;
	}

	const changes = calculateChanges(data);

	let { averageGain, averageLoss } = calculateAverageGainLoss(changes.slice(1, period + 1));

	for (let i = period; i < data.length; i++) {
		const change = changes[i];

		const gain = Math.max(0, change);
		const loss = Math.abs(Math.min(0, change));

		averageGain = (averageGain * (period - 1) + gain) / period;
		averageLoss = (averageLoss * (period - 1) + loss) / period;

		const relativeStrength = averageGain / averageLoss || Number.EPSILON;
		const rsi = 100 - (100 / (1 + relativeStrength));

		if (i === data.length - 1) {
			return rsi;
		}
	}
};

module.exports = calculateRSI;

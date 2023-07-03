/**
 * Calculates the mean (average) of an array of numbers.
 *
 * @param {number[]} data - The array of data points.
 * @returns {number|null} The mean or null if there's not enough data.
 */
function calculateMean(data) {
	if (data.length === 0) {
		return null;
	}

	const sum = data.reduce((a, b) => a + b, 0);
	return sum / data.length;
}

/**
 * Implements a basic mean reversion trading strategy.
 *
 * @param {number[]} prices - The array of historical prices.
 * @param {number} threshold - The deviation threshold for triggering trades.
 * @returns {string[]} An array of trade signals: "BUY", "SELL", or "HOLD".
 */
function meanReversionStrategy(prices, threshold) {
	const mean = calculateMean(prices);

	if (mean === null) {
		return [];
	}

	return prices.map(price => {
		if (price > mean + threshold) {
			return 'SELL';
		} else if (price < mean - threshold) {
			return 'BUY';
		} else {
			return 'HOLD';
		}
	});
}

module.exports = meanReversionStrategy;

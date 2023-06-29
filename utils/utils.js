const { map } = require('ramda');
const logger = require('./logger');

/**
 * Checks if two arrays are equal.
 * @param {any[]} arr1 - The first array.
 * @param {any[]} arr2 - The second array.
 * @returns {boolean} - True if the arrays are equal, false otherwise.
 */
const arraysEqual = (arr1, arr2) =>
	arr1.length === arr2.length &&
	arr1.every((value, index) => value === arr2[index]);

/**
 * Calculates the number of intervals for each given interval based on the number of days.
 * @param {string[]} intervals - The intervals to calculate.
 * @param {number} numDays - The number of days.
 * @returns {Record<string, number>} - The object containing the interval as the key and the number of intervals as the value.
 */
const calculateKlines = (intervals, numDays) => {
	const secondsInDay = 86400;

	/**
	 * Calculates the duration of an interval in seconds.
	 * @param {string} interval - The interval to calculate.
	 * @returns {number} - The duration of the interval in seconds.
	 */
	const calculateIntervalInSeconds = (interval) => {
		const numInterval = parseInt(interval);
		const intervalCharacter = interval.slice(-1);

		switch (intervalCharacter) {
			case 'm':
				return numInterval * 60;
			case 'h':
				return numInterval * 60 * 60;
			case 'd':
				return numInterval * 60 * 60 * 24;
			default:
				return numInterval;
		}
	};

	/**
	 * Calculates the number of intervals based on the number of days and interval duration.
	 * @param {number} numDays - The number of days.
	 * @param {number} intervalInSeconds - The duration of the interval in seconds.
	 * @returns {number} - The number of intervals.
	 */
	const calculateNumIntervals = (numDays, intervalInSeconds) =>
		Math.ceil((numDays * secondsInDay) / intervalInSeconds);

	/**
	 * Limits the number of intervals to a maximum of 1000.
	 * @param {number} numIntervals - The number of intervals.
	 * @returns {number} - The limited number of intervals.
	 */
	const limitNumIntervals = (numIntervals) => (numIntervals > 1000 ? 1000 : numIntervals);

	/**
	 * Calculates the interval and number of intervals.
	 * @param {string} interval - The interval to calculate.
	 * @returns {[string, number]} - The interval and the number of intervals.
	 */
	const calculateInterval = (interval) => {
		const intervalInSeconds = calculateIntervalInSeconds(interval);
		const numIntervals = calculateNumIntervals(numDays, intervalInSeconds);
		return [interval, limitNumIntervals(numIntervals)];
	};

	return Object.fromEntries(map(calculateInterval, intervals));
};

/**
 * Promisifies a function that follows the Node.js callback pattern.
 *
 * @template T
 * @param {(...args: any[]) => void} fn - The function to be promisified.
 * @returns {(...args: any[]) => Promise<T>} The promisified function.
 */
const promisify = (fn) => (...args) =>
	new Promise((resolve, reject) =>
		fn(...args, (error, result) => {
			if (error) {
				reject(error);
			} else {
				resolve(result);
			}
		})
	);

module.exports = {
	arraysEqual,
	calculateKlines,
	promisify,
};

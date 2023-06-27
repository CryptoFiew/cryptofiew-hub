const logger = require('./logger');

function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        return false;
    }
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }
    return true;
}

function calculateKlines(intervals, numDays) {
	const secondsInDay = 86400;
	const result = {};

	for (const interval of intervals) {
		const numInterval = parseInt(interval); // extract numeric part of interval
		let intervalInSeconds;

		switch (interval.slice(-1)) { // extract last character of interval
			case "m":
				intervalInSeconds = numInterval * 60;
				break;
			case "h":
				intervalInSeconds = numInterval * 60 * 60;
				break;
			case "d":
				intervalInSeconds = numInterval * 60 * 60 * 24;
				break;
			default:
				intervalInSeconds = numInterval; // assume seconds as default
		}

		const numIntervals = Math.ceil((numDays * secondsInDay) / intervalInSeconds);
		result[interval] = numIntervals > 1000 ? 1000 : numIntervals;
	}

	return result;
}

module.exports = {
  arraysEqual,
	calculateKlines,
};

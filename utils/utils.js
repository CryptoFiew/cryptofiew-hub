const logger = require('models/logger')
const R = require('ramda')
const { v4: uuidv4 } = require('uuid');

/**
 * Generates a unique ID.
 * @returns {string} The unique ID.
 */
const generateId = () => uuidv4();

/**
 * Convert a timestamp to nanoseconds.
 * @param {Date|number} timestamp The timestamp to convert. Can be a Date object, or a numeric value representing seconds/milliseconds since the epoch.
 * @param {string} targetUnit The target unit to convert to. Allowed values: 'ns', 'us', 'ms', 's'.
 * @returns {Maybe} The converted timestamp in nanoseconds wrapped in a Maybe monad.
 */
const convertToNs = (timestamp, targetUnit) => {
    const units = { ns: 1, us: 1000, ms: 1000000, s: 1000000000 }

    const { Maybe, Just, Nothing } = require('./monads') // Replace './monads' with the path to your custom Maybe monad implementation

    const toNanoseconds = value => {
        return Maybe(value).map(R.multiply(units[targetUnit]))
    }

    const toDate = value => {
        return Maybe(value).chain(timestamp => {
            if (typeof timestamp === 'number') {
                return Just(new Date(timestamp))
            }
            return Nothing()
        })
    }

    if (timestamp instanceof Date) {
        return toNanoseconds(timestamp.getTime())
    } else if (typeof timestamp === 'number') {
        return toNanoseconds(timestamp)
    } else {
        return Nothing()
    }
}
/**
 * Checks if two arrays are equal.
 * @param {any[]} arr1 - The first array.
 * @param {any[]} arr2 - The second array.
 * @returns {boolean} - True if the arrays are equal, false otherwise.
 */
const arraysEqual = (arr1, arr2) =>
    arr1.length === arr2.length &&
	arr1.every((value, index) => value === arr2[index])

/**
 * Calculates the number of intervals for each given interval based on the number of days.
 * @param {string[]} intervals - The intervals to calculate.
 * @param {number} numDays - The number of days.
 * @returns {Record<string, number>} - The object containing the interval as the key and the number of intervals as the value.
 */
const calculateKlines = (intervals, numDays) => {
    const secondsInDay = 86400
    /**
	 * Calculates the duration of an interval in seconds.
	 * @param {string} interval - The interval to calculate.
	 * @returns {number} - The duration of the interval in seconds.
	 */
    const calculateIntervalInSeconds = (interval) => {
        const numInterval = parseInt(interval)
        const intervalCharacter = interval.slice(-1)

        switch (intervalCharacter) {
        case 'm':
            return numInterval * 60
        case 'h':
            return numInterval * 60 * 60
        case 'd':
            return numInterval * 60 * 60 * 24
        default:
            return numInterval
        }
    }

    /**
	 * Calculates the number of intervals based on the number of days and interval duration.
	 * @param {number} numDays - The number of days.
	 * @param {number} intervalInSeconds - The duration of the interval in seconds.
	 * @returns {number} - The number of intervals.
	 */
    const calculateNumIntervals = (numDays, intervalInSeconds) =>
        Math.ceil((numDays * secondsInDay) / intervalInSeconds)

    /**
	 * Limits the number of intervals to a maximum of 1000.
	 * @param {number} numIntervals - The number of intervals.
	 * @returns {number} - The limited number of intervals.
	 */
    const limitNumIntervals = (numIntervals) => (numIntervals > 1000 ? 1000 : numIntervals)

    /**
	 * Calculates the interval and number of intervals.
	 * @param {string} interval - The interval to calculate.
	 * @returns {[string, number]} - The interval and the number of intervals.
	 */
    const calculateInterval = (interval) => {
        const intervalInSeconds = calculateIntervalInSeconds(interval)
        const numIntervals = calculateNumIntervals(numDays, intervalInSeconds)
        return [interval, limitNumIntervals(numIntervals)]
    }

    return Object.fromEntries(intervals.map(calculateInterval))
}

/**
 * Transforms each element in an array using a transformation function.
 *
 * @template T, U
 * @param {T[]} array - The input array.
 * @param {function(T, number, T[]): U} transformFn - The transformation function.
 * @returns {U[]} - The new array with transformed values.
 */
const map = (array, transformFn) => {
    const result = []
    for (let i = 0; i < array.length; i++) {
        result.push(transformFn(array[i], i, array))
    }
    return result
}

/**
 * Promisifies a function that follows the Node.js callback pattern.
 *
 * @template T
 * @param {(...args: any[]) => void} fn - The function to be promisified.
 * @returns {(...args: any[]) => Promise<T>} The promisified function.
 */
const promisify = (fn) => (...args) => {
    return new Promise((resolve, reject) => {
        fn(...args, (error, result) => {
            if (error) {
                reject(error)
            } else {
                resolve(result)
            }
        })
    })
}

module.exports = {
    arraysEqual,
    calculateKlines,
    promisify,
    convertToNs,
    generateId,
}

const { reduce, slice } = require('lodash/fp')
const IndicatorResult = require('../../models/indicator')

/**
 * Calculates the Simple Moving Average (SMA) of an array of numbers over a given period.
 *
 * @param {number[]} data - The array of data points.
 * @param {number} period - The period for the moving average.
 * @returns {IndicatorResult} - An instance of IndicatorResult with the SMA value, or with an empty value array if there's not enough data.
 */
const sma = (data, period) => {
    if (!Array.isArray(data) || !Number.isFinite(period) || period <= 0) {
        throw new Error('Invalid parameters. Expecting an array of numbers (data) and a positive number (period).')
    }

    const dataLength = data.length
    if (dataLength < period) {
        return new IndicatorResult({ name: 'sma' })
    }

    const sum = reduce((acc, value) => acc + value, 0, slice(0, period, data))
    const smaValue = sum / period

    return new IndicatorResult({
        name: 'sma',
        values: [smaValue]
    })
}

module.exports = sma

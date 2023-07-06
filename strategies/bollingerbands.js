/**
 * Calculates the simple moving average (SMA) of an array of numbers over a given period.
 *
 * @param {number[]} data - The array of data points.
 * @param {number} period - The period for the moving average.
 * @returns {number|null} The simple moving average or null if there's not enough data.
 */
function calculateSMA(data, period) {
    if (data.length < period) {
        return null
    }

    const sum = data.slice(0, period).reduce((a, b) => a + b, 0)
    return sum / period
}

/**
 * Calculates the upper and lower Bollinger Bands based on the Bollinger Bands parameters.
 *
 * @param {number[]} data - The array of data points.
 * @param {number} period - The period for the moving average.
 * @param {number} deviation - The standard deviation multiplier.
 * @returns {object|null} An object with the upper and lower Bollinger Bands or null if there's not enough data.
 */
function calculateBollingerBands(data, period, deviation) {
    if (data.length < period) {
        return null
    }

    const sma = calculateSMA(data, period)
    if (sma === null) {
        return null
    }

    const squaredDifferences = data.slice(0, period).map(value => Math.pow(value - sma, 2))
    const meanSquaredDifference = squaredDifferences.reduce((a, b) => a + b, 0) / period
    const standardDeviation = Math.sqrt(meanSquaredDifference)

    const upperBand = sma + (deviation * standardDeviation)
    const lowerBand = sma - (deviation * standardDeviation)

    return { upperBand, lowerBand }
}

module.exports = calculateBollingerBands

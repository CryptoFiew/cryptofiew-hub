const {calculateSMA} = require("../algo");

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

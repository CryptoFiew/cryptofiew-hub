const {calculateSMA} = require("../algo");

/**
 * Determines the trading action (BUY, SELL, or HOLD) based on the moving average crossover algorithm.
 *
 * @param {number[]} candles - The array of candle data.
 * @param {number} fastPeriodRatio - The ratio for calculating the fast moving average period.
 * @param {number} slowPeriodRatio - The ratio for calculating the slow moving average period.
 * @returns {string|null} The trading action (BUY, SELL, or HOLD) or null if there's not enough data.
 */
function movingAverageCrossoverAlgorithm(candles, fastPeriodRatio, slowPeriodRatio) {
    const dataLength = candles.length

    // Calculate the dynamic period based on the data length and provided ratios
    const fastPeriod = Math.floor(dataLength * fastPeriodRatio)
    const slowPeriod = Math.floor(dataLength * slowPeriodRatio)

    const fastMA = calculateSMA(candles, fastPeriod)
    const slowMA = calculateSMA(candles, slowPeriod)

    if (fastMA === null || slowMA === null) {
        return null
    }

    if (fastMA > slowMA) {
        return 'BUY'
    } else if (fastMA < slowMA) {
        return 'SELL'
    } else {
        return 'HOLD'
    }
}

module.exports = movingAverageCrossoverAlgorithm

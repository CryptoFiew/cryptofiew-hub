/**
 * Calculates the average gain and average loss of an array of numbers.
 *
 * @param {number[]} data - The array of data points.
 * @returns {object} An object with the average gain and average loss.
 */
function calculateAverageGainLoss(data) {
    let sumGain = 0
    let sumLoss = 0

    for (let i = 1; i < data.length; i++) {
        const diff = data[i] - data[i - 1]

        if (diff > 0) {
            sumGain += diff
        } else if (diff < 0) {
            sumLoss += Math.abs(diff)
        }
    }

    const averageGain = sumGain / data.length
    const averageLoss = sumLoss / data.length

    return { averageGain, averageLoss }
}

/**
 * Calculates the Relative Strength Index (RSI) based on the RSI parameters.
 *
 * @param {number[]} data - The array of data points.
 * @param {number} period - The period for the RSI calculation.
 * @returns {number|null} The RSI value or null if there's not enough data.
 */
function calculateRSI(data, period) {
    if (data.length < period) {
        return null
    }

    const changes = data.map((value, index) => index === 0 ? 0 : value - data[index - 1])
    const averageGainsLosses = calculateAverageGainLoss(changes.slice(1, period + 1))
    let prevAverageGain = averageGainsLosses.averageGain
    let prevAverageLoss = averageGainsLosses.averageLoss

    for (let i = period + 1; i < data.length; i++) {
        const change = changes[i]

        const gain = change > 0 ? change : 0
        const loss = change < 0 ? Math.abs(change) : 0

        const averageGain = (prevAverageGain * (period - 1) + gain) / period
        const averageLoss = (prevAverageLoss * (period - 1) + loss) / period

        prevAverageGain = averageGain
        prevAverageLoss = averageLoss
    }

    const relativeStrength = prevAverageGain / prevAverageLoss
    const rsi = 100 - (100 / (1 + relativeStrength))

    return rsi
}

module.exports = calculateRSI

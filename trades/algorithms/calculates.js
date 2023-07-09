/**
 * Calculates the Moving Average Crossover (MAC) of an array of numbers over given periods.
 *
 * @param {number[]} data - The array of data points.
 * @param {number} shortPeriod - The period for the shorter moving average.
 * @param {number} longPeriod - The period for the longer moving average.
 * @returns {number[]} - An array of MAC values or an empty array if there's not enough data.
 */
const calculateMAC = (data, shortPeriod, longPeriod) => {
    if (!Array.isArray(data) || !Number.isFinite(shortPeriod) || !Number.isFinite(longPeriod) || shortPeriod <= 0 || longPeriod <= 0) {
        throw new Error('Invalid parameters. Expecting an array of numbers (data) and positive numbers (shortPeriod, longPeriod).')
    }

    const dataLength = data.length
    if (dataLength < longPeriod) {
        return []
    }

    const calculateSMA = (data, period) => {
        const sum = data.slice(0, period).reduce((acc, value) => acc + value, 0)
        return sum / period
    }

    const mac = []
    for (let i = longPeriod - 1; i < dataLength; i++) {
        const shortSMA = calculateSMA(data.slice(i - shortPeriod + 1, i + 1), shortPeriod)
        const longSMA = calculateSMA(data.slice(i - longPeriod + 1, i + 1), longPeriod)
        mac.push(shortSMA - longSMA)
    }

    return mac
}

/**
 * Calculates the standard deviation of an array of numbers.
 *
 * @param {number[]} data - The array of data points.
 * @returns {number|null} - The standard deviation or null if there's not enough data.
 */
const calculateStdDev = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid data. Expecting an array with at least one number.')
    }

    const dataLength = data.length
    if (dataLength === 1) {
        return null // Cannot calculate standard deviation with only one data point
    }

    const mean = calculateMean(data)
    const squaredDifferencesSum = data.reduce((sum, value) => {
        const difference = value - mean
        return sum + difference * difference
    }, 0)

    const variance = squaredDifferencesSum / (dataLength - 1)
    return Math.sqrt(variance)
}

/**
 * Calculates the mean of an array of numbers.
 *
 * @param {number[]} data - The array of data points.
 * @returns {number|null} - The mean or null if there's not enough data.
 */
const calculateMean = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid data. Expecting an array with at least one number.')
    }

    const sum = data.reduce((acc, value) => acc + value, 0)
    return sum / data.length
}

/**
 * Identifies the support levels in a series of prices.
 * @param {number[]} prices - The array of prices.
 * @returns {number[]} An array of identified support levels.
 * // Example usage
 * const prices = [10, 8, 12, 9, 6, 13];
 * const supportLevels = calculateSupportLevels(prices);
 * console.log(supportLevels);
 */
const calculateSupportLevels = (prices) => {
    if (!Array.isArray(prices) || prices.length < 3) {
        throw new Error('Invalid prices data.')
    }

    const identifySupportLevels = (prevPrice, price, nextPrice) => {
        if (price < prevPrice && price < nextPrice) {
            return price
        }
        return null
    }

    const supportLevels = prices.map((price, index) => {
        if (index === 0 || index === prices.length - 1) {
            return null
        }
        return identifySupportLevels(prices[index - 1], price, prices[index + 1])
    })

    return supportLevels.filter((level) => level !== null)
}

/**
 * Identifies the resistance levels in a series of prices.
 * @param {number[]} prices - The array of prices.
 * @returns {number[]} An array of identified resistance levels.
 */
const calculateResistanceLevels = (prices) => {
    const resistanceLevels = []

    for (let i = 1; i < prices.length - 1; i++) {
        const currentPrice = prices[i]
        const prevPrice = prices[i - 1]
        const nextPrice = prices[i + 1]

        if (currentPrice > prevPrice && currentPrice > nextPrice) {
            resistanceLevels.push(currentPrice)
        }
    }

    return resistanceLevels
}

/**
 * Calculates the average gain and average loss of an array of numbers using a functional programming approach.
 *
 * @param {number[]} data - The array of data points.
 * @returns {object} An object with the average gain and average loss.
 */
const calculateAverageGainLoss = (data) => {
    const gains = data.reduce((acc, value, index) => {
        if (index === 0) {
            return acc
        }
        const diff = value - data[index - 1]
        return diff > 0 ? [...acc, diff] : acc
    }, [])

    const losses = data.reduce((acc, value, index) => {
        if (index === 0) {
            return acc
        }
        const diff = data[index - 1] - value
        return diff > 0 ? [...acc, diff] : acc
    }, [])

    const sumGain = gains.reduce((sum, value) => sum + value, 0)
    const sumLoss = losses.reduce((sum, value) => sum + value, 0)

    const averageGain = sumGain / data.length
    const averageLoss = sumLoss / data.length

    return { averageGain, averageLoss }
}


/**
 * Creates an array of the changes between each consecutive pair of elements in the input array.
 *
 * @param {number[]} data - The array of data points.
 * @returns {number[]} The array of changes.
 */
const calculateChanges = (data) => {
    let previousValue = data[0]
    const changes = new Array(data.length)
    changes[0] = 0

    for (let i = 1; i < data.length; i++) {
        const value = data[i]
        changes[i] = value - previousValue
        previousValue = value
    }

    return changes
}


module.exports = {
    calculateMAC,
    calculateStdDev,
    calculateMean,
    calculateSupportLevels,
    calculateResistanceLevels,
    calculateAverageGainLoss,
    calculateChanges,
}

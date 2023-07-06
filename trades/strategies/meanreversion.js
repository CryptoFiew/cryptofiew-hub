const {calculateMean} = require("../algo");

/**
 * Implements a basic mean reversion trading strategy.
 *
 * @param {number[]} prices - The array of historical prices.
 * @param {number} threshold - The deviation threshold for triggering trades.
 * @returns {string[]} An array of trade signals: "BUY", "SELL", or "HOLD".
 */
function meanReversionStrategy(prices, threshold) {
    const mean = calculateMean(prices)

    if (mean === null) {
        return []
    }

    return prices.map(price => {
        if (price > mean + threshold) {
            return 'SELL'
        } else if (price < mean - threshold) {
            return 'BUY'
        } else {
            return 'HOLD'
        }
    })
}

module.exports = meanReversionStrategy

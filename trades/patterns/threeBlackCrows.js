/**
 * Detects the Three Black Crows pattern.
 * @param {Candle[]} candles - The array of candlestick data.
 * @returns {boolean} True if the pattern is detected, false otherwise.
 */
const detectThreeBlackCrowsPattern = (candles) => {
    // Check if the number of candles is sufficient for the pattern
    if (candles.length < 3) {
        return false
    }

    // Retrieve the most recent three candles
    const [candle1, candle2, candle3] = candles.slice(-3)

    // Check if the candles meet the criteria for the Three Black Crows pattern
    const isDescendingPrices = candle1.close > candle2.close && candle2.close > candle3.close
    const areOpeningPricesWithinPreviousCandles = candle1.open > candle2.close && candle2.open > candle3.close

    return isDescendingPrices && areOpeningPricesWithinPreviousCandles
}

module.exports = detectThreeBlackCrowsPattern

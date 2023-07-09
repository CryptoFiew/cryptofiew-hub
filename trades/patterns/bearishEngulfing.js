/**
 * Detects the Bearish Engulfing pattern in an array of candles.
 * @param {Candle[]} candles - The array of candlestick data.
 * @returns {boolean[]} An array indicating whether the pattern is detected for each candle pair.
 */
const detectBearishEngulfingPattern = (candles) => {
    // Initialize an array of size `candles.length`. Fill it with `false` by default.
    const detectedPatterns = new Array(candles.length).fill(false)

    for (let i = 1; i < candles.length; i++) {
        const currentCandle = candles[i]
        const previousCandle = candles[i - 1]

        // If all conditions for the pattern are met, set the current position in `detectedPatterns` to `true`.
        if (
            currentCandle.open > previousCandle.close &&
			currentCandle.close < previousCandle.open &&
			currentCandle.high > previousCandle.high &&
			currentCandle.low < previousCandle.low
        ) {
            detectedPatterns[i] = true
        }
    }

    return detectedPatterns
}

module.exports = detectBearishEngulfingPattern

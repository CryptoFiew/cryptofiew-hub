const patternDetectionFunctions = {}

// Require all pattern detection functions from the patterns directory
const patternFiles = require('fs').readdirSync('./patterns')
patternFiles.forEach((patternFile) => {
    if (patternFile.endsWith('.js')) { const patternName = patternFile.slice(0, -3)
        patternDetectionFunctions[patternName] = require(`./patterns/${patternFile}`)
    }
})

/**
 * Detects common candlestick patterns in a series of candlestick data.
 * @param {Candle[]} candles - The array of candlestick data.
 * @returns {string[]} An array of detected candlestick patterns.
 */
const detectCandlestickPatterns = (candles) => {
    const detectedPatterns = []

    Object.entries(patternDetectionFunctions).forEach(([patternName, detectFunction]) => {
        if (detectFunction(candles)) {
            detectedPatterns.push(patternName)
        }
    })

    return detectedPatterns
}

module.exports = detectCandlestickPatterns

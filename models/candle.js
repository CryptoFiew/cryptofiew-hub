/**
 * Represents a single candlestick on a chart.
 *
 * The Candle class is designed for efficient calculation and storage of candlestick properties,
 * which are often used in trading algorithms for technical analysis.
 *
 * All properties are calculated upon object creation to avoid redundant calculations
 * and speed up performance. This makes the class memory-intensive, but suitable for high-frequency
 * trading where speed is crucial.
 *
 * @property {number} open - The opening price of the candlestick.
 * @property {number} close - The closing price of the candlestick.
 * @property {number} high - The highest price of the candlestick.
 * @property {number} low - The lowest price of the candlestick.
 * @property {number} volume - The trading volume during the candlestick period.
 * @property {Date} timestamp - The time at which the candlestick starts.
 * @property {number} bodyLength - The absolute difference between the open and close prices.
 * @property {number} bodyTop - The highest price between the open and close.
 * @property {number} bodyBottom - The lowest price between the open and close.
 * @property {number} highLowRange - The difference between the high and low prices.
 * @property {number} upperShadowLength - The difference between the high price and the body top.
 * @property {number} lowerShadowLength - The difference between the body bottom and the low price.
 */
class Candle {
    constructor({ open, close, high, low, volume, timestamp }) {
        this.open = open
        this.close = close
        this.high = high
        this.low = low
        this.volume = volume
        this.timestamp = timestamp

        // Calculate derived properties
        this.bodyLength = Math.abs(this.open - this.close)
        this.bodyTop = Math.max(this.open, this.close)
        this.bodyBottom = Math.min(this.open, this.close)
        this.highLowRange = this.high - this.low
        this.upperShadowLength = this.bodyTop - this.high
        this.lowerShadowLength = this.low - this.bodyBottom
    }

    /**
	 * Determines whether the body of the candle is bullish or bearish.
	 * @returns {string} 'bullish' if the close price is higher than the open price, 'bearish' otherwise.
	 */
    isBullish() {
        return this.close > this.open ? 'bullish' : 'bearish'
    }

    /**
	 * Determines whether the candle is a doji, where the open and close prices are the same.
	 * @returns {boolean} True if the open and close prices are the same, false otherwise.
	 */
    isDoji() {
        return this.open === this.close
    }

    /**
	 * Determines whether the candle represents a doji star pattern.
	 * @returns {boolean} True if the candle is a doji star, false otherwise.
	 */
    isDojiStar() {
        const shadowLengthThreshold = 0.1 * this.highLowRange
        return this.bodyLength < shadowLengthThreshold
    }

    /**
	 * Checks if the candle doesn't have an upper shadow.
	 * @returns {boolean} - Indicates whether the upper shadow is absent.
	 */
    isUpperShadowAbsent() {
        return this.high === this.bodyTop
    }

    /**
	 * Checks if the upper shadow of the candle is small compared to the body.
	 * @returns {boolean} - Indicates whether the upper shadow is small.
	 */
    isUpperShadowSmall() {
        return this.upperShadowLength < this.bodyLength
    }

    /**
	 * Checks if the upper shadow of the candle is significantly longer than the body.
	 * @returns {boolean} - Indicates whether the upper shadow is significantly longer.
	 */
    isUpperShadowSignificantlyLonger() {
        return this.upperShadowLength > 2 * this.bodyLength
    }

    /**
	 * Checks if the candle doesn't have a lower shadow.
	 * @returns {boolean} - Indicates whether the lower shadow is absent.
	 */
    isLowerShadowAbsent() {
        return this.low === this.bodyBottom
    }

    /**
	 * Checks if the lower shadow of the candle is small compared to the body.
	 * @returns {boolean} - Indicates whether the lower shadow is small.
	 */
    isLowerShadowSmall() {
        return this.lowerShadowLength < this.bodyLength
    }

    /**
	 * Checks if the lower shadow of the candle is significantly longer than the body.
	 * @returns {boolean} - Indicates whether the lower shadow is significantly longer.
	 */
    isLowerShadowSignificantlyLonger() {
        return this.lowerShadowLength > 2 * this.bodyLength
    }

    /**
	 * Determines whether the body of the candle is small, less than 25% of the total candle length.
	 * @returns {boolean} True if the body is small, false otherwise.
	 */
    isBodySmall() {
        return this.bodyLength < 0.25 * this.highLowRange
    }

    /**
	 * Determines whether the body of the candle is in the upper half of the high-low range.
	 * @returns {boolean} True if the body is in the upper half, false otherwise.
	 */
    isBodyInTheUpperHalf() {
        return this.bodyBottom > this.low + 0.5 * this.highLowRange
    }

    /**
	 * Determines whether the body of the candle is in the lower half of the high-low range.
	 * @returns {boolean} True if the body is in the lower half, false otherwise.
	 */
    isBodyInTheLowerHalf() {
        return this.bodyTop < this.high - 0.5 * this.highLowRange
    }

    /**
	 * Checks if the given candles represent a downtrend.
	 * @param {Candle} previousCandle - Previous candle.
	 * @param {Candle} currentCandle - Current candle.
	 * @returns {boolean} - Indicates whether the given candles represent a downtrend.
	 * @staticmethod
	 */
    static isDowntrend(previousCandle, currentCandle) {
        return (
            previousCandle.close > previousCandle.open &&
			currentCandle.close < currentCandle.open
        )
    }

    /**
	 * Checks if the given candles represent an uptrend.
	 * @param {Candle} currentCandle - Current candle.
	 * @param {Candle} nextCandle - Next candle.
	 * @returns {boolean} - Indicates whether the given candles represent an uptrend.
	 * @staticmethod
	 */
    static isUptrend(currentCandle, nextCandle) {
        return (
            currentCandle.close < currentCandle.open &&
			nextCandle.close > nextCandle.open
        )
    }
}

module.exports = Candle

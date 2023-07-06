/**
 * Redis Channel Message Structure
 */
class RedisChanMsg {
	constructor(type, data) {
		this.type = type
		this.data = data
	}
}

/**
 * Candlestick object structure.
 */
class Candle {
	constructor(open, high, low, close) {
		this.open = open;
		this.high = high;
		this.low = low;
		this.close = close;
	}
}

module.exports = RedisChanMsg

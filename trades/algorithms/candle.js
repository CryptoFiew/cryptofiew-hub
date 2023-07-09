class Candle {
  constructor({ open, close, high, low }) {
    this.open = open;
    this.close = close;
    this.high = high;
    this.low = low;

    this.bodyLength = Math.abs(this.open - this.close);
    this.bodyTop = Math.max(this.open, this.close);
    this.bodyBottom = Math.min(this.open, this.close);
    this.highLowRange = this.high - this.low;
    this.upperShadowLength = this.bodyTop - this.high;
    this.lowerShadowLength = this.low - this.bodyBottom;
  }

  isLowerShadowSignificantlyLonger() {
    return this.lowerShadowLength > 2 * this.bodyLength;
  }

  isUpperShadowAbsent() {
    return this.high === this.bodyTop;
  }

  isBodyShort() {
    return this.bodyLength < 0.25 * this.highLowRange;
  }

  isBodyInTheUpperHalf() {
    return this.bodyBottom > this.low + 0.5 * this.highLowRange;
  }

  isUpperShadowSmall() {
    return this.upperShadowLength < this.bodyLength;
  }

  isUpperShadowSignificantlyLonger() {
    return this.upperShadowLength > 2 * this.bodyLength;
  }

  isLowerShadowSmall() {
    return this.lowerShadowLength < this.bodyLength;
  }

  isBodyInTheLowerHalf() {
    return this.bodyTop < this.high - 0.5 * this.highLowRange;
  }

  static isDowntrend(previousCandle, currentCandle) {
    return previousCandle.close > previousCandle.open &&
      currentCandle.close < currentCandle.open;
  }

  isDojiStar() {
    const shadowLengthThreshold = 0.1 * this.highLowRange;
    return this.bodyLength < shadowLengthThreshold;
  }

  static isUptrend(currentCandle, nextCandle) {
    return currentCandle.close < currentCandle.open &&
      nextCandle.close > nextCandle.open;
  }
}

module.exports = Candle;

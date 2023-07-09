/**
 * Detects the Shooting Star pattern.
 *
 * @param {Candle[]} candles - The array of candlestick data.
 * @returns {boolean} True if the pattern is detected, false otherwise.
 */
const detectShootingStarPattern = (candles) =>
  candles.slice(-1).reduce((isShootingStar, currCandle) => {
    const isUpperShadowSignificantlyLonger =
      currCandle.high - Math.max(currCandle.open, currCandle.close) >
        2 * Math.abs(currCandle.open - currCandle.close);

    const isLowerShadowShorter =
      Math.min(currCandle.open, currCandle.close) - currCandle.low <
        0.25 * Math.abs(currCandle.open - currCandle.close);

    const isBodyInUpperHalf = Math.min(currCandle.open, currCandle.close) >
      currCandle.low + 0.5 * Math.abs(currCandle.high - currCandle.low);

    return isShootingStar && isUpperShadowSignificantlyLonger &&
      isLowerShadowShorter && isBodyInUpperHalf;
  }, true);

module.exports = detectShootingStarPattern;

const IndicatorResult = require("../../models/indicator");
const sma = require("./sma");
const ema = require("./ema");

/**
 * Calculates the Moving Average Convergence Divergence (MACD) using the given data, periods, and signal period.
 *
 * @param {number[]} data - The array of data points.
 * @param {number} shortPeriod - The period for the shorter moving average.
 * @param {number} longPeriod - The period for the longer moving average.
 * @param {number} signalPeriod - The period for the signal line moving average.
 * @returns {IndicatorResult|number|null} - The MACD value or null if there's not enough data.
 */
const macd = (data, shortPeriod, longPeriod, signalPeriod) => {
  const shortSMA = sma(data, shortPeriod);
  const longSMA = sma(data, longPeriod);

  if (shortSMA === undefined || longSMA === undefined) {
    return null;
  }

  const macdValue = shortSMA - longSMA;

  if (data.length < longPeriod + signalPeriod) {
    return macdValue;
  }

  const signalEMA = ema(data, signalPeriod);
  const histogram = macdValue - signalEMA;

  return new IndicatorResult({
    name: "MACD",
    values: [macdValue],
    metadata: { signalEMA, histogram },
  });
};

module.exports = macd;

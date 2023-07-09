const IndicatorResult = require("../../models/indicator");

/**
 * Calculates the exponential moving average (EMA) of an array of numbers over a given period.
 *
 * @param {number[]} data - The array of data points.
 * @param {number} period - The period for the exponential moving average.
 * @returns {IndicatorResult|null} - The exponential moving average as an IndicatorResult or null if there's not enough data.
 */
const ema = (data, period) => {
  if (!Array.isArray(data) || !Number.isFinite(period) || period <= 0) {
    throw new Error(
      "Invalid parameters. Expecting an array of numbers (data) and a positive number (period).",
    );
  }

  const dataLength = data.length;
  if (dataLength < period) {
    return null;
  }

  const alpha = 2 / (period + 1);
  const emaValues = [];

  let sum = 0;
  for (let i = 0; i < dataLength; i++) {
    if (i < period) {
      sum += data[i];
      emaValues.push(null);
    } else if (i === period) {
      sum += data[i];
      emaValues.push(sum / period);
    } else {
      const ema = (data[i] - emaValues[i - 1]) * alpha + emaValues[i - 1];
      emaValues.push(ema);
    }
  }

  const indicatorResult = new IndicatorResult({
    name: "EMA",
    values: emaValues,
  });

  return indicatorResult;
};

module.exports = ema;

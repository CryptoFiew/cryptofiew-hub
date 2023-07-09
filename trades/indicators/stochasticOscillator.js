const { min, max, slice } = require("lodash/fp");
const IndicatorResult = require("../../models/indicator");

/**
 * Calculates the Stochastic Oscillator of a series of prices over a specified period with the given %K and %D periods.
 *
 * @param {object[]} prices - The array of prices objects with properties: low, high, close.
 * @param {number} period - The period for the Stochastic Oscillator calculation.
 * @param {number} kPeriod - The %K period.
 * @param {number} dPeriod - The %D period.
 * @returns {IndicatorResult} An instance of IndicatorResult with the Stochastic Oscillator values (%K, %D), or with empty value array if there's not enough data.
 */
const stochasticOscillator = (prices, period, kPeriod, dPeriod) => {
  if (
    !Array.isArray(prices) || prices.length < period || kPeriod < 1 ||
    dPeriod < 1
  ) {
    throw new Error("Invalid parameters");
  }

  const calculateK = (currentClose, lows, highs) => {
    const lowestLow = min(lows);
    const highestHigh = max(highs);
    return ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
  };

  const calculateD = (kValues) => {
    const sum = kValues.reduce((sum, k) => sum + k, 0);
    return sum / kValues.length;
  };

  const kValues = prices.map((price, index) => {
    if (index >= period - 1) {
      const currentPrices = slice(index - period + 1, index + 1, prices);
      const lows = currentPrices.map((price) => price.low);
      const highs = currentPrices.map((price) => price.high);
      const currentClose = price.close;
      return calculateK(currentClose, lows, highs);
    }
    return null;
  }).filter(Boolean);

  const dValues = slice(kPeriod - 1, Infinity, kValues)
    .map((_, index) => calculateD(slice(index, index + kPeriod, kValues)));

  return new IndicatorResult({
    name: "stochasticOscillator",
    values: [...kValues, ...dValues],
    metadata: {
      kValues,
      dValues,
    },
  });
};

module.exports = stochasticOscillator;

const { calculateChanges, calculateAverageGainLoss } = require(
  "../algorithms/calculates",
);
const IndicatorResult = require("../../models/indicator");

/**
 * Calculates the Relative Strength Index (RSI) based on the RSI parameters.
 *
 * @param {number[]} data - The array of data points.
 * @param {number} period - The period for the RSI calculation.
 * @returns {IndicatorResult} An instance of IndicatorResult with RSI value, or with an empty value array if there's not enough data.
 */
const rsi = (data, period) => {
  if (data.length < period) {
    return new IndicatorResult({ name: "rsi" });
  }

  const changes = calculateChanges(data);
  const rsiValues = [];

  let { averageGain, averageLoss } = calculateAverageGainLoss(
    changes.slice(1, period + 1),
  );

  for (let i = period; i < data.length; i++) {
    const change = changes[i];

    const gain = Math.max(0, change);
    const loss = Math.abs(Math.min(0, change));

    averageGain = (averageGain * (period - 1) + gain) / period;
    averageLoss = (averageLoss * (period - 1) + loss) / period;

    const relativeStrength = averageGain / averageLoss || Number.EPSILON;
    const rsiValue = 100 - (100 / (1 + relativeStrength));

    rsiValues.push(rsiValue);
  }

  return new IndicatorResult({
    name: "rsi",
    values: rsiValues,
    metadata: {
      averageGain,
      averageLoss,
    },
  });
};

module.exports = rsi;

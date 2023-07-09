const { calculateMean, calculateStdDev } = require("../algorithms/klines");
const IndicatorResult = require("../../models/indicator");

/**
 * Implements mean reversion trading strategy.
 *
 * @param {number[]} prices - The array of historical prices.
 * @param {number} threshold - The deviation threshold for triggering trades.
 * @param {number} zScoreThreshold - The z-score threshold for triggering trades.
 * @returns {IndicatorResult} An instance of IndicatorResult with trade signals: "BUY", "SELL", or "HOLD".
 */
const meanReversion = (prices, threshold, zScoreThreshold) => {
  const mean = calculateMean(prices);

  if (mean === null) {
    return new IndicatorResult({ name: "meanReversion" });
  }

  const stdDev = calculateStdDev(prices);

  if (stdDev === null) {
    return new IndicatorResult({ name: "meanReversion" });
  }

  const tradeSignals = [];
  const zScores = prices.map((price) => (price - mean) / stdDev);

  for (let i = 0; i < prices.length; i++) {
    if (prices[i] > mean + threshold && zScores[i] > zScoreThreshold) {
      tradeSignals.push("SELL");
    } else if (prices[i] < mean - threshold && zScores[i] < -zScoreThreshold) {
      tradeSignals.push("BUY");
    } else {
      tradeSignals.push("HOLD");
    }
  }

  return new IndicatorResult({
    name: "meanReversion",
    values: tradeSignals,
    metadata: {
      mean,
      stdDev,
    },
  });
};

module.exports = meanReversion;

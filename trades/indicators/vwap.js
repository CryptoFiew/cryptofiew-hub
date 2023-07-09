const IndicatorResult = require("../../models/indicator");

/**
 * Calculates the Volume Weighted Average Price (VWAP) of a series of prices with corresponding volumes.
 *
 * @param {number[]} prices - The array of prices.
 * @param {number[]} volumes - The array of corresponding volumes.
 * @returns {IndicatorResult} An instance of IndicatorResult with the VWAP value, or with empty value array if there's not enough data or total volume is zero.
 */
const vwap = (prices, volumes) => {
  if (
    !Array.isArray(prices) ||
    !Array.isArray(volumes) ||
    prices.length !== volumes.length ||
    prices.length === 0
  ) {
    throw new Error(
      "Invalid parameters. Expecting two non-empty arrays of equal length.",
    );
  }

  let totalPriceVolumeSum = 0;
  let totalVolume = 0;

  prices.forEach((price, index) => {
    totalPriceVolumeSum += price * volumes[index];
    totalVolume += volumes[index];
  });

  if (totalVolume === 0) {
    return new IndicatorResult({
      name: "vwap",
      values: [],
      metadata: {
        totalPriceVolumeSum,
        totalVolume,
        message: "Total volume cannot be zero.",
      },
    });
  }

  const vwapValue = totalPriceVolumeSum / totalVolume;
  return new IndicatorResult({
    name: "vwap",
    values: [vwapValue],
    metadata: {
      totalPriceVolumeSum,
      totalVolume,
    },
  });
};

module.exports = vwap;

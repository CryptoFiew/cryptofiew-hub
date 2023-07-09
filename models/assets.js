class Asset {
  /**
   * @param {string} symbol - The unique identifier for the asset.
   * @param {string} name - The full name of the asset.
   */
  constructor({ symbol, name }) {
    this.symbol = symbol;
    this.name = name;
    this.price = null; // Initialized to null, should be updated when market data is available
    this.volume = 0; // Initialize volume
    this.priceHistory = []; // Hold the price history for calculations
  }

  /**
   * Updates the current price of the asset.
   * @param {number} newPrice - The updated price of the asset.
   * @param {number} newVolume - The volume of asset traded at the new price.
   */
  updatePrice(newPrice, newVolume) {
    this.price = newPrice;
    this.volume += newVolume;
    this.priceHistory.push({ price: newPrice, volume: newVolume });
  }

  /**
   * Calculate the volatility based on the price history.
   * This is a simplified calculation and may not reflect true market volatility.
   * @return {number} - The volatility of the asset.
   */
  calculateVolatility() {
    if (this.priceHistory.length < 2) {
      return 0; // Not enough data to calculate volatility
    }

    const prices = this.priceHistory.map((entry) => entry.price);
    const priceChanges = [];
    for (let i = 1; i < prices.length; i++) {
      const priceChange = Math.abs(prices[i] - prices[i - 1]);
      priceChanges.push(priceChange);
    }

    const averagePriceChange =
      priceChanges.reduce((sum, change) => sum + change, 0) /
      priceChanges.length;
    const volatility = averagePriceChange / (this.price / 100);

    return volatility;
  }
}

class AssetPair {
  /**
   * @param {Asset} baseAsset - The base asset in the pair.
   * @param {Asset} quoteAsset - The quote asset in the pair.
   */
  constructor(baseAsset, quoteAsset) {
    this.baseAsset = baseAsset;
    this.quoteAsset = quoteAsset;
    this.price = null; // Initialized to null, should be updated when market data is available
    this.volume = 0; // Initialize volume
    this.tradeHistory = []; // Hold the trade history for calculations
  }

  /**
   * Updates the current price of the asset pair.
   * This should be triggered when a new trade occurs in the market.
   * @param {number} newPrice - The updated price of the asset pair.
   * @param {number} volume - The volume of the trade at the new price.
   */
  updatePrice(newPrice, volume) {
    this.price = newPrice;
    this.volume += volume;
    this.tradeHistory.push({ price: newPrice, volume: volume });
  }

  /**
   * Calculate the volatility based on the trade history.
   * This is a simplified calculation and may not reflect true market volatility.
   * @return {number} - The volatility of the asset pair.
   */
  calculateVolatility() {
    if (this.tradeHistory.length < 2) {
      return 0; // Not enough data to calculate volatility
    }

    const prices = this.tradeHistory.map((entry) => entry.price);
    const priceChanges = [];
    for (let i = 1; i < prices.length; i++) {
      const priceChange = Math.abs(prices[i] - prices[i - 1]);
      priceChanges.push(priceChange);
    }

    const averagePriceChange =
      priceChanges.reduce((sum, change) => sum + change, 0) /
      priceChanges.length;
    const volatility = averagePriceChange / (this.price / 100);

    return volatility;
  }
}

module.exports = {
  Asset,
  AssetPair,
};

const influx = require("../services/influx");
const { AssetPair } = require("../models/assets");

class RiskManagement {
  /**
   * @param {Portfolio} portfolio - The user's portfolio.
   * @param {number} maxPortfolioRisk - The maximum allowable portfolio risk.
   */
  constructor(portfolio, maxPortfolioRisk = 0.1) {
    this.portfolio = portfolio;
    this.maxPortfolioRisk = maxPortfolioRisk;
    this.assetRisks = new Map();
  }

  /**
   * Calculates risk associated with a given asset.
   * @param {AssetPair} assetPair - The asset pair to evaluate.
   * @returns {Promise<void>}
   */
  async calculateAssetRisk(assetPair) {
    const historicalPrices = await influx.getHistoricalPrices(assetPair);
    const volatility = assetPair.calculateVolatility(historicalPrices);
    this.assetRisks.set(assetPair, volatility);
  }

  /**
   * Updates the risk of an asset in the portfolio.
   * @param {AssetPair} assetPair - The asset pair to update risk for.
   */
  updateAssetRisk(assetPair) {
    const risk = this.calculateAssetRisk(assetPair);
    this.assetRisks.set(assetPair, risk);
  }

  /**
   * Calculates total risk of the portfolio.
   * @returns {Promise<number>} - The total risk of the portfolio.
   */
  async calculatePortfolioRisk() {
    const assetCorrelations = await this.calculateAssetCorrelations();
    let portfolioRisk = 0;

    for (const [assetPair, risk] of this.assetRisks.entries()) {
      portfolioRisk += risk * assetCorrelations.get(assetPair);
    }

    return portfolioRisk;
  }

  /**
   * Calculates correlations between different assets in the portfolio.
   * @returns {Promise<Map<AssetPair, number>>} - The map of asset pairs and their calculated correlations.
   */
  async calculateAssetCorrelations() {
    // Get all distinct assets in the portfolio
    const assets = [
      ...new Set(this.portfolio.wallets.map((wallet) => wallet.asset)),
    ];

    // Fetch historical prices for all assets
    const historicalPrices = await Promise.all(
      assets.map((asset) => influx.getHistoricalPrices(asset)),
    );

    const correlations = new Map();

    // Calculate correlations between each pair of assets
    for (let i = 0; i < assets.length; i++) {
      for (let j = i + 1; j < assets.length; j++) {
        const assetPair = new AssetPair(assets[i], assets[j]);
        const correlation = this.calculateCorrelation(
          historicalPrices[i],
          historicalPrices[j],
        );
        correlations.set(assetPair, correlation);
      }
    }

    return correlations;
  }

  /**
   * Calculates the correlation between two sequences of numbers.
   * @param {Array<number>} x - The first sequence of numbers.
   * @param {Array<number>} y - The second sequence of numbers.
   * @returns {number} - The correlation coefficient.
   */
  calculateCorrelation(x, y) {
    let sumX = 0, sumY = 0, sumXY = 0;
    let squareSumX = 0, squareSumY = 0;

    for (let i = 0; i < x.length; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      squareSumX += x[i] * x[i];
      squareSumY += y[i] * y[i];
    }

    const n = x.length;
    const meanX = sumX / n;
    const meanY = sumY / n;
    const meanXY = sumXY / n;
    const squareMeanX = squareSumX / n;
    const squareMeanY = squareSumY / n;

    const varianceX = squareMeanX - meanX * meanX;
    const varianceY = squareMeanY - meanY * meanY;
    const covarianceXY = meanXY - meanX * meanY;

    return covarianceXY / Math.sqrt(varianceX * varianceY);
  }

  /**
   * Checks if a given trade would exceed risk limits.
   * @param {Trade} trade - The trade to check.
   * @returns {Promise<boolean>} - Whether the trade exceeds risk limits.
   */
  async checkTradeRisk(trade) {
    const hypotheticalPortfolio = this.portfolio.clone().executeTrade(trade);
    await this.calculateAssetRisk(
      hypotheticalPortfolio.getAssetPair(trade.assetPair),
    );
    const newPortfolioRisk = await this.calculatePortfolioRisk();

    if (
      newPortfolioRisk > this.maxPortfolioRisk ||
      trade.getValue() > this.maxTradeRisk
    ) {
      this.handleRiskEvent(trade, newPortfolioRisk);
      return false;
    }

    return true;
  }

  /**
   * Handles events where risk limits are exceeded.
   * @param {Trade} trade - The trade causing the risk limit to be exceeded.
   * @param {number} newRisk - The new risk level if the trade were to be executed.
   */
  handleRiskEvent(trade, newRisk) {
    console.error(
      `Risk limit exceeded due to potential trade ${trade.id}. Estimated risk: ${newRisk}`,
    );
    AlertService.sendRiskAlert(trade, newRisk);
  }
}

module.exports = RiskManagement;

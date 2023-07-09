/**
 * Represents a user's portfolio of assets.
 */
class Portfolio {
  /**
   * Create a new instance of Portfolio.
   * @param {string} userId - The user ID associated with the portfolio.
   */
  constructor(userId) {
    /**
     * The user ID associated with the portfolio.
     * @type {string}
     */
    this.userId = userId;

    /**
     * Collection of wallet objects in the portfolio.
     * @type {Wallet[]}
     */
    this.wallets = [];
  }

  /**
   * Add a wallet to the portfolio.
   * @param {Wallet} wallet - The wallet to add.
   */
  addWallet(wallet) {
    this.wallets.push(wallet);
  }

  /**
   * Remove a wallet from the portfolio.
   * @param {Wallet} wallet - The wallet to remove.
   */
  removeWallet(wallet) {
    const index = this.wallets.indexOf(wallet);
    if (index !== -1) {
      this.wallets.splice(index, 1);
    }
  }

  /**
   * Calculate the total value of all assets in the portfolio.
   * @returns {Promise<number>} A promise that resolves with the total value.
   */
  async calculateTotalValue() {
    let totalValue = 0;

    for (const wallet of this.wallets) {
      const balance = await wallet.getBalance();
      totalValue += balance;
    }

    return totalValue;
  }

  /**
   * Calculate the profit percentage based on the initial investment.
   * @param {number} initialInvestment - The initial investment amount.
   * @returns {Promise<number>} A promise that resolves with the profit percentage.
   */
  async calculateProfitPercentage(initialInvestment) {
    const totalValue = await this.calculateTotalValue();
    const pnl = totalValue - initialInvestment;
    const profitPercentage = (pnl / initialInvestment) * 100;
    return profitPercentage;
  }

  /**
   * Calculate the profit and loss (PnL) based on the initial investment.
   * @param {number} initialInvestment - The initial investment amount.
   * @returns {Promise<number>} A promise that resolves with the profit or loss value.
   */
  async calculatePnL(initialInvestment) {
    const totalValue = await this.calculateTotalValue();
    const pnl = totalValue - initialInvestment;
    return pnl;
  }

  // Additional methods for future enhancements can be added here
}

module.exports = {
  Portfolio,
};

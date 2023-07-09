const BaseStrategy = require('../../models/baseStrategy')

/**
 * Dollar Cost Averaging (DCA) strategy for purchasing an asset periodically.
 */
class DCAStrategy extends BaseStrategy {
    /**
   * Create an instance of DCAStrategy.
   * @param {Exchange} exchange - The exchange instance for trading.
   * @param {MarketData} marketData - The market data instance for fetching data.
   * @param {RiskManager} riskManager - The risk manager instance for managing risk.
   */
    constructor(exchange, marketData, riskManager) {
        super(exchange, marketData, riskManager)
    }

    /**
   * Set up variables and initialize the DCA strategy.
   * Override this method in derived strategy classes to initialize strategy-specific variables.
   */
    setup() {
        super.setup() // Call the setup() method of the base class if necessary

        // Implement the specific logic for setting up the DCA strategy
        // Example:
        // - Initialize DCA specific variables
        // - Set up any necessary indicators or parameters

        // Example DCA calculation using the provided function
        const investmentAmount = 1000 // Total investment amount in the base currency
        const periodicAmount = 100 // Amount to invest periodically in the base currency
        const assetPrice = 10 // Current price of the asset in the base currency

        const dcaResult = this.calculateDCA(investmentAmount, periodicAmount, assetPrice)
        console.log('DCA strategy setup completed.')
        console.log('DCA Result:', dcaResult)
    }

    /**
   * Start the DCA strategy.
   * Perform necessary setup tasks and initialization.
   */
    start() {
        super.start()
        this.setup() // Call the setup() method to initialize strategy-specific variables
        // Implement the specific logic for starting the DCA strategy
        console.log('DCA strategy started.')
    }

    /**
   * Stop the DCA strategy.
   * Clean up resources and perform necessary cleanup tasks.
   */
    stop() {
        super.stop()
        // Implement the specific logic for stopping the DCA strategy
        console.log('DCA strategy stopped.')
    }

    /**
   * Execute the DCA strategy.
   * Perform the main execution logic for the strategy.
   */
    execute() {
        super.execute()
        // Implement the specific logic for executing the DCA strategy
        // Example:
        // - Fetch necessary market data
        // - Perform calculations or analysis
        // - Make trading decisions based on strategy rules

        console.log('DCA strategy executed.')
    }

    /**
   * Calculate the Dollar Cost Averaging (DCA) for purchasing an asset.
   * @param {number} investmentAmount - The total investment amount in the base currency.
   * @param {number} periodicAmount - The amount to invest periodically in the base currency.
   * @param {number} assetPrice - The current price of the asset in the base currency.
   * @returns {object} An object with details of the DCA calculation.
   */
    calculateDCA(investmentAmount, periodicAmount, assetPrice) {
        const transactionFee = 0.00075 // Binance transaction fee of 0.075%

        const investmentWithoutFee = investmentAmount * (1 - transactionFee)
        const numSharesPurchased = investmentWithoutFee / assetPrice

        const additionalAmountWithoutFee = periodicAmount * (1 - transactionFee)
        const additionalSharesPurchased = additionalAmountWithoutFee / assetPrice

        const totalShares = numSharesPurchased + additionalSharesPurchased
        const averagePrice = investmentAmount / totalShares

        return {
            numSharesPurchased,
            additionalSharesPurchased,
            totalShares,
            averagePrice,
        }
    }
}

module.exports = DCAStrategy

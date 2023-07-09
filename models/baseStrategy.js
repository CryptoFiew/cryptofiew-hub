class BaseStrategy {
  /**
   * Create an instance of BaseStrategy.
   * @param {Exchange} exchange - The exchange instance for trading.
   * @param {MarketData} marketData - The market data instance for fetching data.
   * @param {RiskManager} riskManager - The risk manager instance for managing risk.
   */
  constructor(exchange, marketData, riskManager) {
    this.exchange = exchange;
    this.marketData = marketData;
    this.riskManager = riskManager;
    this.variables = {}; // Object to store strategy-specific variables
  }

  /**
   * Set up variables for the strategy.
   * Override this method in derived strategy classes to initialize strategy-specific variables.
   */
  setup() {
    // Implement the specific logic for setting up variables in the strategy
  }

  /**
   * Start the strategy.
   * Calls the `setup()` method to initialize variables.
   */
  start() {
    this.setup();
    // Common implementation for starting the strategy
    // ...
    console.log("Starting the strategy...");
  }

  /**
   * Stop the strategy.
   * Common implementation for stopping the strategy.
   */
  stop() {
    // Common implementation for stopping the strategy
    // ...
    console.log("Stopping the strategy...");
  }

  /**
   * Execute the strategy.
   * Common implementation for executing the strategy.
   */
  execute() {
    // Common implementation for executing the strategy
    // ...
    console.log("Executing the strategy...");
  }
}

module.exports = BaseStrategy;

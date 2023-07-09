const Trade = require("./trade");
/**
 * Class representing an order in a trading system.
 */
class Order {
  /**
   * Create an order.
   * @param {Object} details - The details of the order.
   * @param {string} details.id - The unique identifier of the order.
   * @param {number} details.timestamp - The timestamp of the order.
   * @param {string} details.side - The side of the order (buy or sell).
   * @param {number} details.price - The price of the order.
   * @param {number} details.volume - The volume of the order.
   * @param {string} details.symbol - The symbol pair of the order (e.g., "BTCUSDT").
   * @param {string} details.type - The type of the order (e.g., "market", "limit").
   * @param {number} details.stopPrice - The stop price of the order (optional).
   */
  constructor({ id, timestamp, side, price, volume, symbol, type, stopPrice }) {
    this.id = id;
    this.timestamp = timestamp;
    this.side = side;
    this.price = price;
    this.volume = volume;
    this.symbol = symbol;
    this.type = type;
    this.stopPrice = stopPrice;
    this.status = "pending"; // "pending", "completed", "cancelled", "partially_filled"
    this.remainingVolume = volume; // Tracks remaining volume for partial fills
    this.trades = []; // List of trades resulting from this order
  }

  /**
   * Get the value of the order.
   * @returns {number} The value of the order.
   */
  getValue() {
    return this.price * this.volume;
  }

  /**
   * Get the symbol of the order.
   * @returns {string} The symbol of the order.
   */
  getSymbol() {
    return this.symbol;
  }

  /**
   * Update the status of the order.
   * @param {string} status - The new status of the order.
   */
  updateStatus(status) {
    this.status = status;
    // Potentially emit event here to notify listeners of status change
  }

  /**
   * Update the remaining volume of the order based on a new trade.
   * @param {Trade} trade - The trade that has been matched with this order.
   */
  addTrade(trade) {
    this.trades.push(trade);
    this.remainingVolume -= trade.volume;
    if (this.remainingVolume === 0) {
      this.updateStatus("completed");
    } else {
      this.updateStatus("partially_filled");
    }
  }
  /**
   * Converts the order into a trade object.
   * @returns {Trade} The trade object representing the order.
   */
  toTrade() {
    const trade = new Trade({
      price: this.price,
      volume: this.volume,
      symbol: this.symbol,
      // Set additional properties based on your trade requirements
    });
    return trade;
  }

  /**
   * Cancel the order.
   * Can only be done if the order is not yet completed.
   */
  cancel() {
    if (this.status === "completed" || this.status === "cancelled") {
      throw new Error("Cannot cancel a completed or already cancelled order.");
    }
    this.updateStatus("cancelled");
  }
}

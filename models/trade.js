const { generateId } = require("../utils/utils");

/**
 * Class representing a trade in a high-frequency trading system.
 */
class Trade {
  /**
   * Create a trade.
   * @param {Order} buyOrder - The buy order involved in the trade.
   * @param {Order} sellOrder - The sell order involved in the trade.
   * @param {number} volume - The volume of assets traded.
   * @param {number} price - The price at which the assets were traded.
   * @param {string} matchEngineId - The id of the match engine that processed the trade.
   */
  constructor(buyOrder, sellOrder, volume, price, matchEngineId) {
    this.id = generateId(); // assuming this function exists
    this.buyOrderId = buyOrder.id;
    this.buyOrderUserId = buyOrder.userId; // assuming the order has this field
    this.sellOrderId = sellOrder.id;
    this.sellOrderUserId = sellOrder.userId; // assuming the order has this field
    this.volume = volume;
    this.price = price;
    this.matchEngineId = matchEngineId;
    this.timestamp = Date.now(); // Assume trade happens instantly
  }

  /**
   * Get the value of the trade.
   * @returns {number} The value of the trade.
   */
  getValue() {
    return this.price * this.volume;
  }

  /**
   * Generate a report of the trade.
   * This could be stored in a database or sent to users who participated in the trade.
   * @returns {Object} An object containing key details about the trade.
   */
  generateReport() {
    return {
      id: this.id,
      buyOrderId: this.buyOrderId,
      buyOrderUserId: this.buyOrderUserId,
      sellOrderId: this.sellOrderId,
      sellOrderUserId: this.sellOrderUserId,
      volume: this.volume,
      price: this.price,
      value: this.getValue(),
      timestamp: this.timestamp,
      matchEngineId: this.matchEngineId,
    };
  }
}

/**
 * Class representing the trading history in a trading system.
 */
class TradeHistory {
  /**
   * Create a trading history.
   * @param {string} userId - The user ID whose trades we are tracking.
   */
  constructor(userId) {
    this.userId = userId;
    this.trades = []; // List of trades
  }

  /**
   * Adds a trade to the trading history.
   * @param {Trade} trade - The trade to be added.
   */
  addTrade(trade) {
    this.trades.push(trade);
  }

  /**
   * Fetches the entire trading history.
   * @returns {Trade[]} - The list of all trades.
   */
  getTradeHistory() {
    return this.trades;
  }

  /**
   * Fetches the trade history for a specific symbol.
   * @param {string} symbol - The symbol pair to fetch the trade history for.
   * @returns {Trade[]} - The list of trades for the symbol.
   */
  getTradeHistoryBySymbol(symbol) {
    return this.trades.filter((trade) => trade.symbol === symbol);
  }

  /**
   * Fetches the trade history within a specific date range.
   * @param {Date} startDate - The start date of the date range.
   * @param {Date} endDate - The end date of the date range.
   * @returns {Trade[]} - The list of trades within the date range.
   */
  getTradeHistoryByDateRange(startDate, endDate) {
    return this.trades.filter((trade) =>
      trade.date >= startDate && trade.date <= endDate
    );
  }

  /**
   * Calculates the performance metrics based on the trades in the history.
   * @returns {Object} - The performance metrics.
   */
  calculatePerformanceMetrics() {
    // Calculate and return performance metrics
    // like win rate, average profit/loss, maximum drawdown etc.
    // This will depend on your specific trading strategy and performance evaluation metrics.

    let totalProfit = 0;
    let totalLoss = 0;
    let wins = 0;
    let losses = 0;

    for (const trade of this.trades) {
      if (trade.profit > 0) {
        totalProfit += trade.profit;
        wins++;
      } else {
        totalLoss += trade.loss;
        losses++;
      }
    }

    const winRate = wins / this.trades.length;
    const averageProfit = totalProfit / wins;
    const averageLoss = totalLoss / losses;

    return {
      winRate,
      averageProfit,
      averageLoss,
    };
  }
}

class TradeOrder {
  constructor(price, quantity) {
    this._price = price;
    this._quantity = quantity;
  }

  get price() {
    return this._price;
  }

  set price(value) {
    this._price = value;
  }

  get quantity() {
    return this._quantity;
  }

  set quantity(value) {
    this._quantity = value;
  }
}

module.exports = { Trade, TradeHistory, TradeOrder };

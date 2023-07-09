// Exchange.js

const OrderBook = require('./orderBook')

/**
 * Class that manages the overall trading.
 */
class Exchange {
    /**
   * Creates an instance of Exchange.
   */
    constructor() {
        this.assetPairs = []
        this.orderBooks = {}
        this.orders = []
        this.trades = []
    }

    /**
   * Adds an asset pair to the exchange.
   * @param {AssetPair} assetPair - The asset pair to add.
   */
    addAssetPair(assetPair) {
        this.assetPairs.push(assetPair)
        this.orderBooks[assetPair.symbol] = new OrderBook(assetPair)
    }

    /**
   * Retrieves the available asset pairs.
   * @returns {AssetPair[]} The available asset pairs.
   */
    getAssetPairs() {
        return this.assetPairs
    }

    /**
   * Retrieves the order book for the specified asset pair symbol.
   * @param {string} symbol - The symbol of the asset pair.
   * @returns {OrderBook|null} The order book for the specified asset pair symbol, or null if not found.
   */
    getOrderBook(symbol) {
        return this.orderBooks[symbol] || null
    }

    /**
   * Adds an order to the exchange.
   * @param {Order} order - The order to add.
   */
    addOrder(order) {
        this.orders.push(order)
        const orderBook = this.orderBooks[order.assetPair.symbol]
        orderBook.addBuyOrder(order)
    }

    /**
   * Executes an order by matching it against the available sell orders in the order book.
   * @param {Order} order - The order to execute.
   */
    executeOrder(order) {
        const orderBook = this.orderBooks[order.assetPair.symbol]
        orderBook.executeTrade(order.toTrade())
        this.trades.push(order.toTrade())
    }

    /**
   * Updates the market price for the specified asset pair.
   * @param {AssetPair} assetPair - The asset pair to update the market price for.
   * @param {number} price - The latest market price.
   */
    updateMarketPrice(assetPair, price) {
        const orderBook = this.orderBooks[assetPair.symbol]
        assetPair.latestPrice = price
        orderBook.sortBuyOrders()
        orderBook.sortSellOrders()
    }
}

module.exports = Exchange


/**
 * Represents the order book for a specific asset pair.
 */
class OrderBook {
    /**
   * Creates an instance of OrderBook.
   * @param {AssetPair} assetPair - The asset pair associated with the order book.
   */
    constructor(assetPair) {
        this.assetPair = assetPair
        this.buyOrders = []
        this.sellOrders = []
    }

    /**
   * Adds a buy order to the order book.
   * @param {Trade} trade - The buy order to add.
   */
    addBuyOrder(trade) {
        this.buyOrders.push(trade)
        this.sortBuyOrders()
    }

    /**
   * Adds a sell order to the order book.
   * @param {Trade} trade - The sell order to add.
   */
    addSellOrder(trade) {
        this.sellOrders.push(trade)
        this.sortSellOrders()
    }

    /**
   * Sorts the buy orders in descending order of price.
   */
    sortBuyOrders() {
        this.buyOrders.sort((a, b) => b.price - a.price)
    }

    /**
   * Sorts the sell orders in ascending order of price.
   */
    sortSellOrders() {
        this.sellOrders.sort((a, b) => a.price - b.price)
    }

    /**
   * Retrieves the best buy order (highest bid) from the order book.
   * @returns {Trade|null} The best buy order, or null if no buy orders exist.
   */
    getBestBuyOrder() {
        return this.buyOrders.length > 0 ? this.buyOrders[0] : null
    }

    /**
   * Retrieves the best sell order (lowest ask) from the order book.
   * @returns {Trade|null} The best sell order, or null if no sell orders exist.
   */
    getBestSellOrder() {
        return this.sellOrders.length > 0 ? this.sellOrders[0] : null
    }

    /**
   * Executes a trade by matching it against the available sell orders in the order book.
   * @param {TradeOrder} trade - The trade to execute.
   */
    executeTrade(trade) {
        const { quantity } = trade
        let remainingQuantity = quantity

        while (remainingQuantity > 0 && this.sellOrders.length > 0) {
            const bestSellOrder = this.getBestSellOrder()
            if (bestSellOrder.price <= trade.price) {
                if (bestSellOrder.quantity <= remainingQuantity) {
                    // Execute the entire sell order
                    remainingQuantity -= bestSellOrder.quantity
                    this.sellOrders.shift() // Remove the filled sell order
                } else {
                    // Partially execute the sell order
                    bestSellOrder.quantity -= remainingQuantity
                    remainingQuantity = 0
                }
            } else {
                // No more matching sell orders
                break
            }
        }

        if (remainingQuantity > 0) {
            // Create a new buy order with the remaining quantity
            const remainingBuyOrder = new Trade(trade.price, remainingQuantity)
            this.addBuyOrder(remainingBuyOrder)
        }

        this.sortBuyOrders()
        this.sortSellOrders()
    }
}

module.exports = OrderBook


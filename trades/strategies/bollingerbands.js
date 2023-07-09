const redis = require("../../services/redis");
const BaseStrategy = require("../../models/baseStrategy");
const { calculateSMA, calculateEMA } = require("../algorithms/klines");

class BollingerBandsStrategy extends BaseStrategy {
  constructor(exchange, marketData, riskManager) {
    super(exchange, marketData, riskManager);
  }

  start() {
    super.start();
    // Implement the specific logic for starting the Bollinger Bands strategy
    console.log("Bollinger Bands strategy started.");
  }

  stop() {
    super.stop();
    // Implement the specific logic for stopping the Bollinger Bands strategy
    console.log("Bollinger Bands strategy stopped.");
  }

  execute() {
    super.execute();
    // Get the cached market data from Redis
    const marketData = redis.sub.get(); /* specify the key or identifier */

    // Implement the specific logic for executing the Bollinger Bands strategy
    // Use the market data retrieved from Redis
    // Perform calculations or analysis
    // Make trading decisions based on strategy rules

    console.log("Bollinger Bands strategy executed.");
  }

  calculateBollingerBands(data, period, deviation, useEMA) {
    if (data.length < period) {
      return null;
    }

    let movingAverage;
    if (useEMA) {
      movingAverage = calculateEMA(data, period);
    } else {
      movingAverage = calculateSMA(data, period);
    }

    if (movingAverage === null) {
      return null;
    }

    const squaredDifferences = data
      .slice(0, period)
      .map((value) => Math.pow(value - movingAverage, 2));
    const meanSquaredDifference =
      squaredDifferences.reduce((sum, value) => sum + value, 0) / period;
    const standardDeviation = Math.sqrt(meanSquaredDifference);

    const upperBand = movingAverage + deviation * standardDeviation;
    const lowerBand = movingAverage - deviation * standardDeviation;

    return { upperBand, lowerBand };
  }
}

module.exports = BollingerBandsStrategy;

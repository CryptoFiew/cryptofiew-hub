const { WebsocketStream } = require('@binance/connector');
const { createConnection, disposeConnection, sendMessage} = require('../services/rabbitmq');
const { redis } = require('../services/redis')
const { Console } = require('console');

const WS_TRADE = 'ws-trade';
const WS_KLINE = 'ws-kline';

const logger = new Console({ stdout: process.stdout, stderr: process.stderr });

const symbol = process.argv[2]; // Get the symbol from the command line arguments

// Define the time intervals to calculate high and low prices for
const intervals = Object.freeze([5, 10, 15, 30, 60, 900, 1800, 3600, 86400, 604800, 2592000, 7776000, 15552000, 31536000, Infinity]);

// Initialize the high and low price objects for each time interval
const highPrices = Object.fromEntries(intervals.map(interval => [interval, -Infinity]));
const lowPrices = Object.fromEntries(intervals.map(interval => [interval, Infinity]));



async function main() {
    // Create RabbitMQ connections and channels
    const tradeChan = await createConnection(WS_TRADE);
    const klineChan = await createConnection(WS_KLINE);

    // define callbacks for different events
    const callbacks = {
        open: () => logger.debug('Connected with Websocket server'),
        close: () => logger.debug('Disconnected with Websocket server'),
        message: async data => {
            // Parse the trade data
            const item = JSON.parse(data);
            if (item.e === "trade") {
                await processTrade(item, tradeChan);
            }
            else if (item.e === "kline") {
                await processKline(item,klineChan);
            }
            else console.error('Not supported stream type');
        },
        error: error => {
            console.error('WebSocket error:', error);
        }
    };

    const wsStream = new WebsocketStream({ logger, callbacks });
    // subscribe ticker stream
    wsStream.trade(symbol);

    const timeIntervals = ['5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d'];
    for (const value of timeIntervals) {
        const index = timeIntervals.indexOf(value);
        wsStream.kline(symbol, value);
        logger.debug(`Element ${index}: ${value}`);
    }
}

async function processTrade(trade, channel) {
    // Update the high and low price objects for each time interval
    const timestamp = trade.T;
    const price = parseFloat(trade.p);
    for (const interval of intervals) {
        if (timestamp % interval === 0) {
            highPrices[interval] = Math.max(highPrices[interval], price);
            lowPrices[interval] = Math.min(lowPrices[interval], price);
        }
    }

    // Create a trade object with the required data
    const tradeObject = Object.freeze({
        subId: process.pid,
        exchange: 'binance',
        eventType: trade.e,
        eventTime: trade.E,
        symbol,
        tradeId: trade.t,
        price,
        quantity: parseFloat(trade.q),
        buyerOrderId: trade.b,
        sellerOrderId: trade.a,
        tradeTime: trade.T,
        isBuyerMarketMaker: trade.m,
        timestamp
    });

    // Publish the trade object, high and low prices to Redis
    const channelName = `trade:${symbol}:binance`;
    const scoreValue = JSON.stringify(tradeObject);
    const cutoff = Date.now() - 60 * 60 * 1000;

    await redis.pub.multi()
        .zadd(channelName, timestamp, scoreValue)
        .zremrangebyscore(channelName, 0, cutoff)
        .exec();

    for (const interval of intervals) {
        if (timestamp % interval === 0) {
            const highPriceObject = Object.freeze({
                interval,
                price: highPrices[interval]
            });
            const lowPriceObject = Object.freeze({
                interval,
                price: lowPrices[interval]
            });
            const highPriceChannel = `high:${interval}:${symbol}:binance`;
            const lowPriceChannel = `low:${interval}:${symbol}:binance`;

            await redis.pub.pipeline()
                .set(highPriceChannel, JSON.stringify(highPriceObject))
                .set(lowPriceChannel, JSON.stringify(lowPriceObject))
                .exec();
        }
    }

    // Send a message to the RabbitMQ queue
    await sendMessage(channel, WS_TRADE, Buffer.from(JSON.stringify(tradeObject)))
}

async function processKline(kline, channel) {
    const klineData = kline.k;
    // Create a Kline object with the required data
    const klineObject = Object.freeze({
        subId: process.pid,
        exchange: 'binance',
        eventType: kline.e,
        eventTime: kline.E,
        symbol: klineData.s,
        interval: klineData.i,
        openTime: klineData.t,
        closeTime: klineData.T,
        openPrice: parseFloat(klineData.o),
        closePrice: parseFloat(klineData.c),
        highPrice: parseFloat(klineData.h),
        lowPrice: parseFloat(klineData.l),
        volume: parseFloat(klineData.v),
        trades: klineData.n,
        isKlineClosed: klineData.x,
        quoteAssetVolume: parseFloat(klineData.q),
        takerBuyBaseAssetVolume: parseFloat(klineData.V),
        takerBuyQuoteAssetVolume: parseFloat(klineData.Q),
        ignore: klineData.B
    });

    // Publish the Kline object to Redis
    const channelName = `kline:${klineObject.symbol}:${klineObject.interval}:binance`;
    // Send a message to the RabbitMQ queue
    await sendMessage(channel, WS_KLINE, Buffer.from(JSON.stringify(klineObject)));

    const scoreValue = JSON.stringify(klineObject);
    const cutoff = Date.now() - 60 * 60 * 1000;

    await redis.pub.multi()
        .zadd(channelName, klineObject.closeTime, scoreValue)
        .zremrangebyscore(channelName, 0, cutoff)
        .exec();

}

// Handle SIGINT and SIGTERM signals
const shutdown = async () => {
    console.debug('Shutting down...');
    // close websocket stream
    setTimeout(() => {
        wsStream.disconnect();
        disposeConnection();
        disposeConnection();
    }, 6000);
};

(async () => {
    await main();
    // Handle SIGINT and SIGTERM signals
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
})();

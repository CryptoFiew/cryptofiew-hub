const Binance = require('binance-api-node').default;
require('dotenv').config();

// Set the Binance API key and secret
const binanceApiKey = process.env.BINANCE_API_KEY;
const binanceApiSecret = process.env.BINANCE_API_SECRET;

// Connect to the Binance API
const clientBinance = Binance({ apiKey: binanceApiKey, apiSecret: binanceApiSecret });

// Retrieve the 24-hour ticker price change statistics for all symbols
async function getTopSymbols(count=20) {
    if (count > 100) {
        count = 100
    }
    const tickers = await clientBinance.tickers24();
    const topSymbols = tickers
        .sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume))
        .slice(0, 20)
        .map(ticker => ticker.symbol);
    return topSymbols;
}

module.exports = {
    getTopSymbols
};

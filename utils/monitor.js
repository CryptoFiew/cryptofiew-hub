const { redis } = require("../services/redis");
const { addWatch, delWatch } = require("../services/commands");
const { writeData } = require("../services/influx");
const moment = require("moment");
const {Spot} = require("@binance/connector");

function updateMinionsFromTopSymbols(callback) {
    const channel = 'top_symbols';
    const subClient = redis.sub;

    // Subscribe to the 'top_symbols' channel
    subClient.subscribe(channel, (error) => {
        if (error) {
            callback(error);
            return;
        }
        console.log(`Subscribed to ${channel} channel`);

        // Listen for messages on the 'top_symbols' channel
        subClient.on('message', async (channel, message) => {
            try {
                const topSymbols = JSON.parse(message);

                // Check if the 'watch_list' key exists in Redis
                let watchList = await redis.pub.get('watch_list');
                if (watchList === null || watchList === undefined) {
                    // If the 'watch_list' key does not exist, create it with an empty array value
                    const setnxResult = await redis.pub.setnx('watch_list', JSON.stringify([]));
                    if (setnxResult === 1) {
                        console.log(`Created 'watch_list' key in Redis`);
                    }
                    watchList = '[]'; // Set watchList to an empty array string so that it can be parsed later
                }                    const parsedWatchList = JSON.parse(watchList);

                const symbolsToAdd = topSymbols.filter(symbol => !parsedWatchList.includes(symbol));
                const symbolsToRemove = parsedWatchList.filter(symbol => !topSymbols.includes(symbol));
                if (symbolsToAdd.length > 0) {
                    console.log(`Adding watch for symbols: ${symbolsToAdd.join(', ')}`);
                    addWatch(symbolsToAdd, false); // Set isUserAdded flag to true for symbols added by the user
                }
                if (symbolsToRemove.length > 0) {
                    console.log(`Removing watch for symbols: ${symbolsToRemove.join(', ')}`);
                    delWatch(symbolsToRemove);
                }

                callback(null, topSymbols);
            } catch (error) {
                // TODO: Handle the error appropriately, such as logging an error message or throwing the error
                console.error(`Error updating Minions from top symbols list: ${error.message}`);
                callback(error);
            }
        });
    });
}

function handleUpdateMinions(error, topSymbols) {
    if (error) {
        console.error(`Error updating Minions from top symbols list: ${error.message}`);
    } else {
        console.log(`Minions updated successfully from top symbols list: ${topSymbols.join(', ')}`);
    }
}

async function updateTopSymbolsTicker() {
    try {
        // Create a new Binance client with the specified API key and secret
        const client = new Spot();

        // Retrieve the ticker data for all symbols
        const response = await client.ticker24hr();

        // Sort the ticker data by quoteVolume and limit it to the top 100 symbols
        const topSymbols = response.data
            .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
            .slice(0, 100)
            .map(item => item.symbol);

        // Check if the top symbols list has changed
        const previousTopSymbols = await redis.pub.get('top_symbols');
        if (previousTopSymbols) {
            const parsedPreviousTopSymbols = JSON.parse(previousTopSymbols);
            if (arraysEqual(topSymbols, parsedPreviousTopSymbols)) {
                console.log('Skipping update - top symbols list has not changed');
                return;
            }
        }

        // Update the top symbols list in Redis
        await redis.pub.set('top_symbols', JSON.stringify(topSymbols));

        // Publish the top symbols list to the 'top_symbols' channel
        const channel = 'top_symbols';
        const message = JSON.stringify(topSymbols);
        redis.pub.publish(channel, message);

        // Transform the ticker data into an array of dataPoints objects
        const dataPoints = response.data.map(item => {
            return {
                metric: {
                    name: 'ticker_day',
                    tags: { symbol: item.symbol, namespace: process.env.VM_NAMESPACE },
                    job: "update_top_symbol_ticker_24h"
                },
                fields: {
                    priceChange: parseFloat(item.priceChange),
                    priceChangePercent: parseFloat(item.priceChangePercent),
                    weightedAvgPrice: parseFloat(item.weightedAvgPrice),
                    prevClosePrice: parseFloat(item.prevClosePrice),
                    lastPrice: parseFloat(item.lastPrice),
                    lastQty: parseFloat(item.lastQty),
                    bidPrice: parseFloat(item.bidPrice),
                    bidQty: parseFloat(item.bidQty),
                    askPrice: parseFloat(item.askPrice),
                    askQty: parseFloat(item.askQty),
                    openPrice: parseFloat(item.openPrice),
                    highPrice: parseFloat(item.highPrice),
                    lowPrice: parseFloat(item.lowPrice),
                    volume: parseFloat(item.volume),
                    quoteVolume: parseFloat(item.quoteVolume),
                    openTime: item.openTime,
                    closeTime: item.closeTime,
                    firstId: parseInt(item.firstId),
                    lastId: parseInt(item.lastId),
                    count: parseInt(item.count),
                },
                timestamps: moment().valueOf(),
            };
        });

        // Write the ticker data to VictoriaMetrics
        await writeData(dataPoints);


        console.log('Top symbols ticker updated successfully');
    } catch (error) {
        // TODO: Handle the error appropriately, such as logging an error message or throwing the error
        console.error(`Error updating top symbols ticker: ${error.message}`);
    }
}

function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        return false;
    }
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }
    return true;
}


module.exports = {
    updateMinionsFromTopSymbols,
    handleUpdateMinions,
    updateTopSymbolsTicker
}
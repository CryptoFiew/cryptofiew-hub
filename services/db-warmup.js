const WebSocket = require('ws');
const moment = require('moment');
const { getTopSymbols } = require('./binance');
const writeDataToVictoriaMetrics = require('./victoriametrics');
const { createMessageQueue, processMessageQueue } = require('./rabbitmq');
require('dotenv').config();

module.exports = async function monitorTopKline() {
    // Set the symbol and intervals for the kline
    const intervals = ['1s', '1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w'];

    // Retrieve the top symbols by volume
    const topSymbols = await getTopSymbols(process.env.TOP_SYMBOLS);

    // Connect to RabbitMQ and create a message queue for the kline data
    const channel = await createMessageQueue('kline_data');

    // Connect to the Binance WebSocket API for the top symbols' klines
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${topSymbols.map(symbol => `${symbol.toLowerCase()}@kline_${intervals.join('/')}`).join('/')}`);

    // Write the kline data to VictoriaMetrics
    ws.on('message', async data => {
        const kline = JSON.parse(data).data.k;
        const symbol = kline.s;
        const interval = kline.i;
        const openTime = kline.t;
        const open = kline.o;
        if (!intervals.includes(interval)) {
            return;
        }
        const dataPoints = [
            {
                metric: 'klines_open',
                timestamp: moment(openTime).valueOf(),
                value: parseFloat(open),
                tags: { symbol, interval, namespace: 'crypto-pulse' }
            }
        ];
        await writeDataToVictoriaMetrics(dataPoints);
        const message = JSON.stringify({ symbol, interval, openTime, open });
        channel.sendToQueue('kline_data', Buffer.from(message));
    });

    // Process the kline data from the message queue and write it to VictoriaMetrics
    const messageQueuePromises = intervals.flatMap(interval => {
        return topSymbols.map(symbol => {
            return processMessageQueue(channel, 'kline_data', async message => {
                const { symbol, interval, openTime, open } = JSON.parse(message.content.toString());
                const dataPoints = [
                    {
                        metric: 'klines_open',
                        timestamp: moment(openTime).valueOf(),
                        value: parseFloat(open),
                        tags: { symbol, interval, namespace: 'crypto-pulse' }
                    }
                ];
                await writeDataToVictoriaMetrics(dataPoints);
            });
        });
    });
    await Promise.all(messageQueuePromises);

    // Return a Promise that resolves when all the kline data has been written to VictoriaMetrics
    return Promise.resolve();
};

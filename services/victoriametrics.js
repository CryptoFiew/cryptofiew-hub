const moment = require("moment");
// Set the VictoriaMetrics configuration
const vmConfig = {
    url: process.env.VM_URL,
    namespace: process.env.VM_NAMESPACE
};

// Write data to VictoriaMetrics
async function writeDataToVictoriaMetrics(dataPoints) {
    const response = await fetch(vmConfig.url, {
        method: 'POST',
        body: dataPoints.join('\n')
    });
    const result = await response.text();
    return result;
}

// Write kline to VictoriaMetrics
async function getKlineData(symbols, intervals) {
    const dataPoints = [];
    // every symbols for every intervals
    // O(n^2)
    for (const symbol of symbols) {
        for (const interval of intervals) {
            const kline = await client.candles({
                symbol,
                interval,
                limit: 1000,
                endTime: moment().subtract(6, 'months').valueOf()
            });
            const klineDataPoints = kline.map(kline => ({
                metric: 'klines_open',
                timestamp: kline.openTime,
                value: parseFloat(kline.open),
                tags: { symbol, interval, namespace: 'crypto-pulse' }
            }));
            dataPoints.push(...klineDataPoints);
        }
    }
    await writeDataToVictoriaMetrics(dataPoints);
}


module.exports = {
    writeDataToVictoriaMetrics,
    getKlineData
};
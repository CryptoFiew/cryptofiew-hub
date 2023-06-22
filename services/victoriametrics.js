const moment = require('moment');

// Set the VictoriaMetrics configuration
const vmConfig = {
    url: process.env.VM_URL,
    namespace: process.env.VM_NAMESPACE,
};

// Write data to VictoriaMetrics
async function writeData(dataPoints) {
    const response = await fetch(`${vmConfig.url}/api/v1/write`, {
        method: 'POST',
        body: dataPoints.join('\n'),
    });
    if (!response.ok) {
        throw new Error(`Error writing data to VictoriaMetrics: ${response.statusText}`);
    }
    return await response.text();
}

async function queryData(query) {
    const url = `${vmConfig.url}/api/v1/query?query=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error querying data from VictoriaMetrics: ${response.statusText}`);
    }
    const json = await response.json();
    if (json.status === 'error') {
        throw new Error(json.error);
    }
    return json;
}

async function retrieveTopSymbols() {
    const query = 'query_data(metric="ticker_day") | group_by(tags.symbol) | count_values(tags.symbol) | sort_desc()';
    try {
        const response = await queryData(query);
        return response.data.result.map(result => result.metric);
    } catch (error) {
        console.error(`Error retrieving symbol list: ${error.message}`);
        throw error;
    }
}

async function checkIntervalList() {
    const query = 'query_data(metric="interval_list") | last()';
    try {
        const response = await queryData(query);
        return response.data.result.length > 0;
    } catch (error) {
        console.error(`Error checking interval list: ${error.message}`);
        throw error;
    }
}

async function retrieveIntervalList() {
    const query = 'query_data(metric="interval_list") | last()';
    try {
        const response = await queryData(query);
        if (response.data.result.length === 0) {
            throw new Error('Interval list not found in VictoriaMetrics');
        } else {
            const intervals = response.data.result[0].fields.intervals;
            return intervals.split(',');
        }
    } catch (error) {
        console.error(`Error retrieving interval list: ${error.message}`);
        throw error;
    }
}

async function queryLatestDataPoint(metric) {
    const query = `query_data(metric="${metric}") | last()`;
    try {
        const response = await queryData(query);
        const dataPoint = response.data.result[0].value;
        return {
            timestamp: dataPoint[0],
            symbol: dataPoint[1].symbol,
            interval: dataPoint[1].interval,
        };
    } catch (error) {
        console.error(`Error querying latest data point for metric ${metric}: ${error.message}`);
        throw error;
    }
}

module.exports = {
    writeData,
    queryData,
    checkIntervalList,
    queryLatestDataPoint,
    retrieveIntervalList,
    retrieveTopSymbols,
};

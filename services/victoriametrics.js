const request = require('request');

// Set the VictoriaMetrics configuration
const vmConfig = {
    url: process.env.VM_URL,
    namespace: process.env.VM_NAMESPACE,
};

// Write data to VictoriaMetrics
function writeData(dataPoints, url) {
    const promDataPoints = dataPoints.map((dataPoint) => {
        const promDataPoint = {
            labels: dataPoint.tags || {},
            samples: dataPoint.values.map((value, index) => {
                return {
                    value: value,
                    timestamp: dataPoint.timestamps[index],
                };
            }),
        };
        promDataPoint.labels.__name__ = dataPoint.metric;
        return promDataPoint;
    });

    const options = {
        url: url,
        method: 'POST',
        body: JSON.stringify({ 'data': promDataPoints }),
        headers: {
            'Content-Type': 'application/json',
        },
    };

    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) {
                reject(new Error(`Error writing data to Prometheus: ${error.message}`));
            } else if (response.statusCode !== 200) {
                reject(new Error(`Error writing data to Prometheus: ${response.statusMessage}`));
            } else {
                resolve();
            }
        });
    });
}



function queryData(query) {
    const url = `${vmConfig.url}/api/v1/query?query=${encodeURIComponent(query)}`;
    console.log(url);
    return new Promise((resolve, reject) => {
        const options = {
            url,
            method: 'GET',
            json: true,
        };
        request(options, (error, response, body) => {
            if (error) {
                reject(new Error(`Error querying data from VictoriaMetrics: ${error.message}`));
            } else if (response.statusCode !== 200) {
                reject(new Error(`Error querying data from VictoriaMetrics: ${response.statusMessage}`));
            } else if (body.status === 'error') {
                reject(new Error(body.error));
            } else {
                resolve(body);
            }
        });
    });
}


function queryLatestDataPoint(metric) {
    const query = `query_data(metric='${metric}') | last()`;
    return queryData(query)
        .then(response => {
            const dataPoint = response.data.result[0].value;
            return {
                timestamp: dataPoint[0],
                symbol: dataPoint[1].symbol,
                interval: dataPoint[1].interval,
            };
        })
        .catch(error => {
            console.error(`Error querying latest data point for metric ${metric}: ${error.message}`);
            throw error;
        });
}

module.exports = {
    writeData,
    queryData,
    queryLatestDataPoint,
};

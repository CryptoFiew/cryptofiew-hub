const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const env = require('../env');

// Create a new InfluxDB client instance
const influx = new InfluxDB({
    url: env.influxUrl,
    token: env.influxToken,
});

function writeData(dataPoints) {
    const influxDB = new InfluxDB({ url: env.influxUrl, token: env.influxToken });
    const writeApi = influxDB.getWriteApi(env.influxOrg, env.influxBucket);

    writeApi.useDefaultTags({ region: 'west' });

    dataPoints.forEach((dataPoint) => {
        const point = new Point(dataPoint.metric)
            .tag(dataPoint.tags)
            .floatField('value', dataPoint.values[0])
            .timestamp(new Date(dataPoint.timestamps[0] * 1000));
        console.log(point.toString());
        writeApi.writePoint(point);
    });

    return writeApi.close().then(() => {
        console.log('WRITE FINISHED');
    }).catch((error) => {
        throw new Error(`Error writing data to InfluxDB: ${error.message}`);
    });
}

// Query data from InfluxDB
function queryData(query) {
    const queryApi = influx.getQueryApi(env.influxOrg);
    return queryApi.collectRows(query);
}

// Query the latest data point for a metric from InfluxDB
function queryLatestDataPoint(metric) {
    const query = `
    from(bucket: "${env.influxBucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r._measurement == "${metric}")
      |> last()
  `;
    return queryData(query)
        .then((result) => {
            const dataPoint = result[0];
            return {
                timestamp: new Date(dataPoint._time).getTime(),
                symbol: dataPoint.symbol,
                interval: dataPoint.interval,
            };
        })
        .catch((error) => {
            console.error(`Error querying latest data point for metric ${metric}: ${error.message}`);
            throw error;
        });
}

module.exports = {
    writeData,
    queryData,
    queryLatestDataPoint,
};

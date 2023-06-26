const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const { influxUrl, influxToken, influxOrg, influxBucket } = require('../env');
const { error } = require("../utils/logger");

// Create a new InfluxDB client instance
const influx = new InfluxDB({ url: influxUrl, token: influxToken });
const writeApi = influx.getWriteApi(influxOrg, influxBucket);

/**
 * Writes data points to InfluxDB.
 * @param {Point[]} points - The data points to write.
 * @returns {Promise<void>} - A promise that resolves when the write is complete.
 */
function writeData(points) {
	writeApi.useDefaultTags({ region: 'au' });

	points.forEach((point) => {
		writeApi.writePoint(point);
	});

	return writeApi.close();
}

/**
 * Queries data from InfluxDB using the specified query.
 * @param {string} query - The InfluxQL query to execute.
 * @returns {Promise<object[]>} - A promise that resolves with an array of query results.
 */
function queryData(query) {
	const queryApi = influx.getQueryApi(influxOrg);
	return queryApi.collectRows(query);
}

/**
 * Queries the latest data point for the specified metric from InfluxDB.
 * @param {string} metric - The metric to query the latest data point for.
 * @returns {Promise<object>} - A promise that resolves with an object containing the timestamp, symbol, and interval of the latest data point.
 */
function queryLatestDataPoint(metric) {
	const query = `
    from(bucket: "${influxBucket}")
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
		.catch((err) => {
			error(`Error querying latest data point for metric ${metric}: ${err.message}`);
			throw err;
		});
}

module.exports = {
	writeData,
	queryData,
	queryLatestDataPoint,
};

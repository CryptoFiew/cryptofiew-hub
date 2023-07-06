const { Agent } = require('http')
const { InfluxDB, Point } = require('@influxdata/influxdb-client')
const { influxUrl, influxToken, influxOrg, influxBucket } = require('../env')
const logger = require('../utils/logger')

const agent = new Agent({
    keepAlive: true, // Reuse existing connection
})

// Create a new InfluxDB client instance
const influx = new InfluxDB({
    url: influxUrl,
    token: influxToken,
    transportOptions: { agent },
})

const writeApi = influx.getWriteApi(influxOrg, influxBucket)
const queryApi = influx.getQueryApi(influxOrg)

process.on('exit', () => agent.destroy())

/**
 * Writes data points to InfluxDB.
 * @param {Point[]} points - The data points to write.
 * @returns {Promise<void>} - A promise that resolves when the write is complete.
 */
const writeData = (points) =>
    Promise.resolve()
        .then(() => points.forEach((point) => writeApi.writePoint(point)))
        .catch((err) => {
            logger.error(`Error writing data points to InfluxDB: ${err.message}`)
            throw err
        }).finally(() => writeApi.flush())

/**
 * Queries data from InfluxDB using the specified query.
 * @param {string} query - The InfluxQL query to execute.
 * @returns {Promise<object[]>} - A promise that resolves with an array of query results.
 */
const queryData = (query) =>
    queryApi
        .collectRows(query)
        .catch((err) => {
            logger.error(`Error querying data from InfluxDB: ${err.message}`)
            throw err
        })

/**
 * Queries the latest data point for the specified metric from InfluxDB.
 * @param {string} metric - The metric to query the latest data point for.
 * @returns {Promise<object>} - A promise that resolves with an object containing the timestamp, symbol, and interval of the latest data point.
 */
const queryLatestDataPoint = (metric) => {
    const query = `
    from(bucket: "${influxBucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r._measurement == "${metric}")
      |> last()
  `

    return queryData(query)
        .then((result) => {
            const dataPoint = result[0]
            return {
                timestamp: new Date(dataPoint._time).getTime(),
                symbol: dataPoint.symbol,
                interval: dataPoint.interval,
            }
        })
        .catch((err) => {
            logger.error(`Error querying latest data point for metric ${metric}: ${err.message}`)
            throw err
        })
}

const queryMetricData = (metric) => {
    const query = `from(bucket: "${influxBucket}") |> range(start: -1d) |> filter(fn: (r) => r._measurement == "${metric}"}`
    const result = []
    const tables = queryApi.collectRows(query)
    for (table in tables) {
        result.push(table)
    }
    return result
}

module.exports = {
    writeData,
    queryData,
    queryMetricData,
    queryLatestDataPoint,
}

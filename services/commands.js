const { redis } = require('./redis');
const { webSocket } = require("./binance");
const { redisIntervals, klinesIntervals } = require("../env");
const rabbit = require("./rabbitmq");
const logger = require("../utils/logger");

/**
 * Adds a watch for the specified symbols.
 * @param {string[]} symbols - The symbols to watch.
 */
async function addWatch(symbols) {
	try {
		const intervals = await redis.getList(redisIntervals);
		const watchIntervals = intervals.length ? intervals : klinesIntervals;

		const subscribeIfNeeded = (symbol) => {
			if (!webSocket.isSubscribed(symbol)) {
				logger.debug(`Adding watch for symbol ${symbol}`);
				return webSocket.connect()
					.then((stream) => webSocket.subscribe(stream, symbol, watchIntervals));
			}
		};

		await Promise.all(symbols.map(subscribeIfNeeded));
	} catch (err) {
		logger.error(`Error getting intervals hash: ${err.message}`);
	}
}

/**
 * Deletes the watch for the specified symbols.
 * @param {string[]} symbols - The symbols to delete the watch for.
 */
function delWatch(symbols) {
	logger.debug(`Deleting watch for symbols: ${symbols.join(', ')}`);

	symbols.forEach((symbol) => {
		if (webSocket.isSubscribed(symbol)) {
			logger.debug(`Killing WebSocket client process for symbol ${symbol}`);
			webSocket.disconnect(symbol);
		} else {
			logger.debug(`No WebSocket client process running for symbol ${symbol}`);
		}
	});
}

/**
 * Shuts down the application.
 */
async function shutdown() {

	logger.debug('Closing connection to WebSocket and RabbitMQ...');
	await new Promise((resolve) => setTimeout(resolve, 5000));

	const disconnectWebSocket = webSocket.disconnectAll();
	const disposeRabbitMQ = rabbit.disposeConnection();

	await Promise.all([disconnectWebSocket, disposeRabbitMQ]);

	logger.debug('Buh Bye');
	process.exit(0);
}
module.exports = {
	addWatch,
	delWatch,
	shutdown,
};

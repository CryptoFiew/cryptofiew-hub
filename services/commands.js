const { redis } = require('./redis');
const { webSocket } = require("./binance");
const { debug, error } = require("../utils/logger");
const { redisIntervals, klinesIntervals } = require("../env");
const rabbit = require("./rabbitmq");
const logger = require("../utils/logger");

/**
 * Adds a watch for the specified symbols.
 * @param {string[]} symbols - The symbols to watch.
 */
async function addWatch(symbols) {
	try {
		const intervals = await redis.pub.hgetall(redisIntervals);
		const intervalKeys = Object.keys(intervals);

		const watchIntervals = intervalKeys.length ? intervalKeys : klinesIntervals;

		symbols.forEach(symbol => {
			if (webSocket.isSubscribed(symbol)) {
				return;
			}

			debug(`Adding watch for symbol ${symbol}`);
			webSocket.connect()
				.then((stream) => {
					webSocket.subscribe(stream, symbol, watchIntervals);
				});
		});
	} catch (err) {
		error(`Error getting intervals hash: ${err.message}`);
	}
}

/**
 * Deletes the watch for the specified symbols.
 * @param {string[]} symbols - The symbols to delete the watch for.
 */
function delWatch(symbols) {
	debug(`Deleting watch for symbols: ${symbols.join(', ')}`);

	for (const symbol of symbols) {
		if (webSocket.isSubscribed(symbol)) {
			debug(`Killing WebSocket client process for symbol ${symbol}`);
			webSocket.disconnect(symbol);
		} else {
			debug(`No WebSocket client process running for symbol ${symbol}`);
		}
	}
}

/**
 * Shuts down the application.
 */
function shutdown() {
	debug('Shutting down...');
	setTimeout(() => webSocket.disconnectAll(), 5_000);
	rabbit.disposeConnection().then(() => {
		console.log('Disconnected from RabbitMQ');
		process.exit(0);
	});
}

module.exports = {
	addWatch,
	delWatch,
	shutdown,
};

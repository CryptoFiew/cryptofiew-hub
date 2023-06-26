const { writeData } = require('../services/influx');
const { Point } = require("@influxdata/influxdb-client");
const amqp = require("amqp-connection-manager");
const env = require("../env");
const logger = require("../utils/logger");
let workerProcesses = []; // An array to hold worker process objects
let [successKlines, successTrades, failedKlines, failedTrades] = [0, 0, 0, 0]; // Variables for tracking message statuses

/**
 * WebSocket stream event callbacks.
 */
const callbacks = {
	open: () => {},
	close: () => {},
	error: (error) => {
		logger.error(`Error connecting to WebSocket stream for symbol ${symbol}: ${error.message}`);
	},
	message: (data) => {
		handleMessage(data, messageCallback);
	},
};

/**
 * Message event callbacks for WebSocket stream messages.
 */
const messageCallback = {
	kline: (data) => {
		handleKlineMessage(data);
	},
	trade: (data) => {
		handleTradeMessage(data);
	},
};

// Schedule the status counter function to run every 10 seconds
setInterval(() => {
	logger.info(`Hopper Status (10s)
    \nSuccess: [K:${successKlines} T:${successTrades}(${successKlines + successTrades})]
    \nFailed:  [K:${failedKlines} T:${failedTrades}(${failedKlines + failedTrades})]`);
	[successKlines, successTrades, failedKlines, failedTrades] = [0, 0, 0, 0];
}, 10000);

/**
 * Connects to RabbitMQ and creates a channel for the hopper to use.
 */
const hopper = amqp.connect([env.rabbitmqUrl]);

// Log when the hopper connects to RabbitMQ
hopper.on('connect', () => {
	logger.debug('Hopper connected to RabbitMQ');
});

// Log errors when the hopper disconnects from RabbitMQ
hopper.on('disconnect', (err) => {
	logger.error('Disconnected from RabbitMQ', err.stack);
});

/**
 * The channel used by the hopper to receive messages from RabbitMQ.
 */
const hopperChan = hopper.createChannel({
	json: true,
	setup: (ch) => {
		ch.assertQueue(env.wsBinance, { durable: true });
	}
});

/**
 * Starts the hopper, which creates a specified number of worker processes.
 * @returns {void}
 */
function startHopper() {
	logger.info(`Hopper started`);

	const start = (numThreads) => {
		for (let i = 0; i < numThreads; i++) {
			startWorkerProcess((workerProcess) => {
				// Run the worker process
				workerProcess.main()
					.then(() => {
						if (!workerProcess.stopped) {
							logger.info(`Hopper No.${workerProcesses.indexOf(workerProcess) + 1} finished`);
							const index = workerProcesses.indexOf(workerProcess);
							workerProcesses.splice(index, 1);
							if (workerProcesses.length === 0) {
								logger.info(`Hopper finished`);
							}
						}
					})
					.catch((err) => {
						logger.error(`Error in Hopper No.${workerProcesses.indexOf(workerProcess) + 1}: ${err}`);
					});
			});
		}
	};

	const stop = () => {
		logger.debug(`Stopping Hopper`);
		workerProcesses.forEach((workerProcess) => workerProcess.stop());
	};

	return {
		start,
		stop,
	};
}

/**
 * Starts a worker process by creating a new function and adding it to the workerProcesses list.
 * @param {function} callback - A callback function that will receive the worker process object.
 * @returns {void}
 */
function startWorkerProcess(callback) {
	logger.info(`Starting Hopper No.${workerProcesses.length + 1}`);

	// Define the main function
	function main() {
		return hopperChan.consume(env.wsBinance, handleMessage, { noAck: true });
	}

	// Define the worker process object
	const workerProcess = {
		main,
		stop: () => {
			logger.info(`Stopping Hopper No.${workerProcesses.indexOf(workerProcess) + 1}`);
			workerProcess.stopped = true;
		},
		stopped: false,
	};

	// Add the worker process to the list
	workerProcesses.push(workerProcess);

	// Call the callback with the worker process object
	callback(workerProcess);
}

/**
 * Handle incoming WebSocket messages.
 * @param {string} data - The message data.
 * @param {object} callbacks - The message callbacks for handling Trade and Kline messages.
 */
const handleMessage = (data, callbacks) => {
	const bufferPayload = data.content.toString();
	const item = JSON.parse(bufferPayload);
	if (!item.stream) {
		return;
	}
	const dataType = item.stream.split('@')[1].split('_')[0];
	const callback = callbacks[dataType];

	if (callback) {
		callback(item.data);
	} else {
		logger.error('Not supported stream type');
	}
}

function handleTradeMessage(message) {
	if (message === null) return;
	const payload = JSON.parse(Buffer.from(message.data))

	const point = new Point(`binance_trade_${payload.symbol}`)
		.tag('asset', payload.symbol)
		.tag('type', payload.eventType)
		.tag('source', 'minions')
		.tag('isBuyerMarketMaker', payload.isBuyerMarketMaker)
		.intField('trade_id', payload.tradeId)
		.floatField('price', payload.price)
		.floatField('quantity', payload.quantity)
		.timestamp(new Date(payload.timestamp));

	writeData([point])
		.then(() => {
			successTrades++;
		})
		.catch((error) => {
			logger.error(`Error when inserting Trades from rabbit: ${error}`)
			failedTrades++;
		});
}

function handleKlineMessage(message) {
	if (message === null) return;
	const payload = JSON.parse(Buffer.from(message.data))

	const point = new Point(`binance_kline_${payload.symbol}`)
		.tag('source', 'minions')
		.tag('asset', payload.symbol)
		.tag('type', payload.eventType)
		.tag('interval', payload.interval)
		.floatField('openPrice', payload.openPrice)
		.floatField('closePrice', payload.closePrice)
		.floatField('highPrice', payload.highPrice)
		.floatField('lowPrice', payload.lowPrice)
		.floatField('volume', payload.volume)
		.intField('trades', payload.trades)
		.floatField('quoteAssetVolume', payload.quoteAssetVolume)
		.timestamp(new Date(payload.openTime));

	writeData([point])
		.then(() => {
			successKlines++;
		})
		.catch((error) => {
			logger.error(`Error when inserting Klines from rabbit: ${error}`)
			failedKlines++;
		});
}




module.exports = {
	hopper: startHopper
}


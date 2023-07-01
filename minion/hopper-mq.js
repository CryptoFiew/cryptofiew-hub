const { writeData } = require('../services/influx');
const { Point } = require("@influxdata/influxdb-client");
const amqp = require("amqp-connection-manager");
const env = require("../env");
const logger = require("../utils/logger");
const {consumeQueuePromise} = require("../services/rabbitmq");
const workerProcesses = []; // An array to hold worker process objects
let [successKlines, successTrades, failedKlines, failedTrades] = [0, 0, 0, 0]; // Variables for tracking message statuses

/**
 * Message event callbacks for WebSocket stream messages.
 */
const callbacks = {
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
}, 10_000);

/**
 * Connects to RabbitMQ and creates a channel for the hopper to use.
 */
const connection = amqp.connect([env.rabbitmqUrl]);

// Log when the hopper connects to RabbitMQ
connection.on('connect', () => {
	logger.debug('Hopper connected to RabbitMQ');
});

/**
 * The channel used by the hopper to receive messages from RabbitMQ.
 */
const channelWrapper = connection.createChannel({
	json: true,
	setup: (channel) => {
		return Promise.all([
			channel.assertQueue(env.wsBinance, { noAck: false })
		]);
	}
});

// Log errors when the hopper disconnects from RabbitMQ
connection.on('disconnect', (err) => {
	logger.error(`Hopper disconnected from RabbitMQ: ${JSON.stringify(err)}`);
});


/**
 * Starts the hopper, which creates a specified number of worker processes.
 * @param {number} numThreads - The number of worker processes to start.
 * @returns {void}
 */
function start(numThreads) {
	logger.info(`Hopper started`);
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
}

function stop() {
	logger.debug(`Stopping Hopper`);
	workerProcesses.forEach((workerProcess) => workerProcess.stop());
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
		return consumeQueuePromise(env.wsBinance, handleMessage)
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
 * @param {any} data - The message data.
 */
function handleMessage(data) {
	const item = JSON.parse(data.content.toString());
	if (!item.data) {
		return;
	}

	const payload = JSON.parse(item.data);
	logger.debug(`Payload: \n${JSON.stringify(payload, null, 2)}`);
	const callback = callbacks[payload.eventType];

	if (callback) {
		callback(payload);
	} else {
		logger.error('Not supported stream type');
	}

	// Manually acknowledge the message
	data.ack();
}

function handleTradeMessage(message) {
	if (message === null) return;
	const payload = message;
	logger.debug(`Writing Trade to InfluxDB: \n${JSON.stringify(payload, null, 2)}`);

	const point = new Point(`binance_trade_${payload.symbol}`)
		.tag('asset', payload.symbol)
		.tag('type', payload.eventType)
		.tag('source', 'minions')
		.tag('isBuyerMarketMaker', payload.isBuyerMarketMaker)
		.intField('trade_id', payload.tradeId)
		.floatField('price', payload.price)
		.floatField('quantity', payload.quantity)
		.timestamp(new Date(payload.timestamp));

	logger.debug(`Writing Trade to InfluxDB: \n${JSON.stringify(payload, null, 2)}`);
	writeData([point])
		.then(() => {
			successTrades++;
		})
		.catch((error) => {
			logger.error(`Error when inserting Trades from rabbit: ${error}`);
			failedTrades++;
		});
}

function handleKlineMessage(message) {
	if (message === null) return;
	const payload = message;
	logger.debug(`Writing Kline to InfluxDB: \n${JSON.stringify(payload, null, 2)}`);

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
		.timestamp(new Date(payload.timestamp));

	writeData([point])
		.then(() => {
			successKlines++;
		})
		.catch((error) => {
			logger.error(`Error when inserting Klines from rabbit: ${error}`);
			failedKlines++;
		});
}

module.exports = {
	hopper: {
		start,
		stop
	}
};

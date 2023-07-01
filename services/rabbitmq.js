const amqp = require('amqp-connection-manager');
const logger = require('../utils/logger');

const env = require('../env');
const {promisify} = require("../utils/utils");

// Set up connection manager
const connectionManager = amqp.connect([env.rabbitmqUrl]);

/**
 * Handles connection errors.
 */
connectionManager.on('connect', () => {
	logger.debug('Connected to RabbitMQ');
});

/**
 * Handles disconnection errors.
 * @param {Error} err - The disconnection error.
 */
connectionManager.on('disconnect', (err) => {
	logger.error('Disconnected from RabbitMQ:', err.stack);
});

// Create a RabbitMQ channel and assert two durable queues for Kline and Trade messages
const channelWrapper = connectionManager.createChannel({
	json: true,
	setup: (ch) => {
		ch.assertQueue(env.wsBinance, { durable: true });
	},
});

// Create a channel for sending messages
const sendChannel = channelWrapper;

/**
 * Sends a message to a queue.
 * @param {string} queueName - The name of the queue to send the message to.
 * @param {object} message - The message to send.
 * @param {number} [priority=0] - The priority of the message.
 * @param {number} [expiration] - The expiration time of the message.
 * @returns {Promise} A promise that resolves when the message is sent successfully.
 */
const sendQueue = (queueName, message, priority = 0, expiration) => {
	const options = {
		persistent: true,
		priority,
	};
	if (expiration) {
		options.expiration = expiration;
	}

	return promisify(sendChannel.sendToQueue.bind(sendChannel))(queueName, message, options)
		.then(() => {
			/* Message sent successfully */
		})
		.catch((error) => {
			logger.error(`Failed to send message to queue ${queueName}: ${error.message}`);
			throw error;
		});
};

/**
 * Consumes messages from a queue until the application is about to exit.
 * @param {string} queueName - The name of the queue to consume messages from.
 * @param {Function} callback - The callback function to call when a message is received.
 * @returns {Promise} A promise that resolves when the application is about to exit.
 */
const consumeQueuePromise = (queueName, callback) => {
	/**
	 * Promise that resolves when the consume process is about to exit.
	 * @type {Promise<void>}
	 */
	let consumePromise;

	return new Promise((resolve, reject) => {
		channelWrapper.addSetup((channel) => {
			channel.assertQueue(queueName, { durable: true });

			consumePromise = new Promise((consumeResolve, consumeReject) => {
				channel.consume(queueName, async (message) => {
					try {
						await callback(message);
					} catch (error) {
						reject(error);
					}
				}, { noAck: true });  // Set noAck to true for auto-acknowledgment

				/**
				 * Event handler for beforeExit event that cancels all consumers and resolves the consumePromise.
				 */
				const beforeExitHandler = () => {
					channel.cancelAllConsumers();
					consumeResolve();
				};

				// Register the beforeExit event handler
				process.on('beforeExit', beforeExitHandler);
			});

			// Resolve the outer promise with the consumePromise
			resolve(consumePromise);
		});
	});
};

/**
 * Closes the connection manager.
 * @returns {Promise} A promise that resolves when the connection manager has been closed.
 */
const disposeConnection = () =>
	new Promise((resolve) => {
		connectionManager.close();
		resolve();
	});

module.exports = {
	sendQueue,
	consumeQueuePromise,
	disposeConnection,
};

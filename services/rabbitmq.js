const amqp = require('amqp-connection-manager');
const logger = require('../utils/logger');

const env = require('../env');

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
 */
connectionManager.on('disconnect', (err) => {
	logger.error('Disconnected from RabbitMQ:', err.stack);
});

// Create a RabbitMQ channel and assert two durable queues for Kline and Trade messages
const channelWrapper = connectionManager.createChannel({
	json: true,
	setup: (ch) => {
		ch.assertQueue(env.wsBinance, { durable: true });
	}
});

// Create a channel for sending messages
const sendChannel = channelWrapper

/**
 * Sends a message to a queue.
 * @param {string} queueName - The name of the queue to send the message to.
 * @param {object} message - The message to send.
 * @param {number} priority - The priority of the message.
 * @param {number} expiration - The expiration time of the message.
 * @param {function} callback - The callback function to call when the message is sent.
 */
function sendQueue(queueName, message, priority = 0, expiration = undefined, callback) {
	const options = {
		persistent: true,
		priority,
	};
	if (expiration) {
		options.expiration = expiration;
	}

	// Send the message to the queue using the sendChannel
	const sent = sendChannel.sendToQueue(queueName, message, options);

	if (!sent) {
		const error = new Error(`Failed to send message to queue ${queueName}`);
		logger.error(error.message);
		return callback(error);
	}

	return callback(null);
}
/**
 * Consumes messages from a queue.
 * @param {string} queueName - The name of the queue to consume messages from.
 * @param {function} callback - The callback function to call when a message is received.
 * @param {object} options - The options for consuming messages.
 * @returns {object} - The consumer tag.
 */
function consumeQueue(queueName, callback, options = {}) {
	options = { ...options, noAck: true }
	return channelWrapper.consume(queueName, (message) => {
		callback(message)
			.then(() => {
				channelWrapper.ack(message);
			})
			.catch((error) => {
				logger.error('Error processing message:', error);
				channelWrapper.nack(message);
			});
	}, options);
}

/**
 * Consumes messages from a queue and returns a promise.
 * @param {string} queueName - The name of the queue to consume messages from.
 * @param {function} callback - The callback function to call when a message is received.
 * @param {object} options - The options for consuming messages.
 * @returns {Promise<void>} - A promise that resolves when all messages have been consumed.
 */
function consumeQueuePromise(queueName, callback, options = { }) {
	options = { ...options, noAck: true }
	return new Promise((resolve, reject) => {
		const consumerTag = channelWrapper.consume(queueName, (message) => {
			logger.debug('Calling!');
			Promise.resolve(callback(message))
				.then(() => {
					resolve();
				})
				.catch((error) => {
					logger.error('Error processing message:', error);
					reject(error);
				});
		}, options);
		if (!consumerTag) {
			reject(new Error(`Failed to consume messages from queue ${queueName}`));
		}
	});
}

/**
 * Closes the connection manager.
 * @returns {Promise<void>} - A promise that resolves when the connection manager has been closed.
 */
function disposeConnection() {
	return connectionManager.close();
}

module.exports = {
	sendQueue,
	consumeQueue,
	consumeQueuePromise,
	disposeConnection,
};

const amqp = require('amqplib');

// Connect to RabbitMQ and create a message queue
async function createMessageQueue(queueName) {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    await channel.assertQueue(queueName, { durable: false });
    return channel;
}

// Process messages from the message queue
async function processMessageQueue(channel, queueName, callback) {
    await channel.consume(queueName, message => {
        callback(message);
        channel.ack(message);
    });
}

module.exports = {
    createMessageQueue,
    processMessageQueue
};

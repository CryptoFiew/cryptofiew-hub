const amqp = require('amqplib');

let connection;
const channels = {};

async function createConnection(queueName, durable = true) {
    if (!connection) {
        connection = await amqp.connect(process.env.RABBITMQ_URL);
    }

    let channel = channels[queueName];

    if (!channel) {
        channel = await connection.createChannel();
        channels[queueName] = channel;

        const queue = await channel.checkQueue(queueName);

        if (!queue || queue.durable !== durable) {
            await channel.deleteQueue(queueName);
            await channel.assertQueue(queueName, { durable });
        }
    }

    return channel;
}

async function disposeConnection() {
    for (const queueName in channels) {
        const channel = channels[queueName];
        await channel.close();
        delete channels[queueName];
    }

    if (connection) {
        await connection.close();
        connection = null;
    }
}

async function sendMessage(channel, queueName, message) {
    const sent = channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)));
    if (!sent) {
        throw new Error(`Failed to send message to queue ${queueName}`);
    }
}

async function consumeQueue(channel, queueName, callback, options = {}) {
    const queue = await channel.checkQueue(queueName);
    if (!queue) {
        throw new Error(`Queue ${queueName} not found`);
    }
    await channel.prefetch(options.prefetchCount || 1);
    await channel.consume(queueName, async message => {
        try {
            await callback(JSON.parse(message.content.toString()));
            channel.ack(message);
        } catch (error) {
            console.error('Error processing message:', error);
            channel.nack(message);
        }
    }, options);
}

module.exports = {
    createConnection,
    disposeConnection,
    sendMessage,
    consumeQueue,
};

const amqp = require('amqplib');
const influx = require('@influxdata/influxdb-client');
const env = require('../env');

// Create the InfluxDB client and write API objects outside of the message handler functions
const influxDB = new influx.InfluxDB({ url: env.influxUrl, token: env.influxToken });
const writeApi = influxDB.getWriteApi(env.influxOrg, env.influxBucket);

const handleTradeMessage = async (message) => {
    if (message === null) return;

    const { content, fields } = message;
    const peel = JSON.parse(Buffer.from(content));
    const decodedMessage = JSON.parse(Buffer.from(peel.data))

    writeApi.useDefaultTags({ exchange: fields.exchange, source: 'minions' });

    const point = new influx.Point(`binance_trade_${decodedMessage.symbol}`)
        .tag('eventType', decodedMessage.eventType)
        .tag('isBuyerMarketMaker', decodedMessage.isBuyerMarketMaker)
        .floatField('price', decodedMessage.price)
        .floatField('quantity', decodedMessage.quantity)
        .timestamp(new Date(decodedMessage.timestamp));

    writeApi.writePoint(point);
};

const handleKlineMessage = async (message) => {
    if (message === null) return;
    const { content, fields } = message;

    const peel = JSON.parse(Buffer.from(content));
    const decodedMessage = JSON.parse(Buffer.from(peel.data))

    writeApi.useDefaultTags({ exchange: fields.exchange, source: 'minions' });

    const point = new influx.Point(`binance_kline_${decodedMessage.symbol}`)
        .tag('interval', decodedMessage.interval)
        .floatField('openPrice', decodedMessage.openPrice)
        .floatField('closePrice', decodedMessage.closePrice)
        .floatField('highPrice', decodedMessage.highPrice)
        .floatField('lowPrice', decodedMessage.lowPrice)
        .floatField('volume', decodedMessage.volume)
        .timestamp(new Date(decodedMessage.closeTime));

    writeApi.writePoint(point);
};

const main = async () => {
    // Connect to RabbitMQ and create a channel to consume messages
    const connection = await amqp.connect(env.rabbitmqUrl);
    const channel = await connection.createChannel();

    // Declare the ws-trade and ws-kline queues and bind them to the channel
    await channel.assertQueue('ws-trade');
    await channel.assertQueue('ws-kline');

    // Consume messages from the ws-trade and ws-kline queues and process them
    await channel.consume('ws-trade', handleTradeMessage, { noAck: true });
    await channel.consume('ws-kline', handleKlineMessage, { noAck: true });

    // Monitor for new queues and add them to the list of queues to consume messages from
    connection.on('queueDeclare', async (queue) => {
        if (queue.queue === 'ws-trade') {
            await channel.assertQueue('ws-trade');
            await channel.consume('ws-trade', handleTradeMessage, { noAck: true });
        } else if (queue.queue === 'ws-kline') {
            await channel.assertQueue('ws-kline');
            await channel.consume('ws-kline', handleKlineMessage, { noAck: true });
        }
    });
};

main().catch((err) => console.error('Error:', err));

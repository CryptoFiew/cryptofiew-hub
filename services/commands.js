const { spawn } = require('child_process');
const { redis } = require('./redis');
const dotenv = require('dotenv');
dotenv.config();

// Store the child processes in a map
const childProcesses = new Map();

function addWatch(symbol) {
    console.log(`Adding watch for symbol ${symbol}`);

    // Check if a child process is already running for this symbol
    if (childProcesses.has(symbol)) {
        console.log(`WebSocket client process already running for symbol ${symbol}`);
        return;
    }

    // Execute the binance-ws.js script as a separate node process
    const clientProcess = spawn('node', ['minion/binance-ws.js', symbol]);
    const clientProcessId = clientProcess.pid.toString();
    console.log(`Started WebSocket client process for symbol ${symbol}: PID ${clientProcessId}`);

    // Save the child process ID to Redis and the childProcesses map
    redis.pub.lpush('minions', JSON.stringify({ exchange: 'binance', command: 'add_watch', symbol }));
    redis.pub.hset('processes', symbol, clientProcessId);
    childProcesses.set(symbol, clientProcess);

    // Listen for the process to exit
    clientProcess.on('exit', (code, signal) => {
        console.log(`WebSocket client process ended for symbol ${symbol}: PID ${clientProcessId}, code ${code}, signal ${signal}`);
        redis.pub.publish('minion_telephone_ended', JSON.stringify({ exchange: 'binance', command: 'add_watch', symbol }));
        redis.pub.hdel('processes', symbol).then(() => {
            console.log(`Removed process ID for symbol ${symbol} from Redis`);
        }).catch((error) => {
            console.error(`Failed to remove process ID from Redis: ${error.message}`);
        });
        childProcesses.delete(symbol);
    });
}

function delWatch(symbol) {
    console.log(`Deleting watch for symbol ${symbol}`);

    // Check if a child process is running for this symbol
    if (childProcesses.has(symbol)) {
        const clientProcess = childProcesses.get(symbol);
        const clientProcessId = clientProcess.pid.toString();
        console.log(`Killing WebSocket client process for symbol ${symbol}: PID ${clientProcessId}`);
        clientProcess.kill();
        childProcesses.delete(symbol);

        // Remove the process ID from Redis
        redis.pub.hdel('processes', symbol).then(() => {
            console.log(`Removed process ID for symbol ${symbol} from Redis`);
        }).catch((error) => {
            console.error(`Failed to remove process ID from Redis: ${error.message}`);
        });
    } else {
        console.log(`No WebSocket client process running for symbol ${symbol}`);
    }
}

function listWatch() {
    console.log(`Listing active watches`);

    // Get the list of active watches from the childProcesses map
    const watches = Array.from(childProcesses.keys());
    console.log(`Active watches: ${watches.join(', ')}`);

    // Publish the list of active watches to the minion_telephone channel
    const watchesJson = JSON.stringify(watches);
    redis.pub.publish('minion_telephone', watchesJson);
}

// Handle SIGINT and SIGTERM signals
function shutdown() {
    console.log('Shutting down...');
    for (const [symbol, clientProcess] of childProcesses.entries()) {
        const clientProcessId = clientProcess.pid.toString();
        console.log(`Killing WebSocket client process for symbol ${symbol}: PID ${clientProcessId}`);
        clientProcess.kill();
        redis.pub.hdel('processes', symbol).then(() => {
            console.log(`Removed process ID for symbol ${symbol} from Redis`);
        }).catch((error) => {
            console.error(`Failed to remove process ID from Redis: ${error.message}`);
        });
    }
    process.exit(0);
}

// Handle Redis connection errors
redis.pub.on('error', (err) => {
    console.error('Error connecting to Redis:', err);
});

redis.sub.on('error', (err) => {
    console.error('Error connecting to Redis:', err);
});

// Subscribe to the shutdown channel and listen for signals
redis.sub.subscribe('minion_telephone_shutdown', (err, count) => {
    if (err) {
        console.error('Error subscribing to minion_telephone_shutdown:', err);
        return;
    }
    console.log(`Subscribed to minion_telephone_shutdown channel with ${count} subscriber(s)`);
});

redis.sub.on('message', (channel, message) => {
    if (channel === 'minion_telephone_shutdown') {
        console.log('Received shutdown signal from Redis');
        shutdown();
    }
});

module.exports = {
    addWatch,
    delWatch,
    listWatch,
};

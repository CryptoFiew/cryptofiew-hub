const fs = require("fs");
const path = require('path');
const env = require("../env");

// Constants
const isDebug = env.debug;
const logsDir = path.join(__dirname, '../logs');
const warnLogPath = path.join(logsDir, 'warn.log');
const errorLogPath = path.join(logsDir, 'error.log');

// Utility functions
const createDirectory = (dirPath) => {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
	}
};

const formatLogMessage = (prefix, message, caller) => {
	const [filePath, lineNumber] = caller.split(':');
	const shortFilePath = filePath.split('/').slice(-2).join('/');
	return `${prefix} [${shortFilePath}:${lineNumber}]\n - ${message}\n`;
};

const logToFile = (filePath, logMessage) => {
	createDirectory(path.dirname(filePath));
	fs.appendFileSync(filePath, logMessage);
};

// Logging functions
const debugWhoLetTheBugsOut = (message) => {
	if (isDebug) {
		const stack = new Error().stack.split('\n').slice(2).filter(line => !line.includes('anonymous')).map(line => line.trim().replace(/^at /, ''));
		const caller = stack[0];
		const formattedMessage = formatLogMessage('🐞🚪', message, caller);
		console.debug(formattedMessage);
	}
};

const infoWhoLetTheLogsOut = (message) => {
	if (isDebug) {
		const stack = new Error().stack.split('\n').slice(2).filter(line => !line.includes('anonymous')).map(line => line.trim().replace(/^at /, ''));
		const caller = stack[0];
		const formattedMessage = formatLogMessage('📝ℹ️', message, caller);
		console.info(formattedMessage);
	}
};

const warnWhoLetTheDogsOut = (message) => {
	const stack = new Error().stack.split('\n').slice(2).filter(line => !line.includes('anonymous')).map(line => line.trim().replace(/^at /, ''));
	const caller = stack[0];
	const formattedMessage = formatLogMessage('🐶🚪', message, caller);
	console.warn(formattedMessage);

	createDirectory(logsDir);
	createDirectory(path.dirname(warnLogPath));

	logToFile(warnLogPath, `[${new Date().toISOString()}] ${formattedMessage}`);
};

const errorWhoLetTheErrorsOut = (message) => {
	const stack = new Error().stack.split('\n').slice(2).filter(line => !line.includes('anonymous')).map(line => line.trim().replace(/^at /, ''));
	const caller = stack[0];
	const formattedMessage = formatLogMessage('🔥🚨', message, caller);
	console.error(formattedMessage);

	createDirectory(logsDir);
	createDirectory(path.dirname(errorLogPath));

	logToFile(errorLogPath, `[${new Date().toISOString()}] ${formattedMessage}`);
};

module.exports = {
	debug: debugWhoLetTheBugsOut,
	info: infoWhoLetTheLogsOut,
	warn: warnWhoLetTheDogsOut,
	error: errorWhoLetTheErrorsOut
};

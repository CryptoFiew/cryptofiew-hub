const fs = require("fs");
const path = require('path');
const env = require("../env");

/**
 * Determines whether the environment is in debug mode.
 * @type {boolean}
 */
const isDebug = env.debug;

/**
 * The directory path for log files.
 * @type {string}
 */
const logsDir = path.join(__dirname, '../logs');

/**
 * The path for the warn log file.
 * @type {string}
 */
const warnLogPath = path.join(logsDir, 'warn.log');

/**
 * The path for the error log file.
 * @type {string}
 */
const errorLogPath = path.join(logsDir, 'error.log');

/**
 * Creates a directory if it does not exist.
 * @param {string} dirPath - The path of the directory to create.
 */
function createDirectory(dirPath) {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
	}
}

/**
 * Logs a debug message with the file path and line number of the calling function.
 * @param {string} message - The message to log.
 */
function debugWhoLetTheBugsOut(message) {
	if (isDebug) {
		const stack = new Error().stack.split('\n').slice(2);
		const tree = stack.filter(line => !line.includes('anonymous')).map(line => line.trim().replace(/^at /, ''));
		const caller = tree[0];
		const [filePath, lineNumber] = caller.split(':');
		const shortFilePath = filePath.split('/').slice(-2).join('/');
		const formattedMessage = `🐞🚪 [${shortFilePath}:${lineNumber}]\n - ${message}\n`;
		console.debug(formattedMessage);
	}
}

/**
 * Logs an info message with the file path and line number of the calling function.
 * @param {string} message - The message to log.
 */
function infoWhoLetTheLogsOut(message) {
	if (isDebug) {
		const stack = new Error().stack.split('\n').slice(2);
		const tree = stack.filter(line => !line.includes('anonymous')).map(line => line.trim().replace(/^at /, ''));
		const caller = tree[0];
		const [filePath, lineNumber] = caller.split(':');
		const shortFilePath = filePath.split('/').slice(-2).join('/');
		const formattedMessage = `📝ℹ️ [${shortFilePath}:${lineNumber}]\n - ${message}\n`;
		console.info(formattedMessage);
	}
}

/**
 * Logs a warning message with the file path and line number of the calling function.
 * @param {string} message - The message to log.
 */
function warnWhoLetTheDogsOut(message) {
	const stack = new Error().stack.split('\n').slice(2);
	const tree = stack.filter(line => !line.includes('anonymous')).map(line => line.trim().replace(/^at /, ''));
	const caller = tree[0];
	const [filePath, lineNumber] = caller.split(':');
	const shortFilePath = filePath.split('/').slice(-2).join('/');
	const formattedMessage = `🐶🚪 [${shortFilePath}:${lineNumber}]\n - ${message}\n`;
	console.warn(formattedMessage);

	// Ensure log directory exists
	createDirectory(logsDir);

	// Ensure warn log file exists
	createDirectory(path.dirname(warnLogPath));
	if (!fs.existsSync(warnLogPath)) {
		fs.writeFileSync(warnLogPath, '');
	}

	// Write to warn log file
	const logMessage = `[${new Date().toISOString()}] ${formattedMessage}`;
	fs.appendFileSync(warnLogPath, logMessage);
}

/**
 * Logs an error message with the file path and line number of the calling function.
 * @param {string} message - The message to log.
 */
function errorWhoLetTheErrorsOut(message) {
	const stack = new Error().stack.split('\n').slice(2);
	const tree = stack.filter(line => !line.includes('anonymous')).map(line => line.trim().replace(/^at /, ''));
	const caller = tree[0];
	const [filePath, lineNumber] = caller.split(':');
	const shortFilePath = filePath.split('/').slice(-2).join('/');
	const formattedMessage = `🔥🚨 [${shortFilePath}:${lineNumber}]\n - ${message}\n`;
	console.error(formattedMessage);

	// Ensure log directory exists
	createDirectory(logsDir);

	// Ensure error log file exists
	createDirectory(path.dirname(errorLogPath));
	if (!fs.existsSync(errorLogPath)) {
		fs.writeFileSync(errorLogPath, '');
	}

	// Write to error log file
	const logMessage = `[${new Date().toISOString()}] ${formattedMessage}`;
	fs.appendFileSync(errorLogPath, logMessage);
}

module.exports = {
	debug: debugWhoLetTheBugsOut,
	info: infoWhoLetTheLogsOut,
	warn: warnWhoLetTheDogsOut,
	error: errorWhoLetTheErrorsOut
};

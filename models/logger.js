const fs = require("fs");
const path = require("path");
const env = require("../env");
const { Ok, Err } = require("@sniptt/monads");
/**
 * Represents a logger for high-frequency trading platform.
 *
 * The Logger class is optimized for performance and provides logging functionalities
 * to write debug, info, warning, and error logs to files and console.
 */
class Logger {
  constructor() {
    this.isDebug = env.debug;
    this.logsDir = path.join(__dirname, "../logs");
    this.warnLogPath = path.join(this.logsDir, "warn.log");
    this.errorLogPath = path.join(this.logsDir, "error.log");

    // Create the logs directory if it doesn't exist
    this.createDirectory(this.logsDir);
  }

  /**
   * Creates a directory at the given path.
   * @param {string} dirPath - The path of the directory to create.
   * @returns {Result<null, Error>} - The result indicating success or error.
   */
  createDirectory(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      return Ok(null);
    } catch (error) {
      return Err(error);
    }
  }

  /**
   * Formats the log message with prefix, file path, line number, and caller.
   * @param {string} prefix - The log message prefix.
   * @param {string} message - The log message.
   * @param {string} caller - The file path and line number of the caller.
   * @returns {string} - The formatted log message.
   */
  formatLogMessage(prefix, message, caller) {
    const [filePath, lineNumber] = caller.split(":");
    const shortFilePath = filePath.split("/").slice(-2).join("/");
    return `${prefix} [${shortFilePath}:${lineNumber}]\n - ${message}\n`;
  }

  /**
   * Logs a debug message with the file path and line number of the caller.
   * @param {string} message - The debug message.
   * @returns {Result<null, null>} - The result indicating success or error.
   */
  debug(message) {
    if (this.isDebug) {
      const stack = new Error().stack.split("\n").slice(3).filter((line) =>
        !line.includes("anonymous")
      )
        .map((line) => line.trim().replace(/^at /, ""));
      const caller = stack[0];
      const formattedMessage = this.formatLogMessage("🐞🚪", message, caller);
      console.debug(formattedMessage);
      return Ok(null);
    } else {
      return Ok(null);
    }
  }

  /**
   * Logs an info message with the file path and line number of the caller.
   * @param {string} message - The info message.
   * @returns {Result<null, null>} - The result indicating success or error.
   */
  info(message) {
    if (this.isDebug) {
      const stack = new Error().stack.split("\n").slice(3).filter((line) =>
        !line.includes("anonymous")
      )
        .map((line) => line.trim().replace(/^at /, ""));
      const caller = stack[0];
      const formattedMessage = this.formatLogMessage("📝ℹ️", message, caller);
      console.info(formattedMessage);
      return Ok(null);
    } else {
      return Ok(null);
    }
  }

  /**
   * Logs a warning message with the file path and line number of the caller.
   * @param {string} message - The warning message.
   * @returns {Result<null, Error>} - The result indicating success or error.
   */
  warn(message) {
    const stack = new Error().stack.split("\n").slice(3).filter((line) =>
      !line.includes("anonymous")
    )
      .map((line) => line.trim().replace(/^at /, ""));
    const caller = stack[0];
    const formattedMessage = this.formatLogMessage("🐶🚪", message, caller);
    console.warn(formattedMessage);
    return this.logToFile(this.warnLogPath, formattedMessage);
  }

  /**
   * Logs an error message with the file path and line number of the caller.
   * @param {string} message - The error message.
   * @returns {Result<null, Error>} - The result indicating success or error.
   */
  error(message) {
    const stack = new Error().stack.split("\n").slice(3).filter((line) =>
      !line.includes("anonymous")
    )
      .map((line) => line.trim().replace(/^at /, ""));
    const caller = stack[0];
    const formattedMessage = this.formatLogMessage("🔥🚨", message, caller);
    console.error(formattedMessage);
    return this.logToFile(this.errorLogPath, formattedMessage);
  }

  /**
   * Writes the log message to a file.
   * @param {string} filePath - The path of the log file.
   * @param {string} logMessage - The log message to write.
   * @returns {Result<null, Error>} - The result indicating success or error.
   */
  logToFile(filePath, logMessage) {
    try {
      this.createDirectory(path.dirname(filePath));
      fs.appendFileSync(filePath, logMessage);
      return Ok(null);
    } catch (error) {
      return Err(error);
    }
  }
}

/**
 * Represents an audit logger for high-frequency trading platform.
 *
 * The AuditLogger class is optimized for performance and provides audit logging functionalities
 * to write debug, info, warning, and error logs to files and console.
 */
class AuditLogger extends Logger {
  constructor() {
    super();
    this.tradeLogPath = path.join(this.logsDir, "trade.log");
    this.orderLogPath = path.join(this.logsDir, "order.log");
    this.riskCheckLogPath = path.join(this.logsDir, "riskCheck.log");
  }

  /**
   * Logs a trade to the audit log.
   * @param {Trade} trade - The trade to be logged.
   * @returns {Result<null, Error>} - The result indicating success or error.
   */
  logTrade(trade) {
    const message =
      `Trade - ID: ${trade.id}, Symbol: ${trade.symbol}, Volume: ${trade.volume}, Price: ${trade.price}, Date: ${trade.date}\n`;
    return this.logToFile(this.tradeLogPath, message);
  }

  /**
   * Logs an order to the audit log.
   * @param {Order} order - The order to be logged.
   * @returns {Result<null, Error>} - The result indicating success or error.
   */
  logOrder(order) {
    const message =
      `Order - ID: ${order.id}, Symbol: ${order.symbol}, Volume: ${order.volume}, Price: ${order.price}, Date: ${order.date}\n`;
    return this.logToFile(this.orderLogPath, message);
  }

  /**
   * Logs a risk check to the audit log.
   * @param {RiskCheck} riskCheck - The risk check to be logged.
   * @returns {Result<null, Error>} - The result indicating success or error.
   */
  logRiskCheck(riskCheck) {
    const message =
      `Risk Check - ID: ${riskCheck.id}, Result: ${riskCheck.result}, Date: ${riskCheck.date}\n`;
    return this.logToFile(this.riskCheckLogPath, message);
  }
}

module.exports = {
  audit: new AuditLogger(),
  logger: new Logger(),
};

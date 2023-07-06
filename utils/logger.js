const fs = require('fs')
const path = require('path')
const env = require('../env')
const monads = require('@sniptt/monads')
const { Ok, Err } = monads

// Constants
const isDebug = env.debug
const logsDir = path.join(__dirname, '../logs')
const warnLogPath = path.join(logsDir, 'warn.log')
const errorLogPath = path.join(logsDir, 'error.log')

// Utility functions
const createDirectory = (dirPath) => {
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true })
        }
        return Ok(null)
    } catch (error) {
        return Err(error)
    }
}

const formatLogMessage = (prefix, message, caller) => {
    const [filePath, lineNumber] = caller.split(':')
    const shortFilePath = filePath.split('/').slice(-2).join('/')
    return `${prefix} [${shortFilePath}:${lineNumber}]\n - ${message}\n`
}

const logToFile = (filePath, logMessage) => {
    try {
        createDirectory(path.dirname(filePath))
        fs.appendFileSync(filePath, logMessage)
        return Ok(null)
    } catch (error) {
        return Err(error)
    }
}

// Logging functions
const debugWhoLetTheBugsOut = (message) => {
    if (isDebug) {
        const stack = new Error().stack.split('\n').slice(2).filter(line => !line.includes('anonymous'))
            .map(line => line.trim().replace(/^at /, ''))
        const caller = stack[0]
        const formattedMessage = formatLogMessage('🐞🚪', message, caller)
        console.debug(formattedMessage)
        return Ok(null)
    } else {
        return Err(null)
    }
}

const infoWhoLetTheLogsOut = (message) => {
    if (isDebug) {
        const stack = new Error().stack.split('\n').slice(2).filter(line => !line.includes('anonymous'))
            .map(line => line.trim().replace(/^at /, ''))
        const caller = stack[0]
        const formattedMessage = formatLogMessage('📝ℹ️', message, caller)
        console.info(formattedMessage)
        return Ok(null)
    } else {
        return Err(null)
    }
}

/**
 * Transforms the 'warnWhoLetTheDogsOut' function to return a Result.
 *
 * @param {string} message - The warning message.
 * @returns {Result<null, any>} - The result indicating success or error.
 */
const warnWhoLetTheDogsOut = (message) => {
    const stack = new Error().stack.split('\n').slice(2).filter(line => !line.includes('anonymous'))
        .map(line => line.trim().replace(/^at /, ''))
    const caller = stack[0]
    const formattedMessage = formatLogMessage('🐶🚪', message, caller)
    console.warn(formattedMessage)

    try {
        createDirectory(logsDir)
        createDirectory(path.dirname(warnLogPath))
        logToFile(warnLogPath, `[${new Date().toISOString()}] ${formattedMessage}`)
        return Ok(null)
    } catch (error) {
        return Err(error)
    }
}

/**
 * Transforms the 'errorWhoLetTheErrorsOut' function to return a Result.
 *
 * @param {string} message - The error message.
 * @returns {Result<null, any>} - The result indicating success or error.
 */
const errorWhoLetTheErrorsOut = (message) => {
    const stack = new Error().stack.split('\n').slice(2).filter(line => !line.includes('anonymous'))
        .map(line => line.trim().replace(/^at /, ''))
    const caller = stack[0]
    const formattedMessage = formatLogMessage('🔥🚨', message, caller)
    console.error(formattedMessage)

    try {
        createDirectory(logsDir)
        createDirectory(path.dirname(errorLogPath))
        logToFile(errorLogPath, `[${new Date().toISOString()}] ${formattedMessage}`)
        return Ok(null)
    } catch (error) {
        return Err(error)
    }
}

module.exports = {
    debug: debugWhoLetTheBugsOut,
    info: infoWhoLetTheLogsOut,
    warn: warnWhoLetTheDogsOut,
    error: errorWhoLetTheErrorsOut
}

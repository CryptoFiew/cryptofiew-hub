/**
 * Custom Maybe monad implementation.
 * @param {*} value The value to wrap in the Maybe monad.
 * @returns {Object} The Maybe monad object.
 */
function Maybe(value) {
    this.value = value
}

/**
 * Creates a Maybe monad with a value.
 * @param {*} value The value to wrap in the Maybe monad.
 * @returns {Object} The Maybe monad object.
 */
function Just(value) {
    return new Maybe(value)
}

/**
 * Creates a Maybe monad without a value (Nothing).
 * @returns {Object} The Maybe monad object.
 */
function Nothing() {
    return new Maybe(null)
}

/**
 * Applies a function to the Maybe monad if it has a value.
 * @param {function} fn The function to apply.
 * @returns {Object} The Maybe monad object.
 */
Maybe.prototype.map = function (fn) {
    return this.value !== null ? new Maybe(fn(this.value)) : new Maybe(null)
}

/**
 * Chains another Maybe monadic computation if the current Maybe has a value.
 * @param {function} fn The function to chain.
 * @returns {Object} The Maybe monad object.
 */
Maybe.prototype.chain = function (fn) {
    return this.value !== null ? fn(this.value) : new Maybe(null)
}

/**
 * Converts the Maybe monad to a string representation.
 * @returns {string} The string representation of the Maybe monad.
 */
Maybe.prototype.toString = function () {
    return this.value !== null ? `Just(${this.value})` : 'Nothing'
}

/**
 * Custom Result monad implementation.
 * @param {*} value The value to wrap in the Result monad.
 * @returns {Object} The Result monad object.
 */
function Result(value) {
    this.value = value
}

/**
 * Checks if the Result represents a successful outcome.
 * @method isOk
 * @returns {boolean} True if the Result is Ok, false otherwise.
 */
Result.prototype.isOk = function () {
    return this.value && this.value.type === 'ok'
}

/**
 * Checks if the Result represents an error outcome.
 * @method isErr
 * @returns {boolean} True if the Result is an Error, false otherwise.
 */
Result.prototype.isErr = function () {
    return this.value && this.value.type === 'error'
}

/**
 * Wraps a value into a Result monad with Ok type.
 * @param {*} value The value to wrap.
 * @returns {Object} The Result monad object with Ok type.
 */
Result.prototype.wrap = function (value) {
    return new Result({ type: 'ok', value })
}


/**
 * Unwraps and returns the value inside the Result monad.
 * @returns {*} The unwrapped value.
 * @throws {Error} If called on an Error result.
 */
Result.prototype.unwrap = function () {
    if (this.value && this.value.type === 'ok') {
        return this.value.value
    }
    throw new Error('Unable to unwrap value: Result is an error')
}

/**
 * Unwraps and returns the error value inside the Result monad.
 * @returns {*} The unwrapped error value.
 * @throws {Error} If called on an Ok result.
 */
Result.prototype.unwrapError = function () {
    if (this.value && this.value.type === 'error') {
        return this.value.value
    }
    throw new Error('Unable to unwrap error: Result is not an error')
}

/**
 * Creates a Result monad with an Ok value.
 * @param {*} value The value to wrap in the Result monad.
 * @returns {Object} The Result monad object.
 */
function Ok(value) {
    return new Result({ type: 'ok', value })
}

/**
 * Creates a Result monad with an Error value.
 * @param {*} value The value to wrap in the Result monad.
 * @returns {Object} The Result monad object.
 */
function Err(value) {
    return new Result({ type: 'error', value })
}

/**
 * Checks if the Result monad is an Ok value.
 * @param {Object} result The Result monad to check.
 * @returns {boolean} True if the Result monad is an Ok value, false otherwise.
 */
function isOk(result) {
    return result && result.value && result.value.type === 'ok'
}

/**
 * Checks if the Result monad is an Error value.
 * @param {Object} result The Result monad to check.
 * @returns {boolean} True if the Result monad is an Error value, false otherwise.
 */
function isErr(result) {
    return result && result.value && result.value.type === 'error'
}

/**
 * Unwraps and returns the value inside the Result monad.
 * @param {Object} result The Result monad to unwrap.
 * @returns {*} The unwrapped value.
 */
function unwrap(result) {
    if (isOk(result)) {
        return result.value.value
    } else if (isErr(result)) {
        throw new Err(`Result error: ${result.value.value}`)
    } else {
        throw new Err('Invalid Result monad')
    }
}

module.exports = {
    Maybe,
    Just,
    Nothing,
    Result,
    Ok,
    Err,
    isOk,
    isErr,
    unwrap,
}

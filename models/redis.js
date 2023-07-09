/**
 * Represents a Redis channel message structure.
 */
class RedisChanMsg {
  /**
   * Create a new RedisChanMsg instance.
   * @param {string} type - The type of the message.
   * @param {any} data - The data associated with the message.
   */
  constructor(type, data) {
    this.type = type;
    this.data = data;
  }
}

module.exports = RedisChanMsg;

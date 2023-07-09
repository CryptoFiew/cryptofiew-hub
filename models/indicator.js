/**
 * Represents the result of an indicator calculation.
 */
class IndicatorResult {
  /**
   * Creates an instance of IndicatorResult.
   *
   * @param {object} options - The options for the indicator result.
   * @param {string} options.name - The name or identifier of the indicator.
   * @param {number[]} [options.values=[]] - The calculated indicator values.
   * @param {object} [options.metadata={}] - Additional metadata or contextual data.
   */
  constructor({ name, values = [], metadata = {} }) {
    /**
     * The name or identifier of the indicator.
     *
     * @type {string}
     */
    this.name = name;

    /**
     * The calculated indicator values.
     *
     * @type {number[]}
     */
    this.values = values;

    /**
     * Additional metadata or contextual data.
     *
     * @type {object}
     */
    this.metadata = metadata;
  }

  /**
   * Adds a value to the list of indicator values.
   *
   * @param {number} value - The value to add.
   */
  addValue(value) {
    this.values.push(value);
  }

  /**
   * Sets the metadata for the indicator result.
   *
   * @param {object} metadata - The metadata object to set.
   */
  setMetadata(metadata) {
    this.metadata = metadata;
  }

  /**
   * Gets the number of values in the indicator result.
   *
   * @returns {number} The number of values.
   */
  getValueCount() {
    return this.values.length;
  }
}

module.exports = IndicatorResult;

const Portfolio = require('./portfolio') // Replace with the correct path to the Portfolio class

/**
 * Represents a user of the platform.
 */
class User {
    /**
   * Create a new instance of User.
   * @param {string} userId - The user ID.
   * @param {string} name - The name of the user.
   * @param {string} email - The email of the user.
   * @param {Portfolio} portfolio - The portfolio belonging to the user.
   */
    constructor(userId, name, email, portfolio) {
    /**
     * The user ID.
     * @type {string}
     */
        this.userId = userId

        /**
     * The name of the user.
     * @type {string}
     */
        this.name = name

        /**
     * The email of the user.
     * @type {string}
     */
        this.email = email

        /**
     * The portfolio belonging to the user.
     * @type {Portfolio}
     */
        this.portfolio = portfolio
    }

    /**
   * Update the user's name.
   * @param {string} newName - The new name to update.
   */
    updateName(newName) {
        this.name = newName
    }

    /**
   * Update the user's email.
   * @param {string} newEmail - The new email to update.
   */
    updateEmail(newEmail) {
        this.email = newEmail
    }

    /**
   * Get the user's portfolio.
   * @returns {Portfolio} The portfolio of the user.
   */
    getPortfolio() {
        return this.portfolio
    }

    /**
   * Set the user's portfolio.
   * @param {Portfolio} newPortfolio - The new portfolio to set.
   * @throws {Error} Thrown if the provided newPortfolio is not an instance of the Portfolio class.
   */
    setPortfolio(newPortfolio) {
        if (!(newPortfolio instanceof Portfolio)) {
            throw new Error('Invalid portfolio. The new portfolio must be an instance of the Portfolio class.')
        }
        this.portfolio = newPortfolio
    }

    // Other methods related to user functionality can be added here
}

module.exports = User


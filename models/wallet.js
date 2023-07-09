const mongo = require('../services/mongo') 

/**
 * Represents a trading wallet.
 */
class Wallet {
    /**
   * Create a new instance of Wallet.
   * @param {string} userId - The user ID associated with the wallet.
   * @param {boolean} isBot - Specifies whether the wallet is a bot wallet or user wallet.
   */
    constructor(userId, isBot = false) {
    /**
     * The user ID associated with the wallet.
     * @type {string}
     */
        this.userId = userId

        /**
     * Specifies whether the wallet is a bot wallet or user wallet.
     * @type {boolean}
     */
        this.isBot = isBot
    }

    /**
   * Retrieve the wallet balance.
   * @returns {Promise<number>} A promise that resolves with the wallet balance.
   */
    async getBalance() {
        const user = await mongo.get('users', { _id: this.userId })
        const walletId = this.isBot ? user.botWalletId : user.userWalletId
        const walletData = await mongo.get('wallets', { _id: walletId })

        if (walletData) {
            return walletData.balance
        }

        // Return a default balance of 0 if the wallet doesn't exist in the mongo
        return 0
    }

    /**
   * Update the wallet balance after a transaction.
   * @param {number} amount - The amount to update the balance by.
   * @returns {Promise<void>} A promise that resolves when the balance is updated.
   */
    async updateBalance(amount) {
        const user = await mongo.get('users', { _id: this.userId })
        const walletId = this.isBot ? user.botWalletId : user.userWalletId
        const walletData = await mongo.get('wallets', { _id: walletId })

        if (walletData) {
            // Update existing wallet balance
            walletData.balance += amount
            await mongo.update('wallets', { _id: walletId }, walletData)
        } else {
            // Create new wallet entry in the mongo
            const newWalletData = { balance: amount }
            const insertedWallet = await mongo.insert('wallets', newWalletData)
            const updatedUser = this.isBot
                ? { botWalletId: insertedWallet._id }
                : { userWalletId: insertedWallet._id }
            await mongo.update('users', { _id: this.userId }, updatedUser)
        }
    }

    /**
   * Deposit funds into the wallet.
   * @param {number} amount - The amount to deposit.
   * @returns {Promise<void>} A promise that resolves when the deposit is complete.
   */
    async depositFunds(amount) {
        if (amount <= 0) {
            throw new Error('Invalid amount. Amount must be greater than 0.')
        }

        await this.updateBalance(amount)
    }

    /**
   * Withdraw funds from the wallet.
   * @param {number} amount - The amount to withdraw.
   * @returns {Promise<void>} A promise that resolves when the withdrawal is complete.
   */
    async withdrawFunds(amount) {
        if (amount <= 0) {
            throw new Error('Invalid amount. Amount must be greater than 0.')
        }

        const balance = await this.getBalance()

        if (amount > balance) {
            throw new Error('Insufficient funds.')
        }

        await this.updateBalance(-amount)
    }

    // Other methods related to wallet functionality can be added here
}

module.exports = Wallet


const nodemailer = require("nodemailer");
const env = require("../env");

/**
 * Alert service for the high-frequency trading bot platform.
 *
 * The AlertService class provides methods to send email alerts and
 * (in the future) push notifications.
 */
class AlertService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.alertsEmail,
        pass: env.alertsPassword,
      },
    });
  }

  /**
   * Sends an email alert.
   *
   * @param {string} to - The email address to send the alert to.
   * @param {string} subject - The subject of the email.
   * @param {string} message - The body of the email.
   * @returns {Promise<void>}
   */
  async sendEmailAlert(to, subject, message) {
    const mailOptions = {
      from: env.alertsEmail,
      to,
      subject,
      text: message,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Alert sent to ${to}`);
    } catch (error) {
      console.error(`Failed to send alert: ${error.message}`);
    }
  }

  // TODO: Add methods for sending push notifications
}

module.exports = new AlertService();

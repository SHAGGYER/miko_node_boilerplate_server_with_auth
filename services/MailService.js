const nodemailer = require("nodemailer");

module.exports = class MailService {
  static async sendMail({to, subject, html, attachments, from}) {
    try {
      let transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: 587,
        secure: false,
        auth: {
          user: process.env.MAIL_USERNAME,
          pass: process.env.MAIL_PASSWORD,
        },
        tls: {rejectUnauthorized: false},
      });

      await transporter.sendMail({
        from: from ? from : `"Daysure.dk" <${process.env.MAIL_FROM}>`,
        to,
        subject,
        html,
        attachments,
      });

      return true;
    } catch (e) {
      console.log(e.message);
      return false;
    }
  }
};
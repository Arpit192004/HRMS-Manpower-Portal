const nodemailer = require("nodemailer");

const isSmtpConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) return;

  if (!isSmtpConfigured()) {
    console.log("Email preview - SMTP is not configured:", {
      to,
      subject,
      text
    });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    family: 4,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html
    });

    console.log(`Email sent successfully to ${to}: ${subject}`);
  } catch (error) {
    console.error("Email send failed:", {
      to,
      subject,
      message: error.message,
      code: error.code,
      command: error.command
    });
  }
};

module.exports = sendEmail;

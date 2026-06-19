const nodemailer = require("nodemailer");
const dns = require("dns").promises;

const isSmtpConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const isBrevoConfigured = () => Boolean(process.env.BREVO_API_KEY);

const parseSender = () => {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || "HRMS Manpower Portal <no-reply@hrms.local>";
  const match = from.match(/^(.*)<(.+)>$/);

  if (match) {
    return {
      name: match[1].trim(),
      email: match[2].trim()
    };
  }

  return {
    name: "HRMS Manpower Portal",
    email: from.trim()
  };
};

const sendWithBrevo = async ({ to, subject, text, html }) => {
  const sender = parseSender();

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html || `<p>${text}</p>`
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Brevo API failed: ${response.status} ${body}`);
  }

  console.log(`Email sent successfully via Brevo to ${to}: ${subject}`);
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) return;

  if (isBrevoConfigured()) {
    try {
      await sendWithBrevo({ to, subject, text, html });
      return;
    } catch (error) {
      console.error("Brevo email send failed:", {
        to,
        subject,
        message: error.message
      });
      return;
    }
  }

  if (!isSmtpConfigured()) {
    console.log("Email preview - email provider is not configured:", {
      to,
      subject,
      text
    });
    return;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpAddress = await dns.lookup(smtpHost, { family: 4 });

  const transporter = nodemailer.createTransport({
    host: smtpAddress.address,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    family: 4,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    tls: {
      servername: smtpHost
    },
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

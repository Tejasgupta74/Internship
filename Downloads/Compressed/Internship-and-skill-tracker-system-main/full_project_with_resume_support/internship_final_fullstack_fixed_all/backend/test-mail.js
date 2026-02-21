require('dotenv').config();
const nodemailer = require('nodemailer');

(async () => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  try {
    console.log('Verifying transporter...');
    await transporter.verify();
    console.log('Transporter verified - ready to send mail');
  } catch (err) {
    console.error('Transporter verify failed:');
    console.error(err);
    return;
  }

  try {
    const info = await transporter.sendMail({
    from: process.env.SIGNUP_FROM || process.env.SMTP_USER,
    to: process.env.TEST_TO || process.env.SMTP_USER,
    subject: 'SMTP test from Internship App',
    text: 'If you receive this, SMTP auth and send works'
    });
    console.log('sendMail success:', info.messageId || info);
  } catch (err) {
    console.error('sendMail failed:');
    console.error(err);
  }
})();

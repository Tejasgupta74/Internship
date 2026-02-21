const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ ok: false, error: 'name, email and message are required' });
    }

    // Resolve admin email: explicit env var -> SMTP_USER -> fallback
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'tg1128255@gmail.com';

    if (!global.transporter) {
      console.warn('No mail transporter available - contact email will not be sent');
      return res.status(500).json({ ok: false, error: 'mail transporter not initialized' });
    }

    const mailOptions = {
      from: `${name} <${email}>`,
      to: adminEmail,
      subject: `New contact message from ${name}`,
      text: `You received a new message from ${name} (${email}):\n\n${message}`,
      html: `<p>You received a new message from <strong>${name}</strong> (<a href="mailto:${email}">${email}</a>):</p><p>${message.replace(/\n/g,'<br/>')}</p>`
    };

    const info = await global.transporter.sendMail(mailOptions);

    // If ethereal, get preview URL
    let preview = undefined;
    try {
      if (info && info.messageId && typeof nodemailer.getTestMessageUrl === 'function') {
        preview = nodemailer.getTestMessageUrl(info);
      }
    } catch (e) { /* ignore */ }

    return res.json({ ok: true, messageId: info && info.messageId, preview });
  } catch (err) {
    console.error('Contact route error:', err);
    return res.status(500).json({ ok: false, error: err.message || 'internal error' });
  }
});

module.exports = router;

// backend/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer'); // <- transporter lib

// Debug: show which MONGO_URI is being used at startup
console.log('Effective MONGO_URI from env:', process.env.MONGO_URI);

const authRoutes = require('./routes/auth');
const jobsRoutes = require('./routes/jobs');
const applicationsRoutes = require('./routes/applications');
const internshipsRoutes = require('./routes/internships');
const uploadResumeRoute = require('./routes/uploadResume');

const { authenticateJWT, authorizeRoles } = require('./middleware/auth');

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));

// -----------------------------
// EMAIL TRANSPORTER SETUP
// -----------------------------
global.transporter = null;

async function createTransporter() {
  try {
    const useEthereal = (process.env.USE_ETHEREAL || '').toLowerCase() === 'true';
    // If explicit ethereal request OR no SMTP_USER provided, create Ethereal test account
    if (useEthereal || !process.env.SMTP_USER) {
      console.log('No SMTP_USER detected or USE_ETHEREAL=true — creating Ethereal test account (dev only)');
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
      transporter._ethereal = { user: testAccount.user, pass: testAccount.pass };
      console.log('Ethereal account created. user=', testAccount.user);
      return transporter;
    }

    // Use real SMTP from env
    console.log('Using SMTP server from environment (non-ethereal).');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // verify once
    try {
      await transporter.verify();
      console.log('SMTP transporter verified for', process.env.SMTP_USER);
    } catch (verifyErr) {
      console.error('SMTP transporter verify failed:', verifyErr);
    }

    return transporter;
  } catch (err) {
    console.error('Failed to create transporter:', err);
    return null;
  }
}

// initialize transporter (non-blocking)
createTransporter().then(t => {
  global.transporter = t;
  console.log('Transporter ready?', !!t, t && t._ethereal ? ' (ethereal)' : '');
}).catch(err => {
  console.error('createTransporter threw:', err);
  global.transporter = null;
});

// -----------------------------
// MONGOOSE
// -----------------------------
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/internshipDB', { useNewUrlParser:true, useUnifiedTopology:true })
  .then(()=> console.log('MongoDB connected'))
  .catch(err=> console.error('MongoDB error:', err));

// -----------------------------
// ROUTES (mount after transporter created above)
// -----------------------------
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/internships', internshipsRoutes);
app.use('/api/contact', require('./routes/contact'));
app.use('/applications', require('./routes/resumeDownload'));
// Upload resume into MongoDB GridFS
app.use('/api/applications/upload-resume', uploadResumeRoute);

// Serve static frontend files (production)
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// SPA fallback: serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Export validated internships CSV (admin only)
app.get('/export/internships', authenticateJWT, authorizeRoles('admin'), async (req,res)=>{
  const Internship = require('./models/Internship');
  const data = await Internship.find({ status: 'Validated' }).populate('student');
  res.setHeader('Content-Type','text/csv');
  res.setHeader('Content-Disposition','attachment; filename="validated_internships.csv"');
  const csv = ['studentName,studentEmail,company,role,startDate,endDate']
    .concat(data.map(d => `"${(d.student?.name||'')}","${(d.student?.email||'')}","${(d.companyName||'')}","${(d.role||'')}","${d.startDate?d.startDate.toISOString().slice(0,10):''}","${d.endDate?d.endDate.toISOString().slice(0,10):''}"`))
    .join('\n');
  res.send(csv);
});

app.get('/health', (req,res)=> res.json({ ok:true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log('Backend listening on', PORT));

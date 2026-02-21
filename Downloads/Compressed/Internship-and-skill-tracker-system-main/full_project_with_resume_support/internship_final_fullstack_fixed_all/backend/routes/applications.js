// backend/routes/applications.js
const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Job = require('../models/job');
const User = require('../models/User');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

/**
 * Student: apply to a job
 * POST /api/applications
 */
router.post('/', authenticateJWT, authorizeRoles('student'), async (req, res) => {
  try {
    const { jobId, coverLetter, resumeUrl, resumeFileId, resumeOriginalName } = req.body;
    if (!jobId) return res.status(400).json({ error: 'jobId required' });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'job not found' });

    const exists = await Application.findOne({ job: jobId, student: req.user.userId });
    if (exists) return res.status(400).json({ error: 'already applied' });

    const app = await Application.create({
      job: jobId,
      student: req.user.userId,
      coverLetter,
      resumeUrl,
      resumeFileId: resumeFileId || null,
      resumeOriginalName: resumeOriginalName || ''
    });

    res.status(201).json(app);

    // Notify job owner (company) that a new application was submitted (non-blocking)
    (async () => {
      try {
        if (!global.transporter) {
          console.warn('transporter not configured — skipping application notification emails');
          return;
        }

        const jobOwnerId = job.createdBy;
        if (!jobOwnerId) return; // nothing to notify

        const owner = await User.findById(jobOwnerId).lean();
        if (!owner || !owner.email) return;

        // get student info for email
        const student = await User.findById(req.user.userId).lean();

        const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
        const jobUrl = `${frontendBase.replace(/\/$/, '')}/jobs/${job._id}`;

        const mail = {
          from: process.env.NOTIFY_FROM || process.env.SMTP_USER,
          to: owner.email,
          subject: `New application for ${job.title || 'your job'}`,
          text: `Hello ${owner.name || ''},\n\nA new application has been submitted for your job posting:\n\nJob: ${job.title || ''}\nApplicant: ${student ? (student.name || student.email || '') : ''}\nApplicant Email: ${student ? (student.email || '') : ''}\n\nView job: ${jobUrl}\n\nIf you have access to the company dashboard, you can review applications there.`
        };

        global.transporter.sendMail(mail)
          .then(info => {
            if (typeof require('nodemailer').getTestMessageUrl === 'function') {
              console.log('Application notification email preview:', require('nodemailer').getTestMessageUrl(info));
            }
          })
          .catch(err => {
            console.warn('Failed to send application notification to owner', owner.email, err && err.message ? err.message : err);
          });

      } catch (err) {
        console.warn('Error in application notification flow', err && err.message ? err.message : err);
      }
    })();
  } catch (err) {
    console.error('apply error', err);
    res.status(500).json({ error: 'server' });
  }
});

/**
 * Student: list own applications
 * GET /api/applications/me
 */
router.get('/me', authenticateJWT, authorizeRoles('student'), async (req, res) => {
  try {
    const apps = await Application.find({ student: req.user.userId })
      .populate('job')
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    console.error('my apps error', err);
    res.status(500).json({ error: 'server' });
  }
});

/**
 * Company/Admin: list applications for jobs owned by the company
 * GET /api/applications/for-company
 * By default returns only pending (Applied) applications.
 * Admins can use GET /api/applications to see all.
 */
router.get('/for-company', authenticateJWT, authorizeRoles('company','admin'), async (req, res) => {
  try {
    // Get jobs created by this company
    const jobs = await Job.find({ createdBy: req.user.userId }).select('_id');
    const jobIds = jobs.map(j => j._id);

    // Return only pending (Applied) applications
    const apps = await Application.find({ job: { $in: jobIds }, status: 'Applied' })
      .populate('job student')
      .sort({ createdAt: -1 });

    res.json(apps);
  } catch (err) {
    console.error('company apps error', err);
    res.status(500).json({ error: 'server' });
  }
});

/**
 * Admin: list all applications (admin only)
 * GET /api/applications
 */
router.get('/', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  try {
    const apps = await Application.find().populate('job student').sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    console.error('all apps error', err);
    res.status(500).json({ error: 'server' });
  }
});

/**
 * Company only: accept or reject an application
 * PUT /api/applications/:id/decision
 * body: { action: 'accept'|'reject', feedback: 'optional feedback' }
 * This route updates status (Accepted/Rejected) and keeps the record.
 * Admin can only view applications, not make decisions.
 */
router.put('/:id/decision', authenticateJWT, authorizeRoles('company'), async (req, res) => {
  try {
    const { action, feedback } = req.body; // 'accept' or 'reject', and optional feedback
    if (!['accept','reject'].includes(action)) return res.status(400).json({ error: 'invalid action' });

    const app = await Application.findById(req.params.id).populate('job student');
    if (!app) return res.status(404).json({ error: 'application not found' });

    // Ensure the company owns the job
    if (!app.job || !app.job.createdBy || String(app.job.createdBy) !== req.user.userId) {
      return res.status(403).json({ error: 'You can only manage applications for your own job postings' });
    }

    app.status = action === 'accept' ? 'Accepted' : 'Rejected';
    app.feedback = feedback || '';
    app.decisionAt = new Date();
    app.decidedBy = req.user.userId;
    await app.save();

    // Notify student about the decision (non-blocking)
    (async () => {
      try {
        if (!global.transporter) {
          console.warn('transporter not configured — skipping application decision notification');
          return;
        }

        // app.job and app.student are populated above via populate('job student')
        const student = app.student;
        const job = app.job;
        if (!student || !student.email) return;

        const decisionText = action === 'accept' ? 'accepted' : 'rejected';
        const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
        const jobUrl = `${frontendBase.replace(/\/$/, '')}/jobs/${job ? job._id : ''}`;

        const feedbackSection = feedback ? `\n\nFeedback from Company:\n${feedback}\n` : '';

        const mail = {
          from: process.env.NOTIFY_FROM || process.env.SMTP_USER,
          to: student.email,
          subject: `Your application for ${job && job.title ? job.title : 'the job'} has been ${decisionText}`,
          text: `Hello ${student.name || ''},\n\nYour application for the position "${job && job.title ? job.title : ''}" has been ${decisionText}.\n\nCompany: ${job && job.companyName ? job.companyName : ''}\nDecision: ${decisionText}${feedbackSection}\nYou can view the job here: ${jobUrl}\n\nIf you have questions, please contact the company or administrator.`
        };

        global.transporter.sendMail(mail)
          .then(info => {
            if (typeof require('nodemailer').getTestMessageUrl === 'function') {
              console.log('Application decision email preview:', require('nodemailer').getTestMessageUrl(info));
            }
          })
          .catch(err => {
            console.warn('Failed to send application decision email to', student.email, err && err.message ? err.message : err);
          });

        // Include company contact info in the student mail body when possible
        try {
          const ownerId = job && job.createdBy;
          if (ownerId) {
            const owner = await User.findById(ownerId).lean();
            if (owner && owner.email) {
              // send separate short mail to student including company contact
              const contactMail = {
                from: process.env.NOTIFY_FROM || process.env.SMTP_USER,
                to: student.email,
                subject: `Contact details for ${job && job.companyName ? job.companyName : 'the company'}`,
                text: `Hello ${student.name || ''},\n\nThe company that reviewed your application can be reached at: ${owner.email}\n\nCompany: ${job && job.companyName ? job.companyName : ''}\nIf you have questions, reply to that email or contact support.`
              };
              global.transporter.sendMail(contactMail).catch(()=>{});
            }
          }
        } catch (e) {
          // ignore contact mail errors
        }

        // If accepted, notify the company with selected applicant record (resume link and details)
        try {
          if (action === 'accept' && job && job.createdBy) {
            const owner = await User.findById(job.createdBy).lean();
            if (owner && owner.email) {
              const backendBase = process.env.BACKEND_URL || 'http://localhost:5000';
              const resumeUrl = `${backendBase.replace(/\/$/, '')}/api/applications/${app._id}/resume`;
              const ownerMail = {
                from: process.env.NOTIFY_FROM || process.env.SMTP_USER,
                to: owner.email,
                subject: `You selected ${student ? (student.name || student.email) : 'an applicant'} for ${job.title || ''}`,
                text: `Hello ${owner.name || ''},\n\nYou have selected the following applicant for your job:\n\nName: ${student ? (student.name || '') : ''}\nEmail: ${student ? (student.email || '') : ''}\nApplication ID: ${app._id}\nResume: ${resumeUrl}\n\nThis email is a confirmation record of the selection. Keep it for your records.`
              };
              global.transporter.sendMail(ownerMail).catch(err => {
                console.warn('Failed to send selection confirmation to owner', owner.email, err && err.message ? err.message : err);
              });
            }
          }
        } catch (e) {
          console.warn('Error sending selection confirmation to owner', e && e.message ? e.message : e);
        }

      } catch (err) {
        console.warn('Error in application decision notification flow', err && err.message ? err.message : err);
      }
    })();

    // OPTIONAL: Create Internship automatically on accept.
    // Uncomment and ensure Internship model exists.
    /*
    if (action === 'accept') {
      const Internship = require('../models/Internship');
      await Internship.create({
        student: app.student._id,
        companyName: app.job.companyName,
        role: app.job.title,
        startDate: new Date(),
        endDate: null,
        status: 'Pending'
      });
    }
    */

    res.json(app);
  } catch (err) {
    console.error('decision error', err);
    res.status(500).json({ error: 'server' });
  }
});

module.exports = router;

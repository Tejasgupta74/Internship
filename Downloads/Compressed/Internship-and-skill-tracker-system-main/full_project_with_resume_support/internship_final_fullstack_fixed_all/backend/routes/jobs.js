// backend/routes/jobs.js
const express = require('express');
const router = express.Router();
const Job = require('../models/job'); // matches your models/job.js
const Application = require('../models/Application');
const User = require('../models/User');
const mongoose = require('mongoose');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

// GET /api/jobs  - list all jobs (public)
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    console.error('jobs list error', err);
    res.status(500).json({ error: 'server' });
  }
});

// GET /api/jobs/:id - job detail
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'not found' });
    res.json(job);
  } catch (err) {
    console.error('job detail error', err);
    res.status(500).json({ error: 'server' });
  }
});

// POST /api/jobs - create job (company only)
router.post('/', authenticateJWT, authorizeRoles('company'), async (req, res) => {
  try {
    const { title, companyName, description, location, stipend, deadline } = req.body;
    if (!title || !companyName) return res.status(400).json({ error: 'title & companyName required' });

    const job = await Job.create({
      title,
      companyName,
      description: description || '',
      location: location || '',
      stipend: stipend || '',
      deadline: deadline ? new Date(deadline) : null,
      createdBy: req.user && req.user.userId ? req.user.userId : undefined
    });

    res.status(201).json(job);

    // Send notification emails to all students about the new job (non-blocking)
    (async () => {
      try {
        if (!global.transporter) {
          console.warn('transporter not configured — skipping new-job notification emails');
          return;
        }

        const students = await User.find({ role: 'student', email: { $exists: true, $ne: '' } }).lean();
        if (!students || students.length === 0) return;

        const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173';
        const jobUrl = `${frontendBase.replace(/\/$/, '')}/jobs/${job._id}`;

        const promises = students.map(s => {
          if (!s.email) return Promise.resolve(null);
          const mail = {
            from: process.env.NOTIFY_FROM || process.env.SMTP_USER,
            to: s.email,
            subject: `New job posted: ${job.title || 'Untitled'}`,
            text: `Hello ${s.name || ''},\n\nA new job has been posted:\n\nTitle: ${job.title || ''}\nCompany: ${job.companyName || ''}\nLocation: ${job.location || 'Not specified'}\nStipend: ${job.stipend || 'Unspecified'}\n\nView & apply: ${jobUrl}\n\nIf you do not wish to receive these notifications, please contact the administrator.`
          };

          return global.transporter.sendMail(mail)
            .then(info => {
              if (typeof require('nodemailer').getTestMessageUrl === 'function') {
                console.log('New-job email preview for', s.email, require('nodemailer').getTestMessageUrl(info));
              }
              return info;
            })
            .catch(err => {
              console.warn('Failed to send new-job email to', s.email, err && err.message ? err.message : err);
            });
        });

        await Promise.allSettled(promises);
      } catch (err) {
        console.warn('Error sending new-job notifications', err && err.message ? err.message : err);
      }
    })();
  } catch (err) {
    console.error('create job error', err);
    res.status(500).json({ error: 'server' });
  }
});

// DELETE /api/jobs/:id - delete a job and all related data (admin only)
router.delete('/:id', authenticateJWT, authorizeRoles('admin'), async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'job not found' });

    // Find related applications
    const apps = await Application.find({ job: jobId }).lean();

    // Notify job owner and applicants (non-blocking)
    (async () => {
      try {
        if (!global.transporter) {
          console.warn('transporter not configured — skipping deletion notification emails');
        } else {
          // Notify job owner (createdBy may be id or null)
          try {
            if (job.createdBy) {
              const owner = await User.findById(job.createdBy).lean();
              if (owner && owner.email) {
                const infoOwner = await global.transporter.sendMail({
                  from: process.env.NOTIFY_FROM || process.env.SMTP_USER,
                  to: owner.email,
                  subject: `Your job "${job.title || 'Untitled'}" has been removed`,
                  text: `Hello ${owner.name || ''},\n\nAn administrator has removed your job posting titled "${job.title || ''}". If you have questions, please contact support.`
                });
                if (typeof require('nodemailer').getTestMessageUrl === 'function') {
                  console.log('Job-owner removal email preview:', require('nodemailer').getTestMessageUrl(infoOwner));
                }
              }
            }
          } catch (ownerErr) {
            console.warn('Failed to send job-owner deletion email', ownerErr && ownerErr.message ? ownerErr.message : ownerErr);
          }

          // Notify all applicants (deduplicate student ids)
          try {
            const studentIds = Array.from(new Set(apps.map(a => a.student).filter(Boolean).map(x => String(x))));
            if (studentIds.length) {
              const students = await User.find({ _id: { $in: studentIds } }).lean();
              const mailPromises = students.map(s => {
                if (!s.email) return Promise.resolve(null);
                return global.transporter.sendMail({
                  from: process.env.NOTIFY_FROM || process.env.SMTP_USER,
                  to: s.email,
                  subject: `Job "${job.title || ''}" removed`,
                  text: `Hello ${s.name || ''},\n\nThe job you applied for ("${job.title || ''}") has been removed by an administrator. Your application record has been deleted. If you have questions, please contact support.`
                }).then(info => {
                  if (typeof require('nodemailer').getTestMessageUrl === 'function') {
                    console.log('Applicant removal email preview for', s.email, require('nodemailer').getTestMessageUrl(info));
                  }
                  return info;
                }).catch(err => {
                  console.warn('Failed to send applicant deletion email to', s.email, err && err.message ? err.message : err);
                });
              });
              await Promise.allSettled(mailPromises);
            }
          } catch (appErr) {
            console.warn('Failed to notify applicants about job deletion', appErr && appErr.message ? appErr.message : appErr);
          }
        }
      } catch (err) {
        console.warn('Deletion notification flow error', err && err.message ? err.message : err);
      }
    })();

    // If any application has resumeFileId stored in GridFS, delete those files
    if (apps && apps.length) {
      try {
        if (mongoose.connection && mongoose.connection.db) {
          const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'resumes' });
          for (const a of apps) {
            try {
              const fileId = a.resumeFileId || null;
              if (fileId) {
                const _id = typeof fileId === 'string' ? new mongoose.Types.ObjectId(fileId) : fileId;
                await bucket.delete(_id);
              }
            } catch (err) {
              // Log and continue; do not fail the whole operation because a file couldn't be removed
              console.warn('Failed to delete resume file from GridFS for application', a._id, err && err.message ? err.message : err);
            }
          }
        }
      } catch (err) {
        console.warn('GridFS cleanup skipped due to error', err && err.message ? err.message : err);
      }
    }

    // Remove applications
    await Application.deleteMany({ job: jobId });

    // Finally remove the job
    await Job.deleteOne({ _id: jobId });

    return res.json({ ok: true });
  } catch (err) {
    console.error('delete job error', err);
    return res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;

const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Helper: try multiple require paths
function tryRequire(paths) {
  for (const p of paths) {
    try {
      // require relative to this file
      const resolvedPath = require.resolve(p, { paths: [__dirname] });
      return require(resolvedPath);
    } catch (e) {
      // ignore and continue
    }
  }
  return null;
}

// Possible permutations for model/middleware filenames (adjust if you know specific names)
const Application = tryRequire([
  '../models/Application',
  '../models/application',
  '../models/Applications',
  '../../models/Application',
  '../../models/application'
]);

const Job = tryRequire([
  '../models/Job',
  '../models/job',
  '../models/jobs',
  '../../models/job',
  '../../models/Job'
]);

const authModule = tryRequire([
  '../middleware/auth',
  '../middleware/auth.js',
  '../middleware/Auth',
  '../../middleware/auth',
  '../../middleware/auth.js'
]);

if (!Application) {
  console.error('resumeDownload: WARNING - Application model not found by auto-detect. Please verify file in backend/models.');
}
if (!Job) {
  console.error('resumeDownload: WARNING - Job model not found by auto-detect. Please verify file in backend/models.');
}
if (!authModule) {
  console.error('resumeDownload: WARNING - auth middleware not found by auto-detect. Please verify file in backend/middleware.');
}

// Fallbacks to avoid crashes (simple guards)
const authenticateJWT = authModule && authModule.authenticateJWT ? authModule.authenticateJWT : (req,res,next)=>{ res.status(500).json({error:'auth middleware missing'}); };
const authorizeRoles = authModule && authModule.authorizeRoles ? authModule.authorizeRoles : ()=> (req,res,next)=>{ next(); };


// determine uploads dir
const uploadsRoot = path.resolve(__dirname, '..', 'uploads', 'resumes');
if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot, { recursive: true });

/**
 * GET /applications/:applicationId/resume
 * Protected: admin/company/recruiter
 */
// Allow admin, company, recruiter, faculty and students (with ownership check below)
router.get('/:applicationId/resume', authenticateJWT, authorizeRoles('admin','company','recruiter','faculty','student'), async (req, res) => {
  try {
    if (!Application) return res.status(500).json({ error: 'Application model not available on server' });

    const applicationId = req.params.applicationId;
    // attempt to find by common field name differences:
    // try Application.findById
    let app = null;
    if (typeof Application.findById === 'function') {
      app = await Application.findById(applicationId).populate && typeof Application.findById(applicationId).populate === 'function'
        ? await Application.findById(applicationId).populate('job student')
        : await Application.findById(applicationId);
    } else {
      return res.status(500).json({ error: 'Application model findById not available' });
    }

    if (!app) return res.status(404).json({ error: 'application not found' });

    // resume may be stored in GridFS (app.resumeFileId) or as filename/url on disk (app.resume/app.resumeUrl)
    const resumeFileId = app.resumeFileId || null;
    const resumeFilename = app.resume || app.resumeFilename || app.resumeUrl || null;

    if (!resumeFileId && !resumeFilename) return res.status(404).json({ error: 'resume not attached to application' });

    // If resume stored in GridFS, stream it
    if (resumeFileId) {
      try {
        const mongoose = require('mongoose');
        if (!mongoose.connection || !mongoose.connection.db) {
          return res.status(500).json({ error: 'database not ready' });
        }
        const GridFSBucket = mongoose.mongo.GridFSBucket;
        const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'resumes' });

        // find file metadata to get filename/contentType
        const _id = typeof resumeFileId === 'string' ? new mongoose.Types.ObjectId(resumeFileId) : resumeFileId;
        const filter = { _id };
        const filesColl = mongoose.connection.db.collection('resumes.files');
        const fileDoc = await filesColl.findOne(filter);
        if (!fileDoc) return res.status(404).json({ error: 'resume not found in database' });

        const originalName = app.resumeOriginalName || fileDoc.filename || 'resume';
        res.setHeader('Content-Disposition', `attachment; filename="${String(originalName).replace(/"/g,'')}"`);
        if (fileDoc.contentType) res.setHeader('Content-Type', fileDoc.contentType);

        const downloadStream = bucket.openDownloadStream(_id);
        return downloadStream.pipe(res).on('error', err => {
          console.error('GridFS download error', err);
          if (!res.headersSent) res.status(500).json({ error: 'download failed' });
        });
      } catch (err) {
        console.error('GridFS resume stream error', err);
        return res.status(500).json({ error: 'server error' });
      }
    }

    // Ownership check for company role (safe check for job.createdBy or job.companyId)
    if (req.user && req.user.role === 'company') {
      const jobObj = app.job || (app.jobId ? await (Job ? Job.findById(app.jobId) : null) : null);
      const ownerId = jobObj && (jobObj.createdBy || jobObj.companyId || jobObj.createdby || jobObj.company);
      if (!ownerId || String(ownerId) !== String(req.user.userId || req.user.id)) {
        return res.status(403).json({ error: 'forbidden' });
      }
    }

    // Allow student to download their own resume only
    if (req.user && req.user.role === 'student') {
      const studentId = app.student && (app.student._id || app.student);
      if (!studentId || String(studentId) !== String(req.user.userId || req.user.id)) {
        return res.status(403).json({ error: 'forbidden' });
      }
    }

    const filePath = path.resolve(uploadsRoot, path.basename(resumeFilename));
    if (!filePath.startsWith(uploadsRoot)) return res.status(400).json({ error: 'invalid file path' });
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'file not found on server' });

    // Attempt to use original name if present
    const originalName = app.resumeOriginalName || app.resumeOriginal || path.basename(resumeFilename);
    res.setHeader('Content-Disposition', `attachment; filename="${String(originalName).replace(/"/g,'')}"`);
    return res.sendFile(filePath);
  } catch (err) {
    console.error('resumeDownload error', err);
    return res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;

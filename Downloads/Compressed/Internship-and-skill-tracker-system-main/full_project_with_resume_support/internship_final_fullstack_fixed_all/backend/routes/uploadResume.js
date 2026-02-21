const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

// Use memory storage then stream into GridFS
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

/**
 * POST /api/applications/upload-resume
 * body: multipart/form-data with field `resume` (file)
 * returns: { fileId, filename, originalName }
 */
router.post('/', authenticateJWT, authorizeRoles('student'), upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'no file uploaded' });

    if (!mongoose.connection || !mongoose.connection.db) {
      return res.status(500).json({ error: 'database not ready' });
    }

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'resumes' });

    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
      metadata: {
        uploadedBy: req.user.userId
      }
    });

    // convert buffer to readable stream and pipe
    const { Readable } = require('stream');
    const readable = new Readable();
    readable.push(req.file.buffer);
    readable.push(null);

    readable.pipe(uploadStream)
      .on('error', (err) => {
        console.error('GridFS upload error', err);
        return res.status(500).json({ error: 'upload failed' });
      })
      .on('finish', (file) => {
        return res.json({ fileId: file._id, filename: file.filename, originalName: req.file.originalname });
      });

  } catch (err) {
    console.error('uploadResume error', err);
    res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;

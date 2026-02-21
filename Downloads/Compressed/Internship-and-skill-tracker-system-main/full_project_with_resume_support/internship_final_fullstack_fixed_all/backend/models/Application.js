// backend/models/Application.js
const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coverLetter: { type: String, default: '' },
  resumeUrl: { type: String, default: '' },
  // GridFS file id when resume is stored in MongoDB
  resumeFileId: { type: mongoose.Schema.Types.ObjectId, default: null },
  // original filename provided by student
  resumeOriginalName: { type: String, default: '' },
  // legacy/local filename (if stored on disk)
  resumeFilename: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['Applied','Viewed','Accepted','Rejected','Withdrawn'], 
    default: 'Applied' 
  },
  feedback: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  decisionAt: { type: Date, default: null },
  decidedBy: { type: String, default: null }
});

module.exports = mongoose.model('Application', ApplicationSchema);

// backend/models/job.js
const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  companyName: { type: String, required: true },
  description: { type: String, default: '' },
  location: { type: String, default: '' },
  stipend: { type: String, default: '' },
  deadline: { type: Date, default: null },
  createdBy: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);

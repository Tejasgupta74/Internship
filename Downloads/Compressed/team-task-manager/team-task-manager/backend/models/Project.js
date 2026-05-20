const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: String,
  description: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

ProjectSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    const Task = mongoose.model('Task');
    await Task.deleteMany({ project: doc._id });
  }
});

module.exports = mongoose.model('Project', ProjectSchema);
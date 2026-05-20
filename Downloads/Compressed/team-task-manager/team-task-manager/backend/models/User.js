const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    enum: ['Admin', 'Member'],
    default: 'Member'
  },
  googleId: String,
  avatar: String,
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
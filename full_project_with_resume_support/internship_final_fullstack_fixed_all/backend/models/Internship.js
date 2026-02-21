const mongoose = require('mongoose');
const schema = new mongoose.Schema({ student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, companyName: String, role: String, startDate: Date, endDate: Date, status: { type: String, enum: ['Pending','Validated','Rejected'], default: 'Pending' }, validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, createdAt: { type: Date, default: Date.now } });
module.exports = mongoose.model('Internship', schema);

// backend/seed.js — robust seeder
require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Job = require('./models/Job');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/internship_tracker';

async function connectWithTimeout(uri, timeoutMs = 15000) {
  console.log('Connecting to MongoDB with URI:', uri);
  let settled = false;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error(`Timed out after ${timeoutMs}ms connecting to MongoDB`));
      }
    }, timeoutMs);

    mongoose.connect(uri, { /* modern mongoose options handled internally */ })
      .then(() => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      })
      .catch(err => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function seed() {
  try {
    await connectWithTimeout(MONGO_URI, 15000);
    console.log('✅ Connected to MongoDB');

    console.log('Clearing existing Users and Jobs...');
    await User.deleteMany({});
    await Job.deleteMany({});

    console.log('Creating demo users...');
    const users = await User.create([
      { name: 'Demo Student', email: 'student@demo.com', role: 'student' },
      { name: 'Demo Faculty', email: 'faculty@demo.com', role: 'faculty' },
      { name: 'Demo Admin', email: 'admin@demo.com', role: 'admin' },
      { name: 'Demo Company', email: 'hr@demo.com', role: 'company' }
    ]);
    console.log('Inserted users:', users.map(u => ({ name: u.name, email: u.email, role: u.role })));

    console.log('Creating demo jobs...');
    const jobs = await Job.create([
      { title: 'Frontend Intern', companyName: 'Demo Co', description: 'Build UI components and work with React.', deadline: new Date(Date.now() + 7*24*3600*1000) },
      { title: 'Backend Intern', companyName: 'Demo Co', description: 'Work on APIs and databases with Node.js.', deadline: new Date(Date.now() + 14*24*3600*1000) }
    ]);
    console.log('Inserted jobs:', jobs.map(j => ({ title: j.title, companyName: j.companyName })));

    console.log('Seeding complete ✅');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err && (err.stack || err.message || err));
    try { await mongoose.disconnect(); } catch(e){ /* ignore */ }
    process.exit(1);
  }
}

seed();

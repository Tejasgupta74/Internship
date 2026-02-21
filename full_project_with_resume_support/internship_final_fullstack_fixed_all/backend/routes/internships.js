const express = require('express');
const router = express.Router();
const Internship = require('../models/Internship');
const { authenticateJWT, authorizeRoles, optionalAuthenticateJWT } = require('../middleware/auth');

// list (filter by studentId or status)
// Use optional auth so public can view validated internships, but when a user is authenticated
// we apply role-based visibility rules (faculty should not see arbitrary student's internships)
router.get('/', optionalAuthenticateJWT, async (req,res)=>{
  const filter = {};
  const { studentId, status } = req.query || {};

  // If faculty requests without explicit status, default to Pending so they can validate
  if (req.user && req.user.role === 'faculty' && !status) {
    filter.status = 'Pending';
  }

  if (studentId) {
    // If a student requests their own internships, allow.
    if (req.user && req.user.role === 'student' && String(req.user.userId) === String(studentId)) {
      filter.student = studentId;
    } else if (req.user && (req.user.role === 'admin' || req.user.role === 'company')) {
      // admin and company can view by studentId
      filter.student = studentId;
    } else {
      // faculty and unauthenticated / other roles: deny access to arbitrary student's internships
      return res.status(403).json({ error: 'forbidden' });
    }
  }

  if (status) filter.status = status;

  // By default, if no filters provided, only return validated internships to public viewers
  if (!studentId && !status && (!req.user || (req.user && req.user.role !== 'admin'))) {
    filter.status = 'Validated';
  }

  const ints = await Internship.find(filter).populate('student');
  res.json(ints);
});

// create (student)
router.post('/', authenticateJWT, authorizeRoles('student'), async (req,res)=>{
  const { companyName, role, startDate, endDate } = req.body;
  const studentId = req.user.userId;
  if(!companyName) return res.status(400).json({ error:'companyName required' });
  const it = await Internship.create({ student: studentId, companyName, role, startDate, endDate });
  res.status(201).json(it);
});

// validate (faculty)
router.put('/:id/validate', authenticateJWT, authorizeRoles('faculty'), async (req,res)=>{
  const { action } = req.body;
  const facultyId = req.user.userId;
  const it = await Internship.findById(req.params.id);
  if(!it) return res.status(404).json({ error:'not found' });
  it.status = action === 'validate' ? 'Validated' : 'Rejected';
  it.validatedBy = facultyId;
  await it.save();
  res.json(it);
});

module.exports = router;

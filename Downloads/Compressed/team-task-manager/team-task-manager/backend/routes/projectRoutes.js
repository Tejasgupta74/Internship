const express = require('express');
const Project = require('../models/Project');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  const project = await Project.create({
    ...req.body,
    createdBy: req.user.id || req.user._id
  });
  res.json(project);
});

router.get('/', auth, async (req, res) => {
  const projects = await Project.find();
  res.json(projects);
});

router.get('/:id', auth, async (req, res) => {
  const project = await Project.findById(req.params.id);
  res.json(project);
});

router.put('/:id', auth, async (req, res) => {
  const updatedProject = await Project.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updatedProject);
});

router.delete('/:id', auth, async (req, res) => {
  await Project.findByIdAndDelete(req.params.id);
  res.json({ msg: 'Project deleted' });
});

module.exports = router;
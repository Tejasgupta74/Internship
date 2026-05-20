const express = require('express');
const Task = require('../models/Task');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  const task = await Task.create(req.body);
  res.json(task);
});

router.get('/', auth, async (req, res) => {
  const tasks = await Task.find().populate('assignedTo project');
  res.json(tasks);
});

router.get('/:id', auth, async (req, res) => {
  const task = await Task.findById(req.params.id).populate('assignedTo project');
  res.json(task);
});

router.put('/:id', auth, async (req, res) => {
  const updatedTask = await Task.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(updatedTask);
});

router.delete('/:id', auth, async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ msg: 'Task deleted' });
});

module.exports = router;
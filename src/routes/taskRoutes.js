// Semua route task diproteksi JWT

const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const taskController = require('../controllers/taskController');

// Proteksi semua endpoint berikut
router.use(auth);

// GET /api/tasks?done=true&tag=work&page=1&limit=10&sort=dueDate
router.get('/', taskController.listTasks);

// POST /api/tasks
router.post('/', taskController.createTask);

// GET /api/tasks/:id
router.get('/:id', taskController.getTask);

// PUT /api/tasks/:id
router.put('/:id', taskController.updateTask);

// DELETE /api/tasks/:id
router.delete('/:id', taskController.deleteTask);

module.exports = router;

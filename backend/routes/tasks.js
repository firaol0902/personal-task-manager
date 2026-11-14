const router = require('express').Router();

const Task = require('../models/Task');

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Access denied. No token provided.' });

    const token = authHeader.split(' ')[1]; 
    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified; 
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
};


// ROUTE 1: Get All Tasks for Logged-in User (GET /api/tasks)

router.get('/', verifyToken, async (req, res) => {
    try {
        
        const tasks = await Task.find({ userId: req.user.userId }).sort({ createdAt: -1 });
        res.json(tasks);
    } catch (err) {
        console.error('Fetch tasks error:', err);
        res.status(500).json({ error: 'Server error while fetching tasks.' });
    }
});


// ROUTE 2: Create a New Task (POST /api/tasks)

router.post('/', verifyToken, async (req, res) => {
    try {
        const { title } = req.body;
        if (!title) return res.status(400).json({ error: 'Task title is required.' });

        const newTask = new Task({
            title,
            userId: req.user.userId
        });

        await newTask.save();
        res.status(201).json(newTask);
    } catch (err) {
        console.error('Create task error:', err);
        res.status(500).json({ error: 'Server error while creating task.' });
    }
});

// ROUTE 3: Delete a Task (DELETE /api/tasks/:id)

router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
        if (!task) return res.status(404).json({ error: 'Task not found.' });

        res.json({ message: 'Task deleted successfully!' });
    } catch (err) {
        console.error('Delete task error:', err);
        res.status(500).json({ error: 'Server error while deleting task.' });
    }
});


// ROUTE 4: Update a Task (PUT /api/tasks/:id)

router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { title, completed } = req.body;
        
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (completed !== undefined) updateData.completed = completed;

        const updatedTask = await Task.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.userId },
            updateData,
            { new: true } 
        );

        if (!updatedTask) return res.status(404).json({ error: 'Task not found.' });

        res.json(updatedTask);
    } catch (err) {
        console.error('Update task error:', err);
        res.status(500).json({ error: 'Server error while updating task.' });
    }
});
module.exports = router;
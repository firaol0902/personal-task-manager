const express = require('express');

const mongoose = require('mongoose');

const cors = require('cors');

const app = express();

app.use(express.json());

app.use(cors());

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.json({ message: "Task Manager API is running live!" });
});

// API ROUTES REGISTRATION

// Import authentication and task route modules
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

// Tell Express to mount the routes to their respective URL prefixes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);


// DATABASE CONNECTION & SERVER STARTUP

// Define the MongoDB database connection string, falling back to our Docker container network name
const MONGO_URI = process.env.MONGO_URI || 'mongodb://database:27017/taskmanager';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully!');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });
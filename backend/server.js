require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const resourceRoutes = require('./routes/resources');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/resources', resourceRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

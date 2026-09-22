require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const resourceRoutes = require('./routes/resources');
const protect = require('./middleware/auth');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Auth: returns the logged-in user's profile (no DB needed)
// Used by the extension and frontend to verify the token and get user info
app.get('/api/auth/me', protect, (req, res) => {
  res.json(req.user);
});

// Resource routes — all protected
app.use('/api/resources', protect, resourceRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

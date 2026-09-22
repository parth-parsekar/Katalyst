const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  url: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,   // for fast per-user queries
  },
  platform: {
    type: String, // e.g., 'YouTube', 'LeetCode'
  },
  category: {
    type: String,
    required: true,
  },
  timestamp: {
    type: String, // e.g., '1:24' or '84s'
  },
  status: {
    type: String,
    enum: ['To-Do', 'In Progress', 'Completed'],
    default: 'To-Do',
  },
  dateAdded: {
    type: Date,
    default: Date.now,
  },
  dateCompleted: {
    type: Date,
  },
});

module.exports = mongoose.model('Resource', resourceSchema);

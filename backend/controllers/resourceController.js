const Resource = require('../models/Resource');

// @desc    Get all resources (scoped to logged-in user)
// @route   GET /api/resources
// @access  Private
const getResources = async (req, res) => {
  try {
    const resources = await Resource.find({ userId: req.user.googleId }).sort({ dateAdded: -1 });
    res.status(200).json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single resource (scoped to user)
// @route   GET /api/resources/:id
// @access  Private
const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findOne({ _id: req.params.id, userId: req.user.googleId });
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    res.status(200).json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new resource (stamped with userId)
// @route   POST /api/resources
// @access  Private
const createResource = async (req, res) => {
  try {
    const { title, description, url, category, timestamp } = req.body;

    // Basic auto-detection of platform
    let platform = 'Other';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      platform = 'YouTube';
    } else if (url.includes('leetcode.com')) {
      platform = 'LeetCode';
    } else if (url.includes('w3schools.com')) {
      platform = 'W3Schools';
    } else if (url.includes('udemy.com')) {
      platform = 'Udemy';
    } else if (url.includes('coursera.org')) {
      platform = 'Coursera';
    }

    const resource = new Resource({
      title,
      description,
      url,
      platform,
      category,
      timestamp,
      userId: req.user.googleId,   // <-- scope to the creator
    });

    const savedResource = await resource.save();
    res.status(201).json(savedResource);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a resource (only owner can update)
// @route   PUT /api/resources/:id
// @access  Private
const updateResource = async (req, res) => {
  try {
    const { status, title, description, category, url, timestamp } = req.body;
    const resource = await Resource.findOne({ _id: req.params.id, userId: req.user.googleId });

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (title) resource.title = title;
    if (description !== undefined) resource.description = description;
    if (category) resource.category = category;
    if (url) resource.url = url;
    if (timestamp !== undefined) resource.timestamp = timestamp;
    
    if (status) {
      resource.status = status;
      if (status === 'Completed' && !resource.dateCompleted) {
        resource.dateCompleted = Date.now();
      } else if (status !== 'Completed') {
        resource.dateCompleted = undefined; // unset if moved out of completed
      }
    }

    const updatedResource = await resource.save();
    res.status(200).json(updatedResource);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a resource (only owner can delete)
// @route   DELETE /api/resources/:id
// @access  Private
const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findOneAndDelete({ _id: req.params.id, userId: req.user.googleId });
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    res.status(200).json({ message: 'Resource removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
};

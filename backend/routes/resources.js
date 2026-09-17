const express = require('express');
const router = express.Router();
const {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
} = require('../controllers/resourceController');

router.route('/').get(getResources).post(createResource);
router.route('/:id').get(getResourceById).put(updateResource).delete(deleteResource);

module.exports = router;

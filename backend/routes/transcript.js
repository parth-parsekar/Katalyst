const express = require('express');
const router = express.Router();
const { getTranscriptSummary } = require('../controllers/transcriptController');

router.get('/', getTranscriptSummary);

module.exports = router;

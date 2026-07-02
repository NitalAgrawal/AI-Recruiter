const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/copilot.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/job/:jobId', protect, authorize('Recruiter', 'Admin'), chat);

module.exports = router;

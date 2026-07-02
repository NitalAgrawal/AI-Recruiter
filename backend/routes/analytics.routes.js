const express = require('express');
const router = express.Router();
const { getMetrics, generateInsight } = require('../controllers/analytics.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', protect, authorize('Recruiter', 'Admin'), getMetrics);
router.post('/insight', protect, authorize('Recruiter', 'Admin'), generateInsight);

module.exports = router;

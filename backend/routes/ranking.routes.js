const express = require('express');
const router = express.Router();
const { generateRankings, getRankedApplicants } = require('../controllers/ranking.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/job/:jobId', protect, authorize('Recruiter', 'Admin'), generateRankings);
router.get('/job/:jobId', protect, authorize('Recruiter', 'Admin'), getRankedApplicants);

module.exports = router;

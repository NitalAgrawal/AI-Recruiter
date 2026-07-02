const express = require('express');
const router = express.Router();
const { generatePlan, getPlan, updateScorecard } = require('../controllers/interviewPlanner.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/:applicationId', protect, authorize('Recruiter', 'Admin'), generatePlan);
router.get('/:applicationId', protect, authorize('Recruiter', 'Admin'), getPlan);
router.put('/:planId/scorecard', protect, authorize('Recruiter', 'Admin'), updateScorecard);

module.exports = router;

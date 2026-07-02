const express = require('express');
const { getMyProfile, updateMyProfile, getProfileById } = require('../controllers/recruiterProfile.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', protect, authorize('Recruiter', 'Admin'), getMyProfile);
router.put('/', protect, authorize('Recruiter', 'Admin'), updateMyProfile);
router.get('/:userId', protect, authorize('Recruiter', 'Admin'), getProfileById);

module.exports = router;

const express = require('express');
const { getMyProfile, updateMyProfile, getProfileById } = require('../controllers/profile.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../services/upload.service');

const router = express.Router();

// Candidate Routes
router.get('/candidate', protect, authorize('Candidate'), getMyProfile);
router.put('/candidate', protect, authorize('Candidate'), updateMyProfile);

// Recruiter/Admin Routes
router.get('/:userId', protect, authorize('Recruiter', 'Admin'), getProfileById);

module.exports = router;

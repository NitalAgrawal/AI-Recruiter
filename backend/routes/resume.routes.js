const express = require('express');
const { upload: uploadCtrl, getMyHistory, getByApplication, reparse } = require('../controllers/resume.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../services/upload.service');

const router = express.Router();

// All routes are Candidate-only
router.post('/upload',           protect, authorize('Candidate'), upload.single('file'), uploadCtrl);
router.get('/history',           protect, authorize('Candidate'), getMyHistory);
router.get('/:applicationId',    protect, authorize('Candidate', 'Recruiter', 'Admin'), getByApplication);
router.post('/:id/reparse',      protect, authorize('Candidate'), reparse);

module.exports = router;

const express = require('express');
const {
  apply, withdraw, getMyApplications,
  getApplicants, updateStatus, addNotes,
  getAllApplications,
  runSemanticMatch,
  getSemanticMatch
} = require('../controllers/application.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Candidate routes
router.post('/apply/:jobId',  protect, authorize('Candidate'), apply);
router.delete('/:id/withdraw', protect, authorize('Candidate'), withdraw);
router.get('/my',             protect, authorize('Candidate'), getMyApplications);

// Recruiter routes
router.get('/job/:jobId',     protect, authorize('Recruiter', 'Admin'), getApplicants);
router.patch('/:id/status',   protect, authorize('Recruiter', 'Admin'), updateStatus);
router.patch('/:id/notes',    protect, authorize('Recruiter', 'Admin'), addNotes);

// Admin routes
router.get('/all',            protect, authorize('Admin'), getAllApplications);

// Semantic Matching Routes
router.post('/:id/match', protect, authorize('Recruiter', 'Admin'), runSemanticMatch);
router.get('/:id/match', protect, authorize('Recruiter', 'Admin'), getSemanticMatch);

module.exports = router;

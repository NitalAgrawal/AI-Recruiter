const express = require('express');
const { 
  createJob, updateJob, updateJobStatus, deleteJob, 
  cloneJob, getJobById, getRecruiterJobs, getPublishedJobs,
  analyzeJob, getJobAnalysis
} = require('../controllers/job.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Public / Candidate routes
router.get('/', protect, getPublishedJobs); // Anyone logged in can see published jobs
router.get('/:id', protect, getJobById);

// Recruiter routes
router.get('/recruiter/me', protect, authorize('Recruiter', 'Admin'), getRecruiterJobs);
router.post('/', protect, authorize('Recruiter', 'Admin'), createJob);
router.put('/:id', protect, authorize('Recruiter', 'Admin'), updateJob);
router.patch('/:id/status', protect, authorize('Recruiter', 'Admin'), updateJobStatus);
router.post('/:id/clone', protect, authorize('Recruiter', 'Admin'), cloneJob);
router.post('/:id/analyze', protect, authorize('Recruiter', 'Admin'), analyzeJob);
router.get('/:id/analysis', protect, authorize('Recruiter', 'Admin'), getJobAnalysis);
router.delete('/:id', protect, authorize('Recruiter', 'Admin'), deleteJob);

module.exports = router;

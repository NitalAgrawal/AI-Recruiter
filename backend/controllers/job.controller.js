const jobService = require('../services/job.service');
const jobAnalysisService = require('../services/jobAnalysis.service');

exports.createJob = async (req, res) => {
  try {
    const job = await jobService.createJob(req.user.id, req.body);
    res.status(201).json({ success: true, job });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const job = await jobService.updateJob(req.params.id, req.user.id, req.body);
    res.status(200).json({ success: true, job });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Draft', 'Published', 'Closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const job = await jobService.updateJobStatus(req.params.id, req.user.id, status);
    res.status(200).json({ success: true, job });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    await jobService.deleteJob(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.cloneJob = async (req, res) => {
  try {
    const job = await jobService.cloneJob(req.params.id, req.user.id);
    res.status(201).json({ success: true, job });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const job = await jobService.getJobById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.status(200).json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRecruiterJobs = async (req, res) => {
  try {
    const jobs = await jobService.getRecruiterJobs(req.user.id);
    res.status(200).json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPublishedJobs = async (req, res) => {
  try {
    const jobs = await jobService.getPublishedJobs({});
    res.status(200).json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.analyzeJob = async (req, res) => {
  try {
    const result = await jobAnalysisService.analyzeJobAsync(req.params.id, req.user.id);
    res.status(202).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getJobAnalysis = async (req, res) => {
  try {
    const analysis = await jobAnalysisService.getJobAnalysis(req.params.id, req.user.id);
    res.status(200).json({ success: true, analysis });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

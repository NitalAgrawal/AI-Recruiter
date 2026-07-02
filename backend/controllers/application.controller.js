const appService = require('../services/application.service');
const matchingService = require('../services/ai/matching.service');
const Application = require('../models/Application');

// Candidate
exports.apply = async (req, res) => {
  try {
    const { resumeFile, resumeOriginalName, coverLetter } = req.body;
    const application = await appService.applyToJob(req.user.id, req.params.jobId, { resumeFile, resumeOriginalName, coverLetter });
    res.status(201).json({ success: true, application });
  } catch (error) {
    const status = error.message.includes('already applied') ? 409 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

exports.withdraw = async (req, res) => {
  try {
    await appService.withdrawApplication(req.user.id, req.params.id);
    res.status(200).json({ success: true, message: 'Application withdrawn' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const applications = await appService.getMyApplications(req.user.id);
    res.status(200).json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Recruiter
exports.getApplicants = async (req, res) => {
  try {
    const applications = await appService.getApplicantsForJob(req.user.id, req.params.jobId);
    res.status(200).json({ success: true, applications });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const application = await appService.updateStatus(req.user.id, req.params.id, status);
    res.status(200).json({ success: true, application });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.addNotes = async (req, res) => {
  try {
    const { notes } = req.body;
    const application = await appService.addNotes(req.user.id, req.params.id, notes);
    res.status(200).json({ success: true, application });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Admin
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await appService.getAllApplications();
    res.status(200).json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.runSemanticMatch = async (req, res) => {
  try {
    const result = await matchingService.runSemanticMatchAsync(req.params.id);
    res.status(202).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getSemanticMatch = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).select('ai candidate');
    if (!application) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, match: application.ai });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

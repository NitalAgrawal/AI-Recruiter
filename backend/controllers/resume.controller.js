const resumeService = require('../services/resume.service');

exports.upload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a file' });
    const applicationId = req.body.applicationId || null;
    const record = await resumeService.uploadAndParse(req.user.id, req.file, applicationId);
    res.status(201).json({ success: true, resume: record });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getMyHistory = async (req, res) => {
  try {
    const history = await resumeService.getMyResumeHistory(req.user.id);
    res.status(200).json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getByApplication = async (req, res) => {
  try {
    const history = await resumeService.getResumeVersionsByApplication(req.params.applicationId, req.user.id);
    res.status(200).json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.reparse = async (req, res) => {
  try {
    const result = await resumeService.reparse(req.params.id, req.user.id);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

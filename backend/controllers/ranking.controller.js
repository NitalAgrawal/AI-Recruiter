const Application = require('../models/Application');
const rankingService = require('../services/ai/ranking.service');

exports.generateRankings = async (req, res) => {
  try {
    const result = await rankingService.generateRankingsAsync(req.params.jobId);
    res.status(202).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getRankedApplicants = async (req, res) => {
  try {
    const applications = await Application.find({ job: req.params.jobId })
      .populate('candidate', 'fullName email')
      .populate('candidateProfile', 'professionalTitle location yearsOfExperience profilePhotoUrl')
      .select('status ranking candidate candidateProfile resumeFile createdAt')
      .sort({ 'ranking.overallScore': -1 }); // Automatic sorting by AI Overall Score

    res.status(200).json({ success: true, applications });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const analyticsService = require('../services/analytics.service');

exports.getMetrics = async (req, res) => {
  try {
    const { jobId } = req.query;
    const data = await analyticsService.getDashboardMetrics(req.user.id, jobId || null);
    res.status(200).json({ success: true, ...data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.generateInsight = async (req, res) => {
  try {
    const { jobId } = req.body;
    const aiInsight = await analyticsService.generateAiInsight(req.user.id, jobId || null);
    res.status(200).json({ success: true, aiInsight });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

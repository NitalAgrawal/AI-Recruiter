const interviewPlannerService = require('../services/ai/interviewPlanner.service');

exports.generatePlan = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const plan = await interviewPlannerService.generateInterviewPlan(applicationId);
    res.status(200).json({ success: true, plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getPlan = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const plan = await interviewPlannerService.getInterviewPlan(applicationId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    res.status(200).json({ success: true, plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateScorecard = async (req, res) => {
  try {
    const { planId } = req.params;
    const { scorecard, notes, decision } = req.body;
    const updatedPlan = await interviewPlannerService.updateScorecard(planId, scorecard, notes, decision);
    res.status(200).json({ success: true, plan: updatedPlan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

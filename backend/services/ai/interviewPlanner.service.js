const { GoogleGenerativeAI } = require('@google/generative-ai');
const Application = require('../../models/Application');
const Job = require('../../models/Job');
const CandidateProfile = require('../../models/CandidateProfile');
const InterviewPlan = require('../../models/InterviewPlan');
const { getPlannerPrompt } = require('./prompts/interviewPlanner.prompt');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
// Use user-defined model in env, default to flash for speed/cost
const modelName = process.env.INTERVIEW_MODEL || 'gemini-1.5-flash';

exports.generateInterviewPlan = async (applicationId) => {
  if (!genAI) throw new Error('GEMINI_API_KEY missing');

  const application = await Application.findById(applicationId)
    .populate('job')
    .populate('candidateProfile');

  if (!application) throw new Error('Application not found');

  const job = application.job;
  const profile = application.candidateProfile;
  const aiScores = application.ranking || application.ai || {};

  // Formulate minimal context payload
  const jobContext = {
    title: job.title,
    department: job.department,
    requirements: job.requirements || [],
    analysis: job.aiAnalysis?.normalizedData || {}
  };

  const candidateContext = {
    title: profile.professionalTitle,
    experience: profile.yearsOfExperience,
    skills: profile.technicalSkills?.map(s => s.name) || []
  };

  const gapContext = {
    overallScore: aiScores.overallScore || 0,
    semanticScore: aiScores.semanticScore || 0,
    missingSkills: aiScores.missingSkills || [],
    weaknesses: aiScores.weaknesses || []
  };

  const prompt = getPlannerPrompt(jobContext, candidateContext, gapContext);

  const model = genAI.getGenerativeModel({ model: modelName });
  let generatedPlan = {};

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    generatedPlan = JSON.parse(text);
  } catch (err) {
    console.error('Failed to parse Gemini interview plan:', err);
    throw new Error('Failed to generate valid interview plan from AI');
  }

  // Check if a plan already exists
  let plan;
  if (application.interviewPlanId) {
    plan = await InterviewPlan.findById(application.interviewPlanId);
  }

  if (!plan) {
    plan = new InterviewPlan({
      application: application._id,
      job: job._id,
      candidate: application.candidate
    });
  }

  // Populate data
  plan.totalDurationMinutes = generatedPlan.totalDurationMinutes || 60;
  plan.overallDifficulty = generatedPlan.overallDifficulty || 'Medium';
  plan.focusAreas = generatedPlan.focusAreas || [];
  plan.riskAreas = generatedPlan.riskAreas || [];
  plan.stages = generatedPlan.stages || [];

  await plan.save();

  // Link back to application
  application.interviewPlanId = plan._id;
  if (application.interviewStatus === 'Not Scheduled') {
    application.interviewStatus = 'Scheduled';
  }
  await application.save();

  return plan;
};

exports.getInterviewPlan = async (applicationId) => {
  const application = await Application.findById(applicationId).populate('interviewPlanId');
  if (!application || !application.interviewPlanId) return null;
  return application.interviewPlanId;
};

exports.updateScorecard = async (planId, scorecardData, notes, decision) => {
  const plan = await InterviewPlan.findById(planId).populate('application');
  if (!plan) throw new Error('Interview plan not found');

  if (scorecardData) {
    plan.scorecard = { ...plan.scorecard, ...scorecardData };
  }
  if (notes !== undefined) plan.interviewerNotes = notes;
  if (decision !== undefined) plan.finalDecision = decision;

  await plan.save();

  // If a final decision is made, update application status
  if (['Strong Hire', 'Hire', 'Hold', 'Reject'].includes(decision)) {
    plan.application.interviewStatus = 'Completed';
    if (decision === 'Reject') plan.application.status = 'Rejected';
    else if (decision === 'Strong Hire' || decision === 'Hire') plan.application.status = 'Hired'; // Or 'Shortlisted' depending on workflow
    await plan.application.save();
  }

  return plan;
};

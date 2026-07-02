const { GoogleGenerativeAI } = require('@google/generative-ai');
const Application = require('../../models/Application');
const Job = require('../../models/Job');
const CandidateProfile = require('../../models/CandidateProfile');
const { VERSION, WEIGHTS, CONCURRENCY_LIMIT } = require('../../config/ranking.config');
const { getRankingPrompt } = require('./prompts/ranking.prompt');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

// --- Rule-Based Scoring Utility Functions ---

function calculateExperienceScore(profile, jobRequiredExp) {
  if (!profile.experience || profile.experience.length === 0) return 0;
  
  // Base 40 points for having some experience
  let score = 40;
  
  // +10 points per year of experience (cap at 40 points)
  const yrs = profile.yearsOfExperience || 0;
  score += Math.min(40, yrs * 10);
  
  // +10 points if they are currently working
  const currentlyWorking = profile.experience.some(e => e.currentlyWorking);
  if (currentlyWorking) score += 10;
  
  // +10 points if they meet job requirement
  const reqYrs = parseInt(jobRequiredExp) || 0;
  if (yrs >= reqYrs) score += 10;
  
  return Math.min(100, score);
}

function calculateProjectScore(profile) {
  if (!profile.projects || profile.projects.length === 0) return 0;
  
  let score = 0;
  
  // 15 points per project (cap at 60)
  score += Math.min(60, profile.projects.length * 15);
  
  // 10 points per featured project (cap at 20)
  const featured = profile.projects.filter(p => p.featured).length;
  score += Math.min(20, featured * 10);
  
  // 5 points per github url (cap at 20)
  const hasGithub = profile.projects.filter(p => p.githubUrl).length;
  score += Math.min(20, hasGithub * 5);
  
  return Math.min(100, score);
}

function calculateEducationScore(profile) {
  if (!profile.education || profile.education.length === 0) return 0;
  let score = 50; // Base for having education
  
  const hasBachelors = profile.education.some(e => (e.degree || '').toLowerCase().includes('bachelor'));
  const hasMasters = profile.education.some(e => (e.degree || '').toLowerCase().includes('master'));
  const hasPhd = profile.education.some(e => (e.degree || '').toLowerCase().includes('phd'));
  
  if (hasBachelors) score += 20;
  if (hasMasters) score += 20;
  if (hasPhd) score += 30;
  
  // +10 if CGPA is present
  if (profile.education.some(e => e.cgpa)) score += 10;
  
  return Math.min(100, score);
}

function calculateCertificationScore(profile) {
  if (!profile.certifications || profile.certifications.length === 0) return 0;
  return Math.min(100, profile.certifications.length * 25);
}

function calculatePlatformScore(profile) {
  let score = 0;
  if (profile.links?.github) score += 30;
  if (profile.links?.linkedin) score += 30;
  if (profile.links?.portfolio) score += 20;
  if (profile.links?.leetcode) score += 10;
  if (profile.links?.hackerrank) score += 10;
  return score;
}

function calculateProfileScore(profile) {
  let score = 0;
  if (profile.phone) score += 10;
  if (profile.location) score += 10;
  if (profile.professionalTitle) score += 10;
  if (profile.resume?.uploaded) score += 20;
  if (profile.technicalSkills?.length > 0) score += 25;
  if (profile.softSkills?.length > 0) score += 25;
  return score;
}

/**
 * Generate ranking for a single application
 */
async function generateRankingForApplicant(application, job) {
  if (!genAI) throw new Error('GEMINI_API_KEY missing');
  
  const profile = await CandidateProfile.findById(application.candidateProfile);
  if (!profile) throw new Error('Candidate profile not found');
  
  const aiMatch = application.ai || {};
  
  // 1. Calculate Component Scores
  const experienceScore = calculateExperienceScore(profile, job.requiredExperience);
  const projectScore = calculateProjectScore(profile);
  const educationScore = calculateEducationScore(profile);
  const certificationScore = calculateCertificationScore(profile);
  const platformScore = calculatePlatformScore(profile);
  const profileScore = calculateProfileScore(profile);
  const semanticScore = aiMatch.semanticScore || 0;
  
  // 2. Compute Weighted Overall Score
  const overallScore = Math.round(
    (semanticScore * WEIGHTS.semanticMatch) +
    (experienceScore * WEIGHTS.experience) +
    (projectScore * WEIGHTS.projects) +
    (certificationScore * WEIGHTS.certifications) +
    (educationScore * WEIGHTS.education) +
    (profileScore * WEIGHTS.profileCompleteness) +
    (platformScore * WEIGHTS.platformActivity)
  );

  // 3. Prepare Gemini Prompt
  const componentScores = { overallScore, semanticScore, experienceScore, projectScore, educationScore, certificationScore, platformScore, profileScore };
  const jobSummary = job.aiAnalysis?.normalizedData || { title: job.title, department: job.department };
  
  const prompt = getRankingPrompt(jobSummary, aiMatch, aiMatch.missingSkills || [], aiMatch.relatedSkills || [], componentScores);
  
  // 4. Generate AI Explanation
  let aiData = {
    strengths: [], weaknesses: [], recommendation: 'Consider', recommendedInterviewTopics: [], scoreExplanation: 'Error generating AI insight.'
  };

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    aiData = JSON.parse(text);
  } catch (err) {
    console.error('Failed to parse Gemini ranking response:', err.message);
  }

  // 5. Save to Application
  application.ranking = {
    status: 'Completed',
    overallScore,
    semanticScore,
    experienceScore,
    projectScore,
    educationScore,
    certificationScore,
    profileScore,
    platformScore,
    strengths: aiData.strengths || [],
    weaknesses: aiData.weaknesses || [],
    missingSkills: aiMatch.missingSkills || [],
    relatedSkills: aiMatch.relatedSkills || [],
    recommendedInterviewTopics: aiData.recommendedInterviewTopics || [],
    recommendation: aiData.recommendation || 'Consider',
    scoreExplanation: aiData.scoreExplanation || '',
    rankingMetadata: {
      rankingVersion: VERSION,
      rankingWeights: WEIGHTS,
      generatedBy: `rule-based+${modelName}`,
      generatedAt: new Date()
    }
  };
  
  await application.save();
}

/**
 * Batch generate rankings with concurrency limit
 */
exports.generateRankingsAsync = async (jobId) => {
  const job = await Job.findById(jobId);
  if (!job) throw new Error('Job not found');

  const applications = await Application.find({ job: jobId });
  
  // Mark all as processing
  for (const app of applications) {
    app.ranking.status = 'Processing';
    await app.save();
  }

  setImmediate(async () => {
    // Process with Concurrency Limit
    for (let i = 0; i < applications.length; i += CONCURRENCY_LIMIT) {
      const batch = applications.slice(i, i + CONCURRENCY_LIMIT);
      
      await Promise.allSettled(
        batch.map(async (app) => {
          try {
            await generateRankingForApplicant(app, job);
          } catch (error) {
            console.error(`Ranking generation failed for app ${app._id}:`, error);
            app.ranking.status = 'Failed';
            await app.save();
          }
        })
      );
    }
    console.log(`Finished generating rankings for job ${jobId}`);
  });

  return { message: 'Ranking generation started in the background.' };
};

// ─────────────────────────────────────────────────────────────────────────────
// Redrob Signal Boost  (additive utility — does NOT modify existing pipeline)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts Redrob platform signals into a 0–100 signal boost score.
 *
 * Used exclusively by the dataset import scripts to pre-populate
 * Application.ranking.platformScore for seeded candidates. The existing
 * AI ranking pipeline is not modified — this function is called at import
 * time and stored on DatasetCandidate.signalBoostScore.
 *
 * Weights:
 *   Profile completeness    25 %   (direct 0–100 score)
 *   Recruiter response rate 20 %   (0–1 → 0–100)
 *   GitHub activity         20 %   (0–100; -1 = no GitHub → treated as 0)
 *   Interview completion    20 %   (0–1 → 0–100)
 *   Offer acceptance rate   15 %   (0–1 → 0–100; -1 = no history → neutral 50)
 *   Verification bonuses   +7 pts  (email +2, phone +2, LinkedIn +3)
 *   Open-to-work bonus     +3 pts
 *
 * @param {Object} redrobSignals  Raw redrob_signals object from dataset
 * @returns {number} 0–100 integer score
 */
exports.calculateRedrobSignalBoost = (redrobSignals) => {
  if (!redrobSignals) return 0;

  let score = 0;

  // 1. Profile completeness (0–100) × 0.25
  score += (redrobSignals.profile_completeness_score || 0) * 0.25;

  // 2. Recruiter response rate (0–1) × 0.20 → normalised to 0–100
  score += (redrobSignals.recruiter_response_rate || 0) * 100 * 0.20;

  // 3. GitHub activity score (0–100; -1 = no GitHub linked → 0) × 0.20
  const githubScore = (redrobSignals.github_activity_score > 0)
    ? redrobSignals.github_activity_score
    : 0;
  score += githubScore * 0.20;

  // 4. Interview completion rate (0–1) × 0.20 → normalised to 0–100
  score += (redrobSignals.interview_completion_rate || 0) * 100 * 0.20;

  // 5. Offer acceptance rate (0–1; -1 = no offer history → neutral 0.50) × 0.15
  const offerRate = (redrobSignals.offer_acceptance_rate >= 0)
    ? redrobSignals.offer_acceptance_rate
    : 0.50;
  score += offerRate * 100 * 0.15;

  // 6. Verification bonuses (up to +7 pts)
  if (redrobSignals.verified_email)    score += 2;
  if (redrobSignals.verified_phone)    score += 2;
  if (redrobSignals.linkedin_connected) score += 3;

  // 7. Open-to-work signal bonus (+3 pts)
  if (redrobSignals.open_to_work_flag) score += 3;

  return Math.min(100, Math.round(score));
};

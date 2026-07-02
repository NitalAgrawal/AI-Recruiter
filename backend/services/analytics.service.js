const { GoogleGenerativeAI } = require('@google/generative-ai');
const Application = require('../models/Application');
const Job = require('../models/Job');
const AnalyticsCache = require('../models/AnalyticsCache');
const { getAnalyticsPrompt } = require('./ai/prompts/analytics.prompt');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

// Configurable cache durations
const METRICS_CACHE_MINUTES = 5;
const AI_INSIGHT_CACHE_HOURS = 1;

/**
 * Perform heavy MongoDB aggregations for either Global or Job-scoped metrics
 */
async function computeAggregations(recruiterId, jobId = null) {
  const matchFilter = { recruiter: recruiterId };
  if (jobId) matchFilter.job = jobId;

  // Run multiple aggregations in parallel to minimize latency
  const [
    averages,
    recommendationBreakdown,
    statusFunnel,
    skillsData
  ] = await Promise.all([
    // 1. Averages
    Application.aggregate([
      { $match: matchFilter },
      { 
        $group: { 
          _id: null,
          avgSemanticScore: { $avg: '$ranking.semanticScore' },
          avgOverallScore: { $avg: '$ranking.overallScore' },
          avgExperienceScore: { $avg: '$ranking.experienceScore' },
          avgProfileScore: { $avg: '$ranking.profileScore' },
          avgTimeInDays: { 
            $avg: { 
              $divide: [
                { $subtract: [{ $ifNull: ['$ranking.rankingMetadata.generatedAt', new Date()] }, '$createdAt'] },
                1000 * 60 * 60 * 24
              ] 
            }
          },
          totalApplications: { $sum: 1 },
          totalRanked: { 
            $sum: { $cond: [{ $eq: ['$ranking.status', 'Completed'] }, 1, 0] } 
          }
        } 
      }
    ]),

    // 2. Recommendations Breakdown
    Application.aggregate([
      { $match: { ...matchFilter, 'ranking.status': 'Completed' } },
      { $group: { _id: '$ranking.recommendation', count: { $sum: 1 } } }
    ]),

    // 3. Status / Hiring Funnel
    Application.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),

    // 4. Skills (Unwind and count Matched, Missing, Related)
    Application.aggregate([
      { $match: matchFilter },
      { $project: { matchedSkills: '$ranking.relatedSkills', missingSkills: '$ranking.missingSkills', exactMatches: '$ai.matchedSkills' } }
    ])
  ]);

  const avgData = averages[0] || {};
  
  // Format Recommendations
  const recMap = { 'Strong Hire': 0, 'Hire': 0, 'Consider': 0, 'Not Recommended': 0 };
  recommendationBreakdown.forEach(item => { if(item._id) recMap[item._id] = item.count; });
  
  // Format Funnel
  const funnelMap = { 'Applied': 0, 'Under Review': 0, 'Shortlisted': 0, 'Interview Scheduled': 0, 'Hired': 0, 'Rejected': 0 };
  statusFunnel.forEach(item => { if(item._id) funnelMap[item._id] = item.count; });
  
  // Calculate Conversion Rates
  const totalApps = avgData.totalApplications || 0;
  const interviewConversion = totalApps > 0 ? ((funnelMap['Interview Scheduled'] || 0) / totalApps * 100).toFixed(1) : 0;
  const hireConversion = totalApps > 0 ? ((funnelMap['Hired'] || 0) / totalApps * 100).toFixed(1) : 0;

  // Process Skills in memory (faster than heavy Mongo unwinds for arrays)
  const matchedCounts = {};
  const missingCounts = {};
  const emergingCounts = {}; // related skills
  
  skillsData.forEach(app => {
    (app.exactMatches || []).forEach(s => matchedCounts[s] = (matchedCounts[s] || 0) + 1);
    (app.missingSkills || []).forEach(s => missingCounts[s] = (missingCounts[s] || 0) + 1);
    (app.matchedSkills || []).forEach(s => emergingCounts[s] = (emergingCounts[s] || 0) + 1);
  });

  const getTop = (obj) => Object.entries(obj).sort((a,b) => b[1] - a[1]).slice(0, 10).map(x => ({ name: x[0], count: x[1] }));

  // Get Active Jobs count
  let activeJobsCount = 0;
  if (!jobId) {
    activeJobsCount = await Job.countDocuments({ recruiter: recruiterId, status: 'Published' });
  }

  return {
    kpis: {
      totalApplications: totalApps,
      totalRanked: avgData.totalRanked || 0,
      activeJobs: activeJobsCount,
      totalStrongHires: recMap['Strong Hire'] || 0,
      avgSemanticScore: Math.round(avgData.avgSemanticScore || 0),
      avgOverallScore: Math.round(avgData.avgOverallScore || 0),
      avgProfileScore: Math.round(avgData.avgProfileScore || 0),
      avgTimeInDays: (avgData.avgTimeInDays || 0).toFixed(1),
      interviewConversionRate: Number(interviewConversion),
      hireConversionRate: Number(hireConversion)
    },
    recommendations: [
      { name: 'Strong Hire', value: recMap['Strong Hire'] },
      { name: 'Hire', value: recMap['Hire'] },
      { name: 'Consider', value: recMap['Consider'] },
      { name: 'Not Recommended', value: recMap['Not Recommended'] }
    ],
    funnel: [
      { name: 'Applied', value: funnelMap['Applied'] },
      { name: 'Under Review', value: funnelMap['Under Review'] },
      { name: 'Shortlisted', value: funnelMap['Shortlisted'] },
      { name: 'Interview', value: funnelMap['Interview Scheduled'] },
      { name: 'Hired', value: funnelMap['Hired'] }
    ],
    skills: {
      matched: getTop(matchedCounts),
      missing: getTop(missingCounts),
      emerging: getTop(emergingCounts)
    }
  };
}

/**
 * Fetch Analytics Dashboard Data
 */
exports.getDashboardMetrics = async (recruiterId, jobId = null) => {
  // Check Cache
  const filter = { recruiter: recruiterId, job: jobId };
  let cache = await AnalyticsCache.findOne(filter);
  
  if (cache && cache.metrics && cache.metricsUpdatedAt) {
    const minDiff = (new Date() - cache.metricsUpdatedAt) / 1000 / 60;
    if (minDiff < METRICS_CACHE_MINUTES) {
      return { metrics: cache.metrics, aiInsight: cache.aiInsight };
    }
  }

  // Generate new metrics
  const metrics = await computeAggregations(recruiterId, jobId);
  
  // Upsert cache
  if (!cache) {
    cache = new AnalyticsCache({ recruiter: recruiterId, job: jobId });
  }
  cache.metrics = metrics;
  cache.metricsUpdatedAt = new Date();
  await cache.save();

  return { metrics, aiInsight: cache.aiInsight };
};

/**
 * Generate AI Insight
 */
exports.generateAiInsight = async (recruiterId, jobId = null) => {
  if (!genAI) throw new Error('GEMINI_API_KEY missing');

  const filter = { recruiter: recruiterId, job: jobId };
  let cache = await AnalyticsCache.findOne(filter);
  
  if (!cache || !cache.metrics) {
    throw new Error('Metrics not found. Please load dashboard first.');
  }

  // Enforce 1 hour cache limit unless explicitly bypassed (handled on frontend via boolean, but here we just generate if called)
  
  const prompt = getAnalyticsPrompt(cache.metrics);
  const model = genAI.getGenerativeModel({ model: modelName });
  
  let aiData = {};
  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    aiData = JSON.parse(text);
  } catch (err) {
    console.error('Failed to parse Gemini insight:', err);
    throw new Error('Failed to generate AI insight.');
  }

  cache.aiInsight = aiData;
  cache.aiInsightUpdatedAt = new Date();
  await cache.save();

  return aiData;
};

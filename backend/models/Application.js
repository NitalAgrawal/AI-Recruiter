const mongoose = require('mongoose');

const aiScoreSchema = new mongoose.Schema({
  semanticScore: { type: Number, default: null },
  technicalSkillScore: { type: Number, default: null },
  softSkillScore: { type: Number, default: null },
  experienceScore: { type: Number, default: null },
  projectScore: { type: Number, default: null },
  educationScore: { type: Number, default: null },
  certificationScore: { type: Number, default: null },
  
  matchedSkills: [{ type: String }],
  missingSkills: [{ type: String }],
  relatedSkills: [{ type: String }],
  
  confidence: {
    overall: { type: Number, default: null },
    technical: { type: Number, default: null },
    experience: { type: Number, default: null },
    education: { type: Number, default: null }
  },

  matchingMetadata: {
    embeddingModel: { type: String, default: '' },
    similarityAlgorithm: { type: String, default: 'Cosine' },
    matchingVersion: { type: String, default: '1.0.0' },
    processedAt: { type: Date }
  },

  aiStatus: { type: String, enum: ['Pending', 'Processing', 'Completed', 'Failed'], default: 'Pending' }
}, { _id: false });

const applicationSchema = new mongoose.Schema(
  {
    // Ownership
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    candidateProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'CandidateProfile', required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Resume at time of apply
    resumeFile: { type: String, default: '' },       // URL from upload service
    resumeOriginalName: { type: String, default: '' },
    resumeVersion: { type: String, default: '' },
    resumeUploadedAt: { type: Date },

    // Status
    status: {
      type: String,
      enum: ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Rejected', 'Hired'],
      default: 'Applied'
    },

    // Optional extras
    coverLetter: { type: String, default: '' },
    notes: { type: String, default: '' },             // Internal recruiter notes

    // AI Semantic prep
    ai: aiScoreSchema,

    // AI Candidate Ranking Engine
    ranking: {
      status: { type: String, enum: ['Pending', 'Processing', 'Completed', 'Failed'], default: 'Pending' },
      overallScore: { type: Number, default: null },
      
      // Component Scores
      semanticScore: { type: Number, default: null },
      experienceScore: { type: Number, default: null },
      projectScore: { type: Number, default: null },
      educationScore: { type: Number, default: null },
      certificationScore: { type: Number, default: null },
      profileScore: { type: Number, default: null },
      platformScore: { type: Number, default: null },
      
      // AI Explanations
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      missingSkills: [{ type: String }],
      relatedSkills: [{ type: String }],
      recommendedInterviewTopics: [{ type: String }],
      recommendation: { type: String, enum: ['Strong Hire', 'Hire', 'Consider', 'Not Recommended', ''], default: '' },
      scoreExplanation: { type: String, default: '' },
      
      // Metadata
      rankingMetadata: {
        rankingVersion: { type: String, default: '1.0.0' },
        rankingWeights: { type: Object, default: {} },
        generatedBy: { type: String, default: 'rule-based+gemini' },
        generatedAt: { type: Date }
      }
    },

    // Interview Planner
    interviewPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewPlan', default: null },
    interviewStatus: { type: String, enum: ['Not Scheduled', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'], default: 'Not Scheduled' }
  },
  { timestamps: true }
);

// Prevent duplicate applications
applicationSchema.index({ candidate: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);

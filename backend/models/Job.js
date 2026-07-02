const mongoose = require('mongoose');

const applicationSettingsSchema = new mongoose.Schema({
  maxApplications: { type: Number, default: 0 }, // 0 means unlimited
  autoClose: { type: Boolean, default: false },
  allowResumeUpdate: { type: Boolean, default: true },
  allowCoverLetter: { type: Boolean, default: false }
}, { _id: false });

const aiProcessingSchema = new mongoose.Schema({
  status: { type: String, enum: ['Pending', 'Processing', 'Completed', 'Failed'], default: 'Pending' },
  extractedSkills: [{ type: String }],
  extractedKeywords: [{ type: String }],
  embeddingId: { type: String, default: '' },
  embeddingModel: { type: String, default: '' },
  lastProcessedAt: { type: Date }
}, { _id: false });

const aiAnalysisSchema = new mongoose.Schema({
  status: { type: String, enum: ['Pending', 'Processing', 'Completed', 'Failed'], default: 'Pending' },
  summary: { type: String, default: '' },
  normalizedData: {
    seniority: { type: String, default: '' },
    jobDomain: { type: String, default: '' },
    industry: { type: String, default: '' },
    jobCategory: { type: String, default: '' },
    experienceLevel: { type: String, default: '' },
    requiredSkills: [{ type: String }],
    preferredSkills: [{ type: String }],
    mustHaveSkills: [{ type: String }],
    niceToHaveSkills: [{ type: String }],
    softSkills: [{ type: String }],
    technicalSkills: [{ type: String }],
    technologies: [{ type: String }],
    tools: [{ type: String }],
    programmingLanguages: [{ type: String }],
    educationRequirements: [{ type: String }],
    certifications: [{ type: String }],
    keywords: [{ type: String }],
    responsibilities: [{ type: String }],
    recommendedInterviewTopics: [{ type: String }],
    missingInformation: [{ type: String }]
  },
  rawResponse: { type: String, default: '' },
  model: { type: String, default: '' },
  promptVersion: { type: String, default: '' },
  confidence: {
    overall: { type: Number, default: 0 },
    skills: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    education: { type: Number, default: 0 }
  },
  analyzedAt: { type: Date }
}, { _id: false });

const jobSchema = new mongoose.Schema(
  {
    // Ownership
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'RecruiterProfile', required: true },
    
    // Basic Information
    title: { type: String, required: true },
    department: { type: String, default: '' },
    employmentType: { 
      type: String, 
      enum: ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance', 'Apprenticeship'], 
      default: 'Full-time' 
    },
    workplaceType: { type: String, enum: ['Remote', 'Hybrid', 'Onsite'], default: 'Onsite' },
    location: { type: String, default: '' },
    
    // Visibility & Status
    status: { type: String, enum: ['Draft', 'Published', 'Closed'], default: 'Draft' },
    visibility: { type: String, enum: ['Public', 'Private', 'Campus Only'], default: 'Public' },

    // Job Details
    description: { type: String, default: '' }, // Rich text HTML
    responsibilities: [{ type: String }],
    requiredSkills: [{ type: String }],
    preferredSkills: [{ type: String }],
    requiredExperience: { type: String, default: '' },
    educationRequirement: { type: String, default: '' },
    certifications: [{ type: String }],
    openings: { type: Number, default: 1 },

    // Compensation
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    currency: { type: String, default: 'USD' },
    benefits: [{ type: String }],

    // Hiring Configuration
    applicationDeadline: { type: Date },
    hiringManager: { type: String, default: '' },
    applicationSettings: applicationSettingsSchema,

    // AI Prep
    aiEnabled: { type: Boolean, default: true },
    aiProcessing: aiProcessingSchema,
    aiAnalysis: aiAnalysisSchema
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);

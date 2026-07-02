const mongoose = require('mongoose');

const resumeVersionSchema = new mongoose.Schema(
  {
    // Ownership
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    candidateProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'CandidateProfile', required: true },
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' }, // Optional — linked when applied

    // File storage
    fileUrl: { type: String, required: true },
    originalFileName: { type: String, required: true },
    fileType: { type: String, enum: ['pdf', 'docx'], required: true },
    fileSizeBytes: { type: Number },
    version: { type: Number, default: 1 },

    // Raw extracted text
    resumeText: { type: String, default: '' },

    // Structured parsed output
    parsedResume: {
      personalInfo: {
        name: String,
        email: String,
        phone: String,
        location: String
      },
      skills: {
        technical: [String],
        soft: [String]
      },
      experience: [{
        company: String,
        position: String,
        startDate: String,
        endDate: String,
        description: String
      }],
      education: [{
        degree: String,
        institution: String,
        graduationYear: String,
        cgpa: String
      }],
      projects: [{
        title: String,
        description: String,
        technologies: [String]
      }],
      certifications: [{
        name: String,
        organization: String
      }],
      links: {
        github: String,
        linkedin: String,
        portfolio: String,
        leetcode: String,
        hackerrank: String
      },
      totalYearsExperience: Number
    },

    // Parsing metadata
    parsingStatus: {
      type: String,
      enum: ['Pending', 'Processing', 'Completed', 'Failed'],
      default: 'Pending'
    },
    parserVersion: { type: String, default: '1.0.0' },
    parsedAt: { type: Date },
    parsingError: { type: String, default: '' },

    // AI prep (for future semantic matching)
    aiReady: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ResumeVersion', resumeVersionSchema);

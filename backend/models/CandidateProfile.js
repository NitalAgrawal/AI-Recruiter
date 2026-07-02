const mongoose = require('mongoose');

const technicalSkillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  proficiency: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
  yearsOfExperience: { type: Number, default: 0 }
}, { _id: false });

const educationSchema = new mongoose.Schema({
  degree: String,
  college: String,
  graduationYear: String,
  cgpa: String
});

const projectSchema = new mongoose.Schema({
  title: String,
  description: String,
  technologies: [String],
  githubUrl: String,
  liveUrl: String,
  featured: { type: Boolean, default: false }
});

const experienceSchema = new mongoose.Schema({
  company: String,
  position: String,
  startDate: Date,
  endDate: Date,
  currentlyWorking: { type: Boolean, default: false },
  description: String
});

const certificationSchema = new mongoose.Schema({
  title: String,
  organization: String,
  issueDate: Date
});

const candidateProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    // Personal Information
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    profilePhotoUrl: { type: String, default: '' }, // Often maps to User.avatar, but stored here for candidate-specific views
    
    // Professional Information
    professionalTitle: { type: String, default: '' },
    yearsOfExperience: { type: Number, default: 0 },
    currentCompany: { type: String, default: '' },
    currentRole: { type: String, default: '' },
    
    // Skills
    technicalSkills: [technicalSkillSchema],
    softSkills: [{ type: String }],
    
    // Arrays of Data
    education: [educationSchema],
    projects: [projectSchema],
    experience: [experienceSchema],
    certifications: [certificationSchema],
    
    // Platform Links
    links: {
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      portfolio: { type: String, default: '' },
      leetcode: { type: String, default: '' },
      hackerrank: { type: String, default: '' }
    },
    
    // Candidate Preferences
    preferences: {
      preferredRoles: [{ type: String }],
      preferredLocations: [{ type: String }],
      remotePreference: { type: String, enum: ['Remote', 'Hybrid', 'On-site', 'Any'], default: 'Any' },
      expectedSalary: { type: String, default: '' },
      employmentType: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Any'], default: 'Any' }
    },
    
    // Resume Object
    resume: {
      uploaded: { type: Boolean, default: false },
      fileUrl: { type: String, default: '' },
      originalFileName: { type: String, default: '' },
      parsed: { type: Boolean, default: false },
      parsedText: { type: String, default: '' },
      uploadedAt: { type: Date },
      parserVersion: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CandidateProfile', candidateProfileSchema);

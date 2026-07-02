const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  name: String,
  role: String,
  email: String
});

const recruiterProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    // Company Information
    companyName: { type: String, default: '' },
    companyLogo: { type: String, default: '' },
    industry: { type: String, default: '' },
    companySize: { type: String, default: '' },
    foundedYear: { type: String, default: '' },
    website: { type: String, default: '' },
    headquarters: { type: String, default: '' },
    description: { type: String, default: '' },
    companyEmail: { type: String, default: '' },
    companyPhone: { type: String, default: '' },
    recruitmentEmail: { type: String, default: '' },
    recruitmentWebsite: { type: String, default: '' },
    
    // Recruiter Information
    jobTitle: { type: String, default: '' },
    phone: { type: String, default: '' },
    
    // Hiring Preferences
    hiringPreferences: {
      departments: [{ type: String }],
      experienceLevels: [{ type: String }],
      employmentTypes: [{ type: String }],
      preferredSkills: [{ type: String }],
      preferredLocations: [{ type: String }],
      remotePolicy: { type: String, enum: ['Remote', 'Hybrid', 'On-site', 'Any'], default: 'Any' },
      salaryBudget: { type: String, default: '' }
    },
    
    // Team Section
    team: [teamMemberSchema],
    
    // Social Links
    links: {
      linkedin: { type: String, default: '' },
      twitter: { type: String, default: '' }
    },
    
    // Verification
    verification: {
      status: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
      documents: [{ type: String }] // URLs to verification docs
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('RecruiterProfile', recruiterProfileSchema);

const CandidateProfile = require('../models/CandidateProfile');

exports.getProfileByUserId = async (userId) => {
  return await CandidateProfile.findOne({ user: userId }).populate('user', 'fullName email avatar');
};

exports.updateProfile = async (userId, updateData) => {
  const profile = await CandidateProfile.findOneAndUpdate(
    { user: userId },
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate('user', 'fullName email avatar');
  return profile;
};

exports.calculateCompletion = (profile) => {
  const sections = [
    { name: 'Personal Information', check: (p) => p.phone && p.location },
    { name: 'Professional Summary', check: (p) => p.professionalTitle && p.yearsOfExperience > 0 },
    { name: 'Technical Skills', check: (p) => p.technicalSkills && p.technicalSkills.length > 0 },
    { name: 'Soft Skills', check: (p) => p.softSkills && p.softSkills.length > 0 },
    { name: 'Education', check: (p) => p.education && p.education.length > 0 },
    { name: 'Experience', check: (p) => p.experience && p.experience.length > 0 },
    { name: 'Resume', check: (p) => p.resume && p.resume.uploaded }
  ];

  const completedSections = [];
  const missingSections = [];

  sections.forEach(sec => {
    if (sec.check(profile)) {
      completedSections.push(sec.name);
    } else {
      missingSections.push(sec.name);
    }
  });

  const completionPercentage = Math.round((completedSections.length / sections.length) * 100);

  return {
    completionPercentage,
    completedSections,
    missingSections
  };
};

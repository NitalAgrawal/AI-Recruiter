const RecruiterProfile = require('../models/RecruiterProfile');

exports.getProfileByUserId = async (userId) => {
  return await RecruiterProfile.findOne({ user: userId }).populate('user', 'fullName email avatar');
};

exports.updateProfile = async (userId, updateData) => {
  const profile = await RecruiterProfile.findOneAndUpdate(
    { user: userId },
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate('user', 'fullName email avatar');
  return profile;
};

exports.calculateCompletion = (profile) => {
  const sections = [
    { name: 'Company Details', check: (p) => p.companyName && p.industry && p.headquarters },
    { name: 'Contact Info', check: (p) => p.jobTitle && p.phone && p.companyEmail },
    { name: 'Company Logo', check: (p) => !!p.companyLogo },
    { name: 'Hiring Preferences', check: (p) => p.hiringPreferences && p.hiringPreferences.departments.length > 0 },
    { name: 'Company Description', check: (p) => !!p.description }
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

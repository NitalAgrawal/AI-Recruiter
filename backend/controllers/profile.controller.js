const profileService = require('../services/profile.service');
const resumeService = require('../services/resume.service');

exports.getMyProfile = async (req, res) => {
  try {
    const profile = await profileService.getProfileByUserId(req.user.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    
    const metrics = profileService.calculateCompletion(profile);

    res.status(200).json({
      success: true,
      profile,
      metrics
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const profile = await profileService.updateProfile(req.user.id, req.body);
    const metrics = profileService.calculateCompletion(profile);

    res.status(200).json({
      success: true,
      profile,
      metrics
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin/Recruiter views
exports.uploadFile = async (req, res) => {
  try {
    const { type } = req.body; // 'avatar' or 'resume'
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    if (type === 'resume') {
      await resumeService.uploadAndParse(req.user.id, file);
    } else if (type === 'avatar') {
      await profileService.updateProfile(req.user.id, { profilePhotoUrl: `/uploads/${file.filename}` });
    }

    const profile = await profileService.getProfileByUserId(req.user.id);
    const metrics = profileService.calculateCompletion(profile);

    res.status(200).json({ success: true, profile, metrics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin/Recruiter views
exports.getProfileById = async (req, res) => {
  try {
    // Assuming the param is the Profile ID, or User ID. Let's assume User ID for consistency.
    const profile = await profileService.getProfileByUserId(req.params.userId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    
    const metrics = profileService.calculateCompletion(profile);

    res.status(200).json({
      success: true,
      profile,
      metrics
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

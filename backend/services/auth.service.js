const User = require('../models/User');
const RecruiterProfile = require('../models/RecruiterProfile');
const CandidateProfile = require('../models/CandidateProfile');
const bcrypt = require('bcryptjs');

exports.registerUser = async ({ fullName, email, password, role }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Email already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    fullName,
    email,
    password: hashedPassword,
    role,
  });

  // Automatically create the linked profile in a modular way
  await this.createUserProfile(user);

  return user;
};

exports.createUserProfile = async (user) => {
  if (user.role === 'Recruiter') {
    return await RecruiterProfile.create({ user: user._id });
  } else if (user.role === 'Candidate') {
    return await CandidateProfile.create({ user: user._id });
  }
  // No profile needed for Admin
  return null;
};

exports.loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  return user;
};

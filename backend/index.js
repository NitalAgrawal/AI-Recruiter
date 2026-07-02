require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const recruiterProfileRoutes = require('./routes/recruiterProfile.routes');
const uploadRoutes = require('./routes/upload.routes');
const jobRoutes = require('./routes/job.routes');
const applicationRoutes = require('./routes/application.routes');
const resumeRoutes = require('./routes/resume.routes');
const rankingRoutes = require('./routes/ranking.routes');
const copilotRoutes = require('./routes/copilot.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const interviewPlannerRoutes = require('./routes/interviewPlanner.routes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/recruiter-profile', recruiterProfileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/copilot', copilotRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/interview-planner', interviewPlannerRoutes);

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/talentai';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

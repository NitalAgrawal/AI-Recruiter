const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  expectedAnswer: { type: String, default: '' },
  difficulty: { type: String, enum: ['Beginner', 'Medium', 'Hard', 'Expert'], default: 'Medium' },
  evaluationCriteria: { type: String, default: '' },
  weight: { type: Number, default: 1 },
  followUpQuestion: { type: String, default: '' }
}, { _id: false });

const stageSchema = new mongoose.Schema({
  stageName: { type: String, required: true }, // e.g. "Technical Round", "System Design", "Behavioral"
  description: { type: String, default: '' },
  durationMinutes: { type: Number, default: 30 },
  questions: [questionSchema]
}, { _id: false });

const interviewPlanSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Plan Configuration
    totalDurationMinutes: { type: Number, default: 60 },
    overallDifficulty: { type: String, enum: ['Beginner', 'Medium', 'Hard', 'Expert'], default: 'Medium' },
    focusAreas: [{ type: String }],
    riskAreas: [{ type: String }],
    
    // The Generated Plan
    stages: [stageSchema],
    
    // Recruiter Scorecard (Filled out during/after interview)
    scorecard: {
      technicalKnowledge: { type: Number, min: 0, max: 10, default: 0 },
      communication: { type: Number, min: 0, max: 10, default: 0 },
      problemSolving: { type: Number, min: 0, max: 10, default: 0 },
      leadership: { type: Number, min: 0, max: 10, default: 0 },
      culturalFit: { type: Number, min: 0, max: 10, default: 0 }
    },
    
    // Final Output
    interviewerNotes: { type: String, default: '' },
    finalDecision: { type: String, enum: ['Pending', 'Strong Hire', 'Hire', 'Hold', 'Reject'], default: 'Pending' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('InterviewPlan', interviewPlanSchema);

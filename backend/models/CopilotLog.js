const mongoose = require('mongoose');

const copilotLogSchema = new mongoose.Schema(
  {
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    prompt: { type: String, required: true },
    response: { type: String, default: '' },
    // timestamp is handled by timestamps: true
  },
  { timestamps: true }
);

module.exports = mongoose.model('CopilotLog', copilotLogSchema);

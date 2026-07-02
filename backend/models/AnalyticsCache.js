const mongoose = require('mongoose');

const analyticsCacheSchema = new mongoose.Schema(
  {
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null }, // Null means Global context
    
    // Cached Data
    metrics: { type: Object, default: null },
    metricsUpdatedAt: { type: Date, default: null },
    
    aiInsight: { type: Object, default: null },
    aiInsightUpdatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Prevent duplicates
analyticsCacheSchema.index({ recruiter: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('AnalyticsCache', analyticsCacheSchema);

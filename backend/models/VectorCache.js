const mongoose = require('mongoose');

const vectorCacheSchema = new mongoose.Schema(
  {
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Job ID or ResumeVersion ID
    entityType: { type: String, enum: ['Job', 'Resume'], required: true },
    field: { type: String, required: true }, // e.g., 'technicalSkills', 'experience', 'education'
    
    embedding: { type: [Number], required: true },
    
    model: { type: String, required: true }, // e.g., 'text-embedding-004'
    contentHash: { type: String, required: true }, // SHA-256 of the input text
  },
  { timestamps: true }
);

// Indexes to quickly find cached embeddings
vectorCacheSchema.index({ entityId: 1, entityType: 1, field: 1, model: 1, contentHash: 1 }, { unique: true });

module.exports = mongoose.model('VectorCache', vectorCacheSchema);

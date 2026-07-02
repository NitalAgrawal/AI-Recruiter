const mongoose = require('mongoose');

/**
 * DatasetCandidate
 *
 * Stores the raw Redrob hackathon dataset record alongside cross-references
 * to the created User, CandidateProfile, and ResumeVersion.
 *
 * Acts as the import registry:
 *   - candidate_id is the unique idempotency key
 *   - redrobSignals surfaces platform signals for the AI ranking pipeline
 *   - Fully additive — no existing model is modified
 */

const redrobSignalsSchema = new mongoose.Schema({
  profile_completeness_score:   { type: Number, default: 0 },
  signup_date:                  { type: Date },
  last_active_date:             { type: Date },
  open_to_work_flag:            { type: Boolean, default: false },
  profile_views_received_30d:   { type: Number, default: 0 },
  applications_submitted_30d:   { type: Number, default: 0 },
  recruiter_response_rate:      { type: Number, default: 0 },
  avg_response_time_hours:      { type: Number, default: 0 },
  skill_assessment_scores:      { type: Map, of: Number, default: {} },
  connection_count:             { type: Number, default: 0 },
  endorsements_received:        { type: Number, default: 0 },
  notice_period_days:           { type: Number, default: 0 },
  expected_salary_range_inr_lpa: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 }
  },
  preferred_work_mode:          { type: String, enum: ['remote', 'hybrid', 'onsite', 'flexible'], default: 'flexible' },
  willing_to_relocate:          { type: Boolean, default: false },
  github_activity_score:        { type: Number, default: -1 },  // -1 = no GitHub linked
  search_appearance_30d:        { type: Number, default: 0 },
  saved_by_recruiters_30d:      { type: Number, default: 0 },
  interview_completion_rate:    { type: Number, default: 0 },
  offer_acceptance_rate:        { type: Number, default: -1 }, // -1 = no offer history
  verified_email:               { type: Boolean, default: false },
  verified_phone:               { type: Boolean, default: false },
  linkedin_connected:           { type: Boolean, default: false }
}, { _id: false });

const datasetCandidateSchema = new mongoose.Schema(
  {
    // ── Unique dataset identifier ───────────────────────────────────────────
    candidateId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      match: [/^CAND_[0-9]{7}$/, 'Must be CAND_XXXXXXX format']
    },

    // ── Cross-references to created documents ───────────────────────────────
    userId:             { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    candidateProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'CandidateProfile' },
    resumeVersionId:    { type: mongoose.Schema.Types.ObjectId, ref: 'ResumeVersion' },

    // ── Raw Redrob platform signals ─────────────────────────────────────────
    redrobSignals: { type: redrobSignalsSchema, default: {} },

    // ── Computed signal boost score (0–100) ─────────────────────────────────
    // Pre-computed at import time; used by ranking pipeline
    signalBoostScore: { type: Number, default: 0, min: 0, max: 100 },

    // ── Original profile snapshot ────────────────────────────────────────────
    originalProfile: {
      headline:              { type: String, default: '' },
      summary:               { type: String, default: '' },
      country:               { type: String, default: '' },
      current_industry:      { type: String, default: '' },
      current_company_size:  { type: String, default: '' }
    },

    // ── Import metadata ──────────────────────────────────────────────────────
    sourceFile:     { type: String, default: 'candidates.jsonl' },
    datasetVersion: { type: String, default: 'india_runs_v1' },
    importMode:     { type: String, enum: ['dev', 'prod'], default: 'dev' }
  },
  { timestamps: true }
);

// Compound index: fast lookup by userId or candidateProfileId
datasetCandidateSchema.index({ userId: 1 });
datasetCandidateSchema.index({ candidateProfileId: 1 });
datasetCandidateSchema.index({ signalBoostScore: -1 }); // For ranking queries

module.exports = mongoose.model('DatasetCandidate', datasetCandidateSchema);

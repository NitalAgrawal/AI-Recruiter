#!/usr/bin/env node
/**
 * resetDatabase.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Resets the database to a clean slate.
 *
 * Removes:
 *   - All imported dataset candidates (from DatasetCandidate)
 *   - Dataset-derived users (emails ending in @ai-recruiter.org / @airecruiter.org)
 *   - Seeded recruiter user (talent@redrob.org / talent@redrob.dataset)
 *   - Linked CandidateProfile & ResumeVersion documents
 *   - Seeded jobs (Senior AI/ML Engineer) and all applications for those jobs
 *   - All VectorCache, AnalyticsCache, and InterviewPlan documents
 *
 * Preserves:
 *   - General application schema collections (keeps them empty, ready for new seed/import)
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const path     = require('path');
const fs       = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User             = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');
const ResumeVersion    = require('../models/ResumeVersion');
const DatasetCandidate = require('../models/DatasetCandidate');
const Job              = require('../models/Job');
const Application      = require('../models/Application');
const VectorCache      = require('../models/VectorCache');
const AnalyticsCache   = require('../models/AnalyticsCache');
const InterviewPlan    = require('../models/InterviewPlan');

const SEED_STATE_PATH = path.resolve(__dirname, '.seed_state.json');

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║           AI-Recruiter — Reset Database              ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('❌  MONGO_URI is not set in backend/.env');
    process.exit(1);
  }

  console.log('🔌  Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected.\n');

  console.log('🗑️  Starting database cleanup...');

  // 1. Remove all DatasetCandidate records
  const dcDelete = await DatasetCandidate.deleteMany({});
  console.log(`   - Deleted ${dcDelete.deletedCount} DatasetCandidate records.`);

  // 2. Identify and delete dataset-derived users and seeded recruiter
  const userQuery = {
    $or: [
      { email: /@ai-recruiter\.org$/i },
      { email: /@airecruiter\.org$/i },
      { email: /@ai-recruiter\.dataset$/i },
      { email: 'talent@redrob.org' },
      { email: 'talent@redrob.dataset' }
    ]
  };
  
  const targetUsers = await User.find(userQuery, '_id').lean();
  const targetUserIds = targetUsers.map(u => u._id);

  const userDelete = await User.deleteMany({ _id: { $in: targetUserIds } });
  console.log(`   - Deleted ${userDelete.deletedCount} User records.`);

  // 3. Remove CandidateProfiles for those users
  const profileDelete = await CandidateProfile.deleteMany({ user: { $in: targetUserIds } });
  console.log(`   - Deleted ${profileDelete.deletedCount} CandidateProfile records.`);

  // 4. Remove ResumeVersions for those users
  const resumeDelete = await ResumeVersion.deleteMany({ candidate: { $in: targetUserIds } });
  console.log(`   - Deleted ${resumeDelete.deletedCount} ResumeVersion records.`);

  // 5. Remove seeded Jobs
  const jobQuery = {
    $or: [
      { title: 'Senior AI/ML Engineer' },
      { recruiter: { $in: targetUserIds } }
    ]
  };
  const targetJobs = await Job.find(jobQuery, '_id').lean();
  const targetJobIds = targetJobs.map(j => j._id);

  const jobDelete = await Job.deleteMany({ _id: { $in: targetJobIds } });
  console.log(`   - Deleted ${jobDelete.deletedCount} Job records.`);

  // 6. Remove Applications
  const appDelete = await Application.deleteMany({
    $or: [
      { job: { $in: targetJobIds } },
      { candidate: { $in: targetUserIds } }
    ]
  });
  console.log(`   - Deleted ${appDelete.deletedCount} Application records.`);

  // 7. Clear AI/temp Caches and Interview Plans
  const vectorCacheDelete = await VectorCache.deleteMany({});
  console.log(`   - Deleted ${vectorCacheDelete.deletedCount} VectorCache records.`);

  const analyticsCacheDelete = await AnalyticsCache.deleteMany({});
  console.log(`   - Deleted ${analyticsCacheDelete.deletedCount} AnalyticsCache records.`);

  const interviewPlanDelete = await InterviewPlan.deleteMany({});
  console.log(`   - Deleted ${interviewPlanDelete.deletedCount} InterviewPlan records.`);

  // 8. Clean up seed state file
  if (fs.existsSync(SEED_STATE_PATH)) {
    fs.unlinkSync(SEED_STATE_PATH);
    console.log('   - Removed .seed_state.json file.');
  }

  console.log('\n✨  Database has been reset to a clean state.');
  console.log('✅  Ready for clean seed or import.\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌  Fatal error during reset:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});

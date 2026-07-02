#!/usr/bin/env node
/**
 * importDataset.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Streams the Redrob hackathon JSONL dataset and upserts records into MongoDB.
 *
 * Modes
 *   Development  → First 500 candidates  (default)
 *   Production   → All ~50,000 candidates
 *
 * Switch via:
 *   node backend/scripts/importDataset.js --mode=prod
 *   IMPORT_MODE=prod node backend/scripts/importDataset.js
 *
 * Idempotency
 *   Uses candidate_id → derived email as the unique key.
 *   Re-running is safe: existing records are skipped (matched), not overwritten.
 *
 * Performance
 *   Streams JSONL line-by-line (handles 464 MB without OOM).
 *   Batches MongoDB writes using bulkWrite() in groups of BATCH_SIZE.
 *
 * Output
 *   Writes backend/scripts/import_report.json on completion.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const path      = require('path');
const fs        = require('fs');
const readline  = require('readline');
const mongoose  = require('mongoose');
const bcrypt    = require('bcryptjs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// ── Models ───────────────────────────────────────────────────────────────────
const User             = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');
const ResumeVersion    = require('../models/ResumeVersion');
const DatasetCandidate = require('../models/DatasetCandidate');

// ── Ranking service (signal boost only) ─────────────────────────────────────
const { calculateRedrobSignalBoost } = require('../services/ai/ranking.service');

// ── Configuration ─────────────────────────────────────────────────────────────
const BATCH_SIZE = 500;

const MODE = (
  process.argv.find(a => a.startsWith('--mode='))?.split('=')[1] ||
  process.env.IMPORT_MODE ||
  'dev'
).toLowerCase();

const IMPORT_LIMITS = { dev: 500, prod: Infinity };
const LIMIT = IMPORT_LIMITS[MODE] ?? 500;

const DATA_DIR  = path.resolve(__dirname, '../data/India_runs_data_and_ai_challenge');
const JSONL_FILE = path.join(DATA_DIR, 'candidates.jsonl');
const JSON_FILE  = path.join(DATA_DIR, 'sample_candidates.json');
const REPORT_PATH = path.resolve(__dirname, 'import_report.json');

// Default hashed password for all imported users
const DATASET_DEFAULT_PASSWORD = 'Dataset@AI-Recruiter2024';
let HASHED_PASSWORD;  // computed once before import loop

// ── Field Mappers ─────────────────────────────────────────────────────────────

/**
 * Map dataset proficiency values to existing schema enum values.
 */
function mapProficiency(raw) {
  const map = {
    beginner:     'Beginner',
    intermediate: 'Intermediate',
    advanced:     'Advanced',
    expert:       'Advanced'  // Mongoose enum only has Beginner/Intermediate/Advanced
  };
  return map[(raw || '').toLowerCase()] || 'Beginner';
}

/**
 * Map dataset work mode to existing CandidateProfile enum.
 */
function mapWorkMode(raw) {
  const map = {
    remote:   'Remote',
    hybrid:   'Hybrid',
    onsite:   'On-site',
    flexible: 'Any'
  };
  return map[(raw || '').toLowerCase()] || 'Any';
}

/**
 * Derive a deterministic, unique email from candidate_id.
 * Format: cand0000001@ai-recruiter.dataset
 */
function deriveEmail(candidateId) {
  return `${candidateId.toLowerCase().replace('_', '')}@ai-recruiter.org`;
}

/**
 * Synthesise a plain-text "resume" from structured dataset fields.
 * This text is stored in ResumeVersion.resumeText so the existing
 * Resume Parser and Semantic Matching services can process it.
 */
function synthesizeResumeText(candidate) {
  const p   = candidate.profile || {};
  const ch  = candidate.career_history || [];
  const edu = candidate.education || [];
  const sk  = candidate.skills || [];
  const cer = candidate.certifications || [];
  const lng = candidate.languages || [];

  const lines = [];

  // Header
  lines.push(p.anonymized_name || 'Candidate');
  lines.push(p.headline || '');
  lines.push(`Location: ${p.location || ''}, ${p.country || ''}`);
  lines.push('');

  // Summary
  if (p.summary) {
    lines.push('SUMMARY');
    lines.push(p.summary);
    lines.push('');
  }

  // Skills
  if (sk.length > 0) {
    lines.push('SKILLS');
    lines.push(sk.map(s => s.name).join(', '));
    lines.push('');
  }

  // Experience
  if (ch.length > 0) {
    lines.push('EXPERIENCE');
    for (const role of ch) {
      lines.push(`${role.title} at ${role.company}`);
      lines.push(`${role.start_date} – ${role.end_date || 'Present'} (${role.duration_months} months)`);
      lines.push(role.description || '');
      lines.push('');
    }
  }

  // Education
  if (edu.length > 0) {
    lines.push('EDUCATION');
    for (const e of edu) {
      lines.push(`${e.degree} in ${e.field_of_study} — ${e.institution}`);
      lines.push(`${e.start_year} – ${e.end_year}${e.grade ? ` | ${e.grade}` : ''}`);
      lines.push('');
    }
  }

  // Certifications
  if (cer.length > 0) {
    lines.push('CERTIFICATIONS');
    for (const c of cer) {
      lines.push(`${c.name} — ${c.issuer} (${c.year})`);
    }
    lines.push('');
  }

  // Languages
  if (lng.length > 0) {
    lines.push('LANGUAGES');
    lines.push(lng.map(l => `${l.language} (${l.proficiency})`).join(', '));
  }

  return lines.join('\n');
}

/**
 * Build the parsedResume object directly from structured data.
 * This bypasses the text-regex parser for imported candidates since
 * we already have structured data, giving the AI pipeline a clean input.
 */
function buildParsedResume(candidate) {
  const p   = candidate.profile || {};
  const ch  = candidate.career_history || [];
  const edu = candidate.education || [];
  const sk  = candidate.skills || [];
  const cer = candidate.certifications || [];

  // Separate technical vs soft skills — dataset doesn't distinguish,
  // so we classify by known soft skill patterns.
  const SOFT_KEYWORDS = ['communication', 'leadership', 'teamwork', 'management',
    'collaboration', 'problem solving', 'analytical', 'critical thinking',
    'presentation', 'negotiation', 'adaptability', 'organisation'];

  const technical = [];
  const soft      = [];

  for (const s of sk) {
    const lower = (s.name || '').toLowerCase();
    if (SOFT_KEYWORDS.some(kw => lower.includes(kw))) {
      soft.push(s.name);
    } else {
      technical.push(s.name);
    }
  }

  return {
    personalInfo: {
      name:     p.anonymized_name || '',
      email:    deriveEmail(candidate.candidate_id),
      phone:    '',
      location: `${p.location || ''}, ${p.country || ''}`
    },
    skills: { technical, soft },
    experience: ch.map(role => ({
      company:    role.company,
      position:   role.title,
      startDate:  role.start_date,
      endDate:    role.end_date || 'Present',
      description: role.description || ''
    })),
    education: edu.map(e => ({
      degree:         `${e.degree} in ${e.field_of_study}`,
      institution:    e.institution,
      graduationYear: String(e.end_year),
      cgpa:           e.grade || ''
    })),
    projects: [],  // Dataset has no project section
    certifications: (candidate.certifications || []).map(c => ({
      name:         c.name,
      organization: c.issuer
    })),
    links: { github: '', linkedin: '', portfolio: '', leetcode: '', hackerrank: '' },
    totalYearsExperience: p.years_of_experience || 0
  };
}

// ── Validator ─────────────────────────────────────────────────────────────────

const REQUIRED_FIELDS = ['candidate_id', 'profile', 'career_history', 'education', 'skills', 'redrob_signals'];

/**
 * Validate a raw parsed candidate object.
 * Returns { valid: bool, reason: string|null }.
 */
function validate(candidate) {
  for (const field of REQUIRED_FIELDS) {
    if (!candidate[field]) {
      return { valid: false, reason: `Missing required field: ${field}` };
    }
  }
  if (!/^CAND_[0-9]{7}$/.test(candidate.candidate_id)) {
    return { valid: false, reason: `Invalid candidate_id format: ${candidate.candidate_id}` };
  }
  if (!candidate.profile.anonymized_name) {
    return { valid: false, reason: 'Missing profile.anonymized_name' };
  }
  return { valid: true, reason: null };
}

// ── Document Builders ─────────────────────────────────────────────────────────

function buildUserDoc(candidate) {
  const email = deriveEmail(candidate.candidate_id);
  const p = candidate.profile;
  return {
    filter: { email },
    update: {
      $setOnInsert: {                       // Only set on first insert (idempotent)
        fullName: p.anonymized_name,
        email,
        password: HASHED_PASSWORD,
        role:     'Candidate',
        avatar:   ''
      }
    },
    upsert: true
  };
}

function buildCandidateProfileDoc(candidate, userId) {
  const p   = candidate.profile       || {};
  const ch  = candidate.career_history || [];
  const edu = candidate.education      || [];
  const sk  = candidate.skills         || [];
  const cer = candidate.certifications || [];
  const sig = candidate.redrob_signals || {};

  const technicalSkills = sk.map(s => ({
    name:              s.name,
    proficiency:       mapProficiency(s.proficiency),
    yearsOfExperience: Math.round((s.duration_months || 0) / 12)
  }));

  const experience = ch.map(role => ({
    company:         role.company,
    position:        role.title,
    startDate:       role.start_date ? new Date(role.start_date) : null,
    endDate:         role.end_date   ? new Date(role.end_date)   : null,
    currentlyWorking: !!role.is_current,
    description:     role.description || ''
  }));

  const education = edu.map(e => ({
    degree:         `${e.degree} in ${e.field_of_study}`,
    college:        e.institution,
    graduationYear: String(e.end_year || ''),
    cgpa:           e.grade || ''
  }));

  const certifications = cer.map(c => ({
    title:        c.name,
    organization: c.issuer,
    issueDate:    c.year ? new Date(`${c.year}-01-01`) : null
  }));

  const synthesisText = synthesizeResumeText(candidate);

  return {
    filter: { user: userId },
    update: {
      $set: {
        user:               userId,
        location:           p.location     ? `${p.location}, ${p.country || ''}` : (p.country || ''),
        professionalTitle:  p.current_title || '',
        yearsOfExperience:  p.years_of_experience || 0,
        currentCompany:     p.current_company     || '',
        currentRole:        p.current_title       || '',
        technicalSkills,
        softSkills:         [],   // Dataset doesn't distinguish; will be split at AI pipeline stage
        education,
        experience,
        certifications,
        projects:           [],
        links: {
          github:     '',
          linkedin:   sig.linkedin_connected ? 'https://linkedin.com' : '',
          portfolio:  '',
          leetcode:   '',
          hackerrank: ''
        },
        preferences: {
          remotePreference: mapWorkMode(sig.preferred_work_mode),
          expectedSalary:   sig.expected_salary_range_inr_lpa
            ? `${sig.expected_salary_range_inr_lpa.min}–${sig.expected_salary_range_inr_lpa.max} LPA`
            : '',
          preferredRoles:     [],
          preferredLocations: [],
          employmentType:     'Any'
        },
        resume: {
          uploaded:         true,
          parsed:           true,
          parsedText:       synthesisText,
          parserVersion:    'dataset-import-1.0.0',
          uploadedAt:       new Date()
        }
      }
    },
    upsert: true
  };
}

function buildResumeVersionDoc(candidate, userId, candidateProfileId) {
  const resumeText   = synthesizeResumeText(candidate);
  const parsedResume = buildParsedResume(candidate);

  return {
    filter: { candidate: userId, version: 1, originalFileName: `${candidate.candidate_id}_dataset.txt` },
    update: {
      $setOnInsert: {
        candidate:         userId,
        candidateProfile:  candidateProfileId,
        fileUrl:           `/dataset/${candidate.candidate_id}.txt`,
        originalFileName:  `${candidate.candidate_id}_dataset.txt`,
        fileType:          'pdf',       // Treated as parsed text — no actual file
        fileSizeBytes:     Buffer.byteLength(resumeText, 'utf8'),
        version:           1,
        resumeText,
        parsedResume,
        parsingStatus:     'Completed',
        parserVersion:     'dataset-import-1.0.0',
        parsedAt:          new Date(),
        aiReady:           true
      }
    },
    upsert: true
  };
}

function buildDatasetCandidateDoc(candidate, userId, candidateProfileId, resumeVersionId, signalBoostScore) {
  const p   = candidate.profile       || {};
  const sig = candidate.redrob_signals || {};

  // Sanitise signal values for Mongoose
  const cleanSignals = {
    profile_completeness_score:   sig.profile_completeness_score || 0,
    signup_date:                  sig.signup_date     ? new Date(sig.signup_date)      : null,
    last_active_date:             sig.last_active_date ? new Date(sig.last_active_date) : null,
    open_to_work_flag:            !!sig.open_to_work_flag,
    profile_views_received_30d:   sig.profile_views_received_30d   || 0,
    applications_submitted_30d:   sig.applications_submitted_30d   || 0,
    recruiter_response_rate:      sig.recruiter_response_rate      || 0,
    avg_response_time_hours:      sig.avg_response_time_hours      || 0,
    skill_assessment_scores:      sig.skill_assessment_scores      || {},
    connection_count:             sig.connection_count             || 0,
    endorsements_received:        sig.endorsements_received        || 0,
    notice_period_days:           sig.notice_period_days           || 0,
    expected_salary_range_inr_lpa: {
      min: sig.expected_salary_range_inr_lpa?.min || 0,
      max: sig.expected_salary_range_inr_lpa?.max || 0
    },
    preferred_work_mode:         sig.preferred_work_mode         || 'flexible',
    willing_to_relocate:         !!sig.willing_to_relocate,
    github_activity_score:       sig.github_activity_score ?? -1,
    search_appearance_30d:       sig.search_appearance_30d       || 0,
    saved_by_recruiters_30d:     sig.saved_by_recruiters_30d     || 0,
    interview_completion_rate:   sig.interview_completion_rate   || 0,
    offer_acceptance_rate:       sig.offer_acceptance_rate ?? -1,
    verified_email:              !!sig.verified_email,
    verified_phone:              !!sig.verified_phone,
    linkedin_connected:          !!sig.linkedin_connected
  };

  return {
    filter: { candidateId: candidate.candidate_id },
    update: {
      $set: {
        candidateId:        candidate.candidate_id,
        userId,
        candidateProfileId,
        resumeVersionId,
        redrobSignals:      cleanSignals,
        signalBoostScore,
        originalProfile: {
          headline:             p.headline             || '',
          summary:              p.summary              || '',
          country:              p.country              || '',
          current_industry:     p.current_industry     || '',
          current_company_size: p.current_company_size || ''
        },
        sourceFile:     'candidates.jsonl',
        datasetVersion: 'india_runs_v1',
        importMode:     MODE
      }
    },
    upsert: true
  };
}

// ── Batch Executor ────────────────────────────────────────────────────────────

/**
 * Execute four parallel bulkWrite operations for one batch of candidates.
 * Returns counts { upserted, matched } per collection.
 */
async function flushBatch(batch, report) {
  if (batch.length === 0) return;

  // Step 1: Upsert Users
  const userOps = batch.map(({ userDoc }) => ({
    updateOne: { filter: userDoc.filter, update: userDoc.update, upsert: userDoc.upsert }
  }));

  const userResult = await User.bulkWrite(userOps, { ordered: false });
  report.collections.users.upserted += userResult.upsertedCount;
  report.collections.users.matched  += userResult.matchedCount;

  // Step 2: Fetch created/existing user IDs in bulk
  const emails  = batch.map(({ userDoc }) => userDoc.filter.email);
  const users   = await User.find({ email: { $in: emails } }, '_id email').lean();
  const emailToId = {};
  users.forEach(u => { emailToId[u.email] = u._id; });

  // Step 3: Upsert CandidateProfiles (need userId)
  const profileOps = [];
  const profileMeta = [];   // store { email, userId } for resume + dataset upserts

  for (const item of batch) {
    const userId = emailToId[item.userDoc.filter.email];
    if (!userId) continue;
    const profileDoc = buildCandidateProfileDoc(item.candidate, userId);
    profileOps.push({
      updateOne: { filter: profileDoc.filter, update: profileDoc.update, upsert: true }
    });
    profileMeta.push({ email: item.userDoc.filter.email, userId, candidate: item.candidate });
  }

  const profileResult = await CandidateProfile.bulkWrite(profileOps, { ordered: false });
  report.collections.candidateProfiles.upserted += profileResult.upsertedCount;
  report.collections.candidateProfiles.matched  += profileResult.matchedCount;

  // Step 4: Fetch profile IDs
  const userIds  = profileMeta.map(m => m.userId);
  const profiles = await CandidateProfile.find({ user: { $in: userIds } }, '_id user').lean();
  const userToProfile = {};
  profiles.forEach(p => { userToProfile[String(p.user)] = p._id; });

  // Step 5: Upsert ResumeVersions
  const resumeOps  = [];
  const resumeMeta = [];

  for (const { userId, candidate } of profileMeta) {
    const candidateProfileId = userToProfile[String(userId)];
    if (!candidateProfileId) continue;
    const resumeDoc = buildResumeVersionDoc(candidate, userId, candidateProfileId);
    resumeOps.push({
      updateOne: { filter: resumeDoc.filter, update: resumeDoc.update, upsert: true }
    });
    resumeMeta.push({ userId, candidateProfileId, candidate });
  }

  const resumeResult = await ResumeVersion.bulkWrite(resumeOps, { ordered: false });
  report.collections.resumeVersions.upserted += resumeResult.upsertedCount;
  report.collections.resumeVersions.matched  += resumeResult.matchedCount;

  // Step 6: Fetch ResumeVersion IDs
  const resumeFilters = resumeMeta.map(m => m.candidate.candidate_id).map(id =>
    `${id.toLowerCase().replace('_', '')}_dataset.txt`
  );
  const resumes = await ResumeVersion.find(
    { originalFileName: { $in: resumeFilters } }, '_id originalFileName'
  ).lean();
  const fileToResumeId = {};
  resumes.forEach(r => { fileToResumeId[r.originalFileName] = r._id; });

  // Step 7: Upsert DatasetCandidates
  const datasetOps = [];

  for (const { userId, candidateProfileId, candidate } of resumeMeta) {
    const fname         = `${candidate.candidate_id.toLowerCase().replace('_', '')}_dataset.txt`;
    const resumeVersionId = fileToResumeId[fname];
    const signalBoostScore = calculateRedrobSignalBoost(candidate.redrob_signals);
    const dcDoc = buildDatasetCandidateDoc(candidate, userId, candidateProfileId, resumeVersionId, signalBoostScore);
    datasetOps.push({
      updateOne: { filter: dcDoc.filter, update: dcDoc.update, upsert: true }
    });
  }

  if (datasetOps.length > 0) {
    const dcResult = await DatasetCandidate.bulkWrite(datasetOps, { ordered: false });
    report.collections.datasetCandidates.upserted += dcResult.upsertedCount;
    report.collections.datasetCandidates.matched  += dcResult.matchedCount;
  }
}

// ── JSONL Streamer ────────────────────────────────────────────────────────────

async function streamJSONL(filePath, report) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let lineBuffer = [];
    let lineNum    = 0;
    let processed  = 0;
    let done       = false;

    const processBatch = async () => {
      if (lineBuffer.length === 0) return;
      const batch = lineBuffer.splice(0, lineBuffer.length);
      try {
        await flushBatch(batch, report);
      } catch (err) {
        console.error(`[BATCH ERROR] batch starting at line ~${lineNum}:`, err.message);
        report.summary.validationErrors += batch.length;
        report.inconsistencies.push({ type: 'batch_error', message: err.message });
      }
    };

    rl.on('line', async (line) => {
      if (done) return;
      lineNum++;

      const trimmed = line.trim();
      if (!trimmed) return;

      let candidate;
      try {
        candidate = JSON.parse(trimmed);
      } catch (e) {
        report.summary.validationErrors++;
        report.inconsistencies.push({ line: lineNum, type: 'json_parse_error', message: e.message });
        return;
      }

      const { valid, reason } = validate(candidate);
      if (!valid) {
        report.summary.validationErrors++;
        report.inconsistencies.push({
          candidateId: candidate.candidate_id || `line_${lineNum}`,
          type: 'validation_error',
          reason
        });
        return;
      }

      // Track field coverage
      if (!candidate.profile.location)     report.fieldAnalysis.missingLocation++;
      if (!candidate.skills?.length)       report.fieldAnalysis.missingSkills++;
      if (!candidate.career_history?.length) report.fieldAnalysis.missingCareerHistory++;
      if (!candidate.certifications?.length) report.fieldAnalysis.missingCertifications++;

      lineBuffer.push({ candidate, userDoc: buildUserDoc(candidate) });
      processed++;
      report.summary.totalRecords++;

      // Limit for dev mode
      if (processed >= LIMIT) {
        done = true;
        rl.close();
        return;
      }

      // Flush batch
      if (lineBuffer.length >= BATCH_SIZE) {
        rl.pause();
        await processBatch();
        rl.resume();
      }
    });

    rl.on('close', async () => {
      try {
        await processBatch();   // flush remaining
        resolve();
      } catch (err) {
        reject(err);
      }
    });

    rl.on('error', reject);
    fileStream.on('error', reject);
  });
}

// ── JSON Array Reader (fallback for sample_candidates.json) ──────────────────

async function importJSONArray(filePath, report) {
  const raw  = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);
  const slice = data.slice(0, LIMIT);

  for (let i = 0; i < slice.length; i += BATCH_SIZE) {
    const batch = slice.slice(i, i + BATCH_SIZE);
    const items = [];

    for (const candidate of batch) {
      const { valid, reason } = validate(candidate);
      if (!valid) {
        report.summary.validationErrors++;
        report.inconsistencies.push({ candidateId: candidate.candidate_id, type: 'validation_error', reason });
        continue;
      }
      if (!candidate.profile.location)       report.fieldAnalysis.missingLocation++;
      if (!candidate.skills?.length)         report.fieldAnalysis.missingSkills++;
      if (!candidate.career_history?.length) report.fieldAnalysis.missingCareerHistory++;
      if (!candidate.certifications?.length) report.fieldAnalysis.missingCertifications++;

      items.push({ candidate, userDoc: buildUserDoc(candidate) });
      report.summary.totalRecords++;
    }

    await flushBatch(items, report);
    process.stdout.write(`\r  Processed ${Math.min((i + BATCH_SIZE), slice.length)}/${slice.length} records...`);
  }
  console.log('');
}

// ── Report Writer ─────────────────────────────────────────────────────────────

function writeReport(report) {
  report.summary.imported =
    report.collections.users.upserted +
    report.collections.users.matched;
  report.summary.duplicatesSkipped =
    report.collections.users.matched;

  const reportStr = JSON.stringify(report, null, 2);
  fs.writeFileSync(REPORT_PATH, reportStr, 'utf8');
  console.log(`\n📄 Import report saved → ${REPORT_PATH}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  const startMem  = process.memoryUsage();

  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║        AI-Recruiter — Dataset Import Script              ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`  Mode  : ${MODE.toUpperCase()} (limit: ${LIMIT === Infinity ? 'ALL records' : LIMIT + ' records'})`);
  console.log(`  DB    : ${process.env.MONGO_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'not set'}`);
  console.log('');

  // Connect to MongoDB
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('❌  MONGO_URI is not set in backend/.env');
    process.exit(1);
  }

  console.log('🔌  Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected.\n');

  // Pre-hash the default password once
  HASHED_PASSWORD = await bcrypt.hash(DATASET_DEFAULT_PASSWORD, 10);

  // Build report skeleton
  const report = {
    generatedAt:     new Date().toISOString(),
    mode:            MODE,
    limit:           LIMIT === Infinity ? 'ALL' : LIMIT,
    datasetPath:     DATA_DIR,
    filesProcessed:  [],
    summary: {
      totalRecords:      0,
      imported:          0,
      duplicatesSkipped: 0,
      validationErrors:  0
    },
    collections: {
      users:              { upserted: 0, matched: 0 },
      candidateProfiles:  { upserted: 0, matched: 0 },
      resumeVersions:     { upserted: 0, matched: 0 },
      datasetCandidates:  { upserted: 0, matched: 0 }
    },
    fieldAnalysis: {
      missingLocation:      0,
      missingSkills:        0,
      missingCareerHistory: 0,
      missingCertifications:0
    },
    inconsistencies:    [],
    processingTimeMs:   0,
    memoryUsageMB:      {}
  };

  // Auto-detect source file
  const sourceFile = fs.existsSync(JSONL_FILE) ? JSONL_FILE : JSON_FILE;
  const isJSONL    = sourceFile.endsWith('.jsonl');

  console.log(`📂  Source file: ${path.basename(sourceFile)} (${(fs.statSync(sourceFile).size / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`📦  Batch size : ${BATCH_SIZE} records`);
  console.log('');

  report.filesProcessed.push({
    file:   path.basename(sourceFile),
    format: isJSONL ? 'JSONL' : 'JSON',
    sizeMB: (fs.statSync(sourceFile).size / 1024 / 1024).toFixed(2)
  });

  // Progress display for JSONL
  let progressInterval;
  if (isJSONL) {
    let dots = 0;
    progressInterval = setInterval(() => {
      dots = (dots + 1) % 4;
      const processed = report.summary.totalRecords;
      process.stdout.write(`\r  Streaming${'.'.repeat(dots).padEnd(3)} ${processed} records processed`);
    }, 500);
  }

  // ── Run Import ──────────────────────────────────────────────────────────────
  try {
    if (isJSONL) {
      await streamJSONL(sourceFile, report);
    } else {
      await importJSONArray(sourceFile, report);
    }
  } finally {
    if (progressInterval) clearInterval(progressInterval);
  }

  // ── Finalise ────────────────────────────────────────────────────────────────
  const endTime = Date.now();
  const endMem  = process.memoryUsage();

  report.processingTimeMs = endTime - startTime;
  report.memoryUsageMB = {
    rssStart:    (startMem.rss   / 1024 / 1024).toFixed(1),
    rssEnd:      (endMem.rss     / 1024 / 1024).toFixed(1),
    heapUsedEnd: (endMem.heapUsed / 1024 / 1024).toFixed(1)
  };
  report.filesProcessed[0].recordsProcessed = report.summary.totalRecords;

  writeReport(report);

  // ── Print Summary ───────────────────────────────────────────────────────────
  const dur = (report.processingTimeMs / 1000).toFixed(1);
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║                  Import Summary                      ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Total records processed  : ${String(report.summary.totalRecords).padEnd(24)}║`);
  console.log(`║  Users upserted (new)     : ${String(report.collections.users.upserted).padEnd(24)}║`);
  console.log(`║  Users matched (skipped)  : ${String(report.collections.users.matched).padEnd(24)}║`);
  console.log(`║  Candidate profiles       : ${String(report.collections.candidateProfiles.upserted).padEnd(24)}║`);
  console.log(`║  Resume versions          : ${String(report.collections.resumeVersions.upserted).padEnd(24)}║`);
  console.log(`║  Dataset candidates       : ${String(report.collections.datasetCandidates.upserted).padEnd(24)}║`);
  console.log(`║  Validation errors        : ${String(report.summary.validationErrors).padEnd(24)}║`);
  console.log(`║  Processing time          : ${String(dur + 's').padEnd(24)}║`);
  console.log(`║  Memory (heap end)        : ${String(report.memoryUsageMB.heapUsedEnd + ' MB').padEnd(24)}║`);
  console.log('╚══════════════════════════════════════════════════════╝');

  if (report.inconsistencies.length > 0) {
    console.log(`\n⚠️  ${report.inconsistencies.length} inconsistencies logged in import_report.json`);
  }

  console.log('\n✅  Import complete.\n');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌  Fatal error:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});

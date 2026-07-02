#!/usr/bin/env node
/**
 * exportRankedCandidates.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates the final hackathon submission Excel file:
 *   recommended_candidates.xlsx
 *
 * Strategy (in priority order):
 *   1. If an Application exists with ranking.status=Completed → live pipeline data.
 *   2. If DatasetCandidate + CandidateProfile exists in DB → compute via formula.
 *   3. If candidate is found in the raw JSONL → compute from raw data + Redrob signals.
 *   4. Fallback to CSV score only.
 *
 * Output columns (match sample_submission.csv + hackathon spec):
 *   rank | candidate_id | candidate_name | overall_score | semantic_score
 *   | recommendation | reasoning
 *
 * Saves: e:\AI-Recruitment-System\recommended_candidates.xlsx
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const path     = require('path');
const fs       = require('fs');
const readline = require('readline');
const mongoose = require('mongoose');
const ExcelJS  = require('exceljs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// ── Model imports ────────────────────────────────────────────────────────────
require('../models/User');
require('../models/CandidateProfile');
require('../models/ResumeVersion');
const Application      = require('../models/Application');
const DatasetCandidate = require('../models/DatasetCandidate');
const CandidateProfile = require('../models/CandidateProfile');
const Job              = require('../models/Job');

const SEED_STATE_PATH = path.resolve(__dirname, '.seed_state.json');
const CSV_PATH        = path.resolve(__dirname, '../data/India_runs_data_and_ai_challenge/sample_submission.csv');
const JSONL_PATH      = path.resolve(__dirname, '../data/India_runs_data_and_ai_challenge/candidates.jsonl');
const OUTPUT_PATH     = path.resolve(__dirname, '../../recommended_candidates.xlsx');

// ── Ranking weights (mirrors ranking.config.js) ───────────────────────────────
const WEIGHTS = {
  semanticMatch:       0.40,
  experience:          0.20,
  projects:            0.15,
  certifications:      0.10,
  education:           0.05,
  profileCompleteness: 0.05,
  platformActivity:    0.05,
};

function calcExperienceScore(profile, jobRequiredExp) {
  if (!profile.experience || profile.experience.length === 0) return 0;
  let score = 40;
  const yrs = profile.yearsOfExperience || 0;
  score += Math.min(40, yrs * 10);
  if (profile.experience.some(e => e.currentlyWorking || e.is_current)) score += 10;
  const reqYrs = parseInt(jobRequiredExp) || 0;
  if (yrs >= reqYrs) score += 10;
  return Math.min(100, score);
}

function calcProjectScore(profile) {
  if (!profile.projects || profile.projects.length === 0) return 0;
  let score = 0;
  score += Math.min(60, profile.projects.length * 15);
  score += Math.min(20, (profile.projects.filter(p => p.featured).length) * 10);
  score += Math.min(20, (profile.projects.filter(p => p.githubUrl).length) * 5);
  return Math.min(100, score);
}

function calcEducationScore(profile) {
  if (!profile.education || profile.education.length === 0) return 0;
  let score = 50;
  if (profile.education.some(e => (e.degree||'').toLowerCase().includes('bachelor') || (e.degree||'').toLowerCase().includes('b.'))) score += 20;
  if (profile.education.some(e => (e.degree||'').toLowerCase().includes('master') || (e.degree||'').toLowerCase().includes('m.'))) score += 20;
  if (profile.education.some(e => (e.degree||'').toLowerCase().includes('phd') || (e.degree||'').toLowerCase().includes('doctorate'))) score += 30;
  if (profile.education.some(e => e.cgpa || e.grade)) score += 10;
  return Math.min(100, score);
}

function calcCertificationScore(profile) {
  if (!profile.certifications || profile.certifications.length === 0) return 0;
  return Math.min(100, profile.certifications.length * 25);
}

function calcSignalBoost(redrobSignals) {
  if (!redrobSignals) return 0;
  let score = 0;
  score += (redrobSignals.profile_completeness_score || 0) * 0.25;
  score += (redrobSignals.recruiter_response_rate    || 0) * 100 * 0.20;
  const githubScore = (redrobSignals.github_activity_score > 0) ? redrobSignals.github_activity_score : 0;
  score += githubScore * 0.20;
  score += (redrobSignals.interview_completion_rate  || 0) * 100 * 0.20;
  const offerRate = (redrobSignals.offer_acceptance_rate >= 0) ? redrobSignals.offer_acceptance_rate : 0.50;
  score += offerRate * 100 * 0.15;
  if (redrobSignals.verified_email)     score += 2;
  if (redrobSignals.verified_phone)     score += 2;
  if (redrobSignals.linkedin_connected) score += 3;
  if (redrobSignals.open_to_work_flag)  score += 3;
  return Math.min(100, Math.round(score));
}

function calcProfileScore(profile) {
  let score = 0;
  if (profile.phone || profile.location) score += 10;
  if (profile.location)           score += 10;
  if (profile.professionalTitle || profile.headline) score += 10;
  if (profile.resume?.uploaded)   score += 20;
  const techSkillsLen = profile.technicalSkills?.length || profile.skills?.length || 0;
  const softSkillsLen = profile.softSkills?.length || 0;
  if (techSkillsLen > 0) score += 25;
  if (softSkillsLen > 0 || techSkillsLen > 5) score += 25;
  return Math.min(100, score);
}

function deriveSemanticScore(techSkills, experience, education, projects, certifications, yearsExp, jobRequiredExp, jobSkills) {
  const candSkillsLower = techSkills.map(s => (s.name || s).toLowerCase());
  const matchCount      = jobSkills.filter(s => candSkillsLower.includes(s)).length;
  const skillMatchRatio = jobSkills.length > 0 ? matchCount / jobSkills.length : 0.5;
  const technicalSkillScore = Math.round(skillMatchRatio * 100);

  const jobExpReq       = parseInt(jobRequiredExp) || 2;
  const experienceScore = Math.min(100, Math.round((yearsExp / jobExpReq) * 100));
  const educationScore  = education.length > 0 ? 85 : 50;
  const projectScore    = projects.length  > 0 ? 80 : 40;
  const softSkillScore  = 75;
  const certScore       = certifications.length > 0 ? 85 : 50;

  return Math.round(
    (technicalSkillScore * 0.40) +
    (experienceScore     * 0.20) +
    (projectScore        * 0.15) +
    (educationScore      * 0.10) +
    (softSkillScore      * 0.10) +
    (certScore           * 0.05)
  );
}

function deriveRecommendation(overallScore) {
  if (overallScore >= 85) return 'Strong Hire';
  if (overallScore >= 70) return 'Hire';
  if (overallScore >= 50) return 'Consider';
  return 'Not Recommended';
}

function buildReasoning(title, yrs, semanticScore, signalBoost, techSkillsLen, missingCount, certCount) {
  const parts = [];
  parts.push(`${title} with ${yrs} yrs experience.`);
  parts.push(`AI semantic match: ${semanticScore}/100.`);
  if (signalBoost > 0) parts.push(`Redrob platform signal: ${signalBoost}/100.`);
  if (techSkillsLen > 0) parts.push(`${techSkillsLen} technical skill(s) on profile.`);
  if (missingCount > 0)  parts.push(`${missingCount} required skill(s) not found.`);
  if (certCount > 0)     parts.push(`${certCount} certification(s).`);
  return parts.join(' ');
}

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCSV(content) {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = [];
    let current = '', inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    values.push(current.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
}

// ── JSONL loader — streams the large file, only keeps requested IDs ───────────
async function loadJSONLCandidates(neededIds) {
  const map = new Map();
  if (!fs.existsSync(JSONL_PATH)) return map;

  const needed = new Set(neededIds);
  const rl     = readline.createInterface({ input: fs.createReadStream(JSONL_PATH, 'utf8'), crlfDelay: Infinity });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const rec = JSON.parse(line);
      if (needed.has(rec.candidate_id)) {
        map.set(rec.candidate_id, rec);
        needed.delete(rec.candidate_id);
        if (needed.size === 0) break;  // found everything we need
      }
    } catch (_) {}
  }
  return map;
}

// ── Excel colour helpers ──────────────────────────────────────────────────────
function recommendationColor(rec) {
  switch (rec) {
    case 'Strong Hire':     return { argb: 'FF2EA043' };
    case 'Hire':            return { argb: 'FF56D364' };
    case 'Consider':        return { argb: 'FFD29922' };
    case 'Not Recommended': return { argb: 'FFF85149' };
    default:                return { argb: 'FF8B949E' };
  }
}

function scoreColor(score) {
  if (score >= 80) return { argb: 'FF56D364' };
  if (score >= 65) return { argb: 'FF2EA043' };
  if (score >= 50) return { argb: 'FFD29922' };
  return { argb: 'FFF85149' };
}

const DARK_BG   = { argb: 'FF0D1117' };
const MID_BG    = { argb: 'FF161B22' };
const HDR_BG    = { argb: 'FF1F6FEB' };
const HDR_TEXT  = { argb: 'FFFFFFFF' };
const MUTED     = { argb: 'FF8B949E' };
const PRIMARY   = { argb: 'FFF0F6FC' };
const BLUE_MONO = { argb: 'FF79C0FF' };

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║      AI-Recruiter — Hackathon Export: Ranked Candidates  ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  if (!process.env.MONGO_URI) { console.error('❌ MONGO_URI not set'); process.exit(1); }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // ── Job ───────────────────────────────────────────────────────────────────
  const state = JSON.parse(fs.readFileSync(SEED_STATE_PATH, 'utf8'));
  const job   = await Job.findById(state.jobId);
  if (!job) { console.error('❌ Seeded job not found'); process.exit(1); }
  console.log(`📋 Job: "${job.title}" (ID: ${state.jobId})`);

  const jobSkills = (job.aiAnalysis?.normalizedData?.requiredSkills || []).map(s => s.toLowerCase());
  const jobExp    = job.requiredExperience || '3';
  console.log(`   Required Skills: [${jobSkills.join(', ')}]`);

  // ── CSV (authoritative rank order) ───────────────────────────────────────
  const csvRows = parseCSV(fs.readFileSync(CSV_PATH, 'utf8'));
  console.log(`📄 CSV rows: ${csvRows.length}`);

  // ── DB data ───────────────────────────────────────────────────────────────
  const applications = await Application.find({ job: state.jobId })
    .populate('candidate', 'fullName email');
  const appByUser = new Map(applications.map(a => [String(a.candidate._id), a]));

  const allDC = await DatasetCandidate.find({})
    .populate('userId', 'fullName email')
    .populate('candidateProfileId');
  const dcMap = new Map(allDC.map(dc => [dc.candidateId, dc]));
  console.log(`📂 Applications in DB: ${applications.length}  |  DatasetCandidates: ${allDC.length}`);

  // ── Load raw JSONL for candidates not in DB ───────────────────────────────
  const notInDB = csvRows
    .map(r => r.candidate_id)
    .filter(id => !dcMap.has(id));

  console.log(`📦 Loading ${notInDB.length} candidates from raw JSONL…`);
  const jsonlMap = await loadJSONLCandidates(notInDB);
  console.log(`   Found ${jsonlMap.size}/${notInDB.length} in JSONL`);

  // ── Process each CSV row ──────────────────────────────────────────────────
  const rows = [];
  let usedLivePipeline = 0, usedDB = 0, usedJSONL = 0, usedCSVFallback = 0;

  for (const csvRow of csvRows) {
    const candidateId = csvRow.candidate_id;
    const dc          = dcMap.get(candidateId);
    const profile     = dc?.candidateProfileId;
    const userObj     = dc?.userId;
    const signalBoost = dc?.signalBoostScore || 0;
    const app         = userObj ? appByUser.get(String(userObj._id)) : null;

    let overallScore, semanticScore, recommendation, reasoning;
    let candidateName = candidateId;
    let yearsExp = 0, techSkillsLen = 0, certsLen = 0, eduLen = 0, projLen = 0;

    // ── PATH 1: Live AI Pipeline from DB ───────────────────────────────────
    if (app?.ranking?.status === 'Completed' && app.ranking?.overallScore != null) {
      overallScore   = app.ranking.overallScore;
      semanticScore  = app.ranking.semanticScore || app.ai?.semanticScore || 0;
      recommendation = app.ranking.recommendation || deriveRecommendation(overallScore);
      reasoning      = app.ranking.scoreExplanation || csvRow.reasoning || '';
      candidateName  = userObj?.fullName || candidateId;
      yearsExp       = profile?.yearsOfExperience || 0;
      techSkillsLen  = (profile?.technicalSkills || []).length;
      certsLen       = (profile?.certifications  || []).length;
      eduLen         = (profile?.education       || []).length;
      projLen        = (profile?.projects        || []).length;
      usedLivePipeline++;

    // ── PATH 2: DB Profile (formula) ────────────────────────────────────────
    } else if (profile) {
      candidateName = userObj?.fullName || candidateId;
      yearsExp      = profile.yearsOfExperience || 0;
      techSkillsLen = (profile.technicalSkills || []).length;
      certsLen      = (profile.certifications  || []).length;
      eduLen        = (profile.education       || []).length;
      projLen       = (profile.projects        || []).length;

      const techSkills = profile.technicalSkills || [];
      semanticScore = deriveSemanticScore(
        techSkills, profile.experience || [], profile.education || [],
        profile.projects || [], profile.certifications || [],
        yearsExp, jobExp, jobSkills
      );

      const expScore  = calcExperienceScore(profile, jobExp);
      const projScore = calcProjectScore(profile);
      const eduScore  = calcEducationScore(profile);
      const certScore = calcCertificationScore(profile);
      const profScore = calcProfileScore(profile);
      const platScore = signalBoost;

      overallScore = Math.round(
        (semanticScore * WEIGHTS.semanticMatch) +
        (expScore      * WEIGHTS.experience) +
        (projScore     * WEIGHTS.projects) +
        (certScore     * WEIGHTS.certifications) +
        (eduScore      * WEIGHTS.education) +
        (profScore     * WEIGHTS.profileCompleteness) +
        (platScore     * WEIGHTS.platformActivity)
      );
      recommendation = deriveRecommendation(overallScore);

      const candSkillsLower = techSkills.map(s => (s.name||s).toLowerCase());
      const missingSkillsCount = jobSkills.filter(s => !candSkillsLower.includes(s)).length;
      reasoning = buildReasoning(
        profile.professionalTitle || 'Professional',
        yearsExp, semanticScore, signalBoost, techSkillsLen, missingSkillsCount, certsLen
      );
      usedDB++;

    // ── PATH 3: Raw JSONL data ───────────────────────────────────────────────
    } else if (jsonlMap.has(candidateId)) {
      const raw         = jsonlMap.get(candidateId);
      const rawProfile  = raw.profile || {};
      const rawSignals  = raw.redrob_signals || {};
      const rawSkills   = raw.skills || [];
      const rawCerts    = raw.certifications || [];
      const rawEdu      = raw.education || [];
      const rawCareer   = raw.career_history || [];

      candidateName = rawProfile.anonymized_name || rawProfile.headline?.split('|')[0]?.trim() || candidateId;
      yearsExp      = rawProfile.years_of_experience || 0;
      techSkillsLen = rawSkills.length;
      certsLen      = rawCerts.length;
      eduLen        = rawEdu.length;
      projLen       = 0;  // JSONL doesn't have a projects array

      const signalBoostRaw = calcSignalBoost(rawSignals);

      // Skill match
      const candSkillsLower = rawSkills.map(s => (s.name || s).toLowerCase());
      const matchCount      = jobSkills.filter(s => candSkillsLower.includes(s)).length;
      const missingCount    = jobSkills.length - matchCount;
      const skillRatio      = jobSkills.length > 0 ? matchCount / jobSkills.length : 0.5;

      const techScore  = Math.round(skillRatio * 100);
      const expRatio   = Math.min(100, Math.round((yearsExp / (parseInt(jobExp) || 2)) * 100));
      const projScore2 = rawCareer.length > 0 ? 75 : 40;  // Use career history as proxy
      const eduScore2  = rawEdu.length > 0 ? 85 : 50;
      const softScore  = 75;
      const certScore2 = rawCerts.length > 0 ? 85 : 50;

      semanticScore = Math.round(
        (techScore   * 0.40) + (expRatio  * 0.20) + (projScore2 * 0.15) +
        (eduScore2   * 0.10) + (softScore * 0.10) + (certScore2 * 0.05)
      );

      // Experience score for overall
      const expScoreFull = rawCareer.length > 0
        ? Math.min(100, 40 + Math.min(40, yearsExp * 10) + (rawCareer.some(c => c.is_current) ? 10 : 0) + (yearsExp >= parseInt(jobExp) ? 10 : 0))
        : 0;

      // Profile completeness
      const profScore = 50
        + (rawProfile.location ? 10 : 0)
        + (rawProfile.headline ? 10 : 0)
        + (rawSkills.length > 0 ? 25 : 0)
        + (rawProfile.summary  ? 5  : 0);

      overallScore = Math.round(
        (semanticScore   * WEIGHTS.semanticMatch) +
        (expScoreFull    * WEIGHTS.experience) +
        (projScore2      * WEIGHTS.projects) +
        (certScore2      * WEIGHTS.certifications) +
        (eduScore2       * WEIGHTS.education) +
        (Math.min(100, profScore) * WEIGHTS.profileCompleteness) +
        (signalBoostRaw  * WEIGHTS.platformActivity)
      );

      recommendation = deriveRecommendation(overallScore);
      reasoning = buildReasoning(
        rawProfile.current_title || 'Professional',
        yearsExp, semanticScore, signalBoostRaw, techSkillsLen, missingCount, certsLen
      );
      usedJSONL++;

    // ── PATH 4: CSV-only fallback ────────────────────────────────────────────
    } else {
      const csvScore = parseFloat(csvRow.score) || 0;
      overallScore   = Math.round(csvScore * 100);
      semanticScore  = overallScore;
      recommendation = deriveRecommendation(overallScore);
      reasoning      = csvRow.reasoning || 'Score from hackathon dataset.';
      usedCSVFallback++;
    }

    rows.push({
      rank:            parseInt(csvRow.rank) || rows.length + 1,
      candidate_id:    candidateId,
      candidate_name:  candidateName,
      overall_score:   Math.max(0, Math.min(100, overallScore)),
      semantic_score:  Math.max(0, Math.min(100, semanticScore)),
      signal_boost:    signalBoost,
      recommendation,
      reasoning,
      csv_score:       parseFloat(csvRow.score) || 0,
      // Breakdown
      years_exp:       yearsExp,
      technical_skills: techSkillsLen,
      certifications:   certsLen,
      education_count:  eduLen,
      projects_count:   projLen,
    });
  }

  // Re-sort by overall_score DESC (tie-break: semantic_score, then original rank)
  rows.sort((a, b) =>
    b.overall_score - a.overall_score ||
    b.semantic_score - a.semantic_score ||
    a.rank - b.rank
  );
  rows.forEach((r, i) => { r.rank = i + 1; });

  console.log(`\n📊 Data source breakdown:`);
  console.log(`   Live AI Pipeline : ${usedLivePipeline}`);
  console.log(`   DB Formula       : ${usedDB}`);
  console.log(`   Raw JSONL        : ${usedJSONL}`);
  console.log(`   CSV Fallback     : ${usedCSVFallback}`);
  console.log(`   Total            : ${rows.length}\n`);

  // ── Build Workbook ────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator  = 'AI-Recruiter Hackathon System v1.0.0';
  wb.created  = new Date();
  wb.modified = new Date();

  // ── SHEET 1: Recommended Candidates ──────────────────────────────────────
  const ws = wb.addWorksheet('Recommended Candidates', {
    pageSetup: { fitToPage: true, orientation: 'landscape', paperSize: 9 },
    views: [{ state: 'frozen', ySplit: 3 }],
  });

  // Banner title
  ws.mergeCells('A1:H1');
  Object.assign(ws.getCell('A1'), {
    value:     '🏆  AI-Recruiter  ·  Hackathon Candidate Rankings',
    font:      { name: 'Calibri', bold: true, size: 16, color: HDR_TEXT },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: DARK_BG },
    alignment: { horizontal: 'center', vertical: 'middle' },
  });
  ws.getRow(1).height = 34;

  // Sub-title
  ws.mergeCells('A2:H2');
  Object.assign(ws.getCell('A2'), {
    value:     `Job: ${job.title}   ·   Generated: ${new Date().toLocaleString('en-IN')}   ·   Candidates: ${rows.length}`,
    font:      { name: 'Calibri', size: 10, italic: true, color: MUTED },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: MID_BG },
    alignment: { horizontal: 'center', vertical: 'middle' },
  });
  ws.getRow(2).height = 20;

  const COL_DEFS = [
    { key: 'rank',           header: 'Rank',                   width: 7   },
    { key: 'candidate_id',   header: 'Candidate ID',            width: 16  },
    { key: 'candidate_name', header: 'Candidate Name',          width: 26  },
    { key: 'overall_score',  header: 'Overall Score',           width: 14  },
    { key: 'semantic_score', header: 'Semantic Score',          width: 14  },
    { key: 'recommendation', header: 'Recommendation',          width: 18  },
    { key: 'reasoning',      header: 'Reasoning/Explanation',   width: 65  },
  ];

  ws.columns = COL_DEFS;

  // Header row
  const hdr = ws.getRow(3);
  hdr.values = COL_DEFS.map(c => c.header);
  hdr.height = 20;
  hdr.eachCell(cell => {
    cell.font      = { name: 'Calibri', bold: true, size: 11, color: HDR_TEXT };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: HDR_BG };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border    = { bottom: { style: 'medium', color: { argb: 'FF58A6FF' } } };
  });

  // Data rows
  for (let i = 0; i < rows.length; i++) {
    const r   = rows[i];
    const row = ws.getRow(i + 4);
    row.height = 18;
    const bg  = i % 2 === 0 ? DARK_BG : MID_BG;

    row.values = [r.rank, r.candidate_id, r.candidate_name, r.overall_score,
                  r.semantic_score, r.recommendation, r.reasoning];

    row.eachCell((cell, col) => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: bg };
      cell.alignment = { vertical: 'middle' };

      switch (col) {
        case 1:  // Rank
          cell.font      = { name: 'Calibri', bold: true, size: 12,
            color: r.rank === 1 ? { argb: 'FFFFD700' } : r.rank === 2 ? { argb: 'FFC0C0C0' } : r.rank === 3 ? { argb: 'FFCD7F32' } : PRIMARY };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          break;
        case 2:  // Candidate ID
          cell.font      = { name: 'Courier New', size: 10, color: BLUE_MONO };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          break;
        case 3:  // Name
          cell.font      = { name: 'Calibri', bold: true, size: 11, color: PRIMARY };
          break;
        case 4:  // Overall Score
          cell.font      = { name: 'Calibri', bold: true, size: 12, color: scoreColor(r.overall_score) };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.numFmt    = '0"%"';
          break;
        case 5:  // Semantic Score
          cell.font      = { name: 'Calibri', size: 11, color: scoreColor(r.semantic_score) };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.numFmt    = '0"%"';
          break;
        case 6:  // Recommendation
          cell.font      = { name: 'Calibri', bold: true, size: 10, color: recommendationColor(r.recommendation) };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          break;
        case 7:  // Reasoning
          cell.font      = { name: 'Calibri', size: 10, color: MUTED };
          cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: false };
          break;
      }
    });
  }

  ws.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: 7 } };

  // ── SHEET 2: Score Breakdown ──────────────────────────────────────────────
  const ws2 = wb.addWorksheet('Score Breakdown', {
    views: [{ state: 'frozen', ySplit: 2 }],
  });

  ws2.mergeCells('A1:J1');
  Object.assign(ws2.getCell('A1'), {
    value:     'Candidate Score Breakdown — Component Analysis',
    font:      { name: 'Calibri', bold: true, size: 13, color: PRIMARY },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: MID_BG },
    alignment: { horizontal: 'center', vertical: 'middle' },
  });
  ws2.getRow(1).height = 24;

  const COLS2 = [
    { header: 'Rank',            width: 7  },
    { header: 'Candidate ID',    width: 16 },
    { header: 'Candidate Name',  width: 26 },
    { header: 'Overall Score',   width: 14 },
    { header: 'Semantic Score',  width: 14 },
    { header: 'Signal Boost',    width: 13 },
    { header: 'Yrs Experience',  width: 14 },
    { header: 'Tech Skills #',   width: 13 },
    { header: 'Projects #',      width: 12 },
    { header: 'Certifications #',width: 16 },
  ];
  ws2.columns = COLS2;

  const hdr2 = ws2.getRow(2);
  hdr2.values = COLS2.map(c => c.header);
  hdr2.height = 18;
  hdr2.eachCell(cell => {
    cell.font      = { bold: true, size: 10, color: HDR_TEXT };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF21262D' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border    = { bottom: { style: 'thin', color: { argb: 'FF30363D' } } };
  });

  for (let i = 0; i < rows.length; i++) {
    const r   = rows[i];
    const row = ws2.addRow([r.rank, r.candidate_id, r.candidate_name,
      r.overall_score, r.semantic_score, r.signal_boost,
      r.years_exp, r.technical_skills, r.projects_count, r.certifications]);
    row.height = 17;
    const bg = i % 2 === 0 ? DARK_BG : MID_BG;
    row.eachCell((cell, col) => {
      cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: bg };
      cell.font  = { name: 'Calibri', size: 10, color: { argb: 'FFC9D1D9' } };
      cell.alignment = { horizontal: col <= 3 ? 'left' : 'center', vertical: 'middle' };
      if ([4, 5, 6].includes(col)) {
        cell.font.color = scoreColor(cell.value);
        cell.font.bold  = col === 4;
        cell.numFmt     = '0"%"';
      }
    });
  }
  ws2.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: 10 } };

  // ── SHEET 3: Summary ──────────────────────────────────────────────────────
  const ws3 = wb.addWorksheet('Summary');
  ws3.getColumn(1).width = 32;
  ws3.getColumn(2).width = 24;

  const addSummaryRow = (label, value, bold = false, color = 'FFC9D1D9') => {
    const r = ws3.addRow([label, value]);
    r.getCell(1).font = { name: 'Calibri', size: 11, color: { argb: color } };
    r.getCell(2).font = { name: 'Calibri', size: 11, bold, color: { argb: color } };
    r.getCell(2).alignment = { horizontal: 'center' };
    r.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: DARK_BG }; });
  };

  const strongHires = rows.filter(r => r.recommendation === 'Strong Hire').length;
  const hires       = rows.filter(r => r.recommendation === 'Hire').length;
  const considers   = rows.filter(r => r.recommendation === 'Consider').length;
  const notRec      = rows.filter(r => r.recommendation === 'Not Recommended').length;

  const avgOverall  = Math.round(rows.reduce((s, r) => s + r.overall_score,  0) / rows.length);
  const avgSemantic = Math.round(rows.reduce((s, r) => s + r.semantic_score, 0) / rows.length);
  const top10Avg    = Math.round(rows.slice(0, 10).reduce((s, r) => s + r.overall_score, 0) / 10);

  ws3.addRow(['']);
  addSummaryRow('🏆  Hackathon Submission Summary', '', true, 'FFF0F6FC');
  ws3.addRow(['']);
  addSummaryRow('Job Title',                 job.title,         false, 'FF79C0FF');
  addSummaryRow('Job ID',                    state.jobId,       false, 'FF8B949E');
  addSummaryRow('Total Candidates Ranked',   rows.length,       true,  'FFF0F6FC');
  ws3.addRow(['']);
  addSummaryRow('── Recommendation Distribution ──', '', true, 'FF58A6FF');
  addSummaryRow('Strong Hire',     strongHires, false, 'FF56D364');
  addSummaryRow('Hire',            hires,       false, 'FF2EA043');
  addSummaryRow('Consider',        considers,   false, 'FFD29922');
  addSummaryRow('Not Recommended', notRec,      false, 'FFF85149');
  ws3.addRow(['']);
  addSummaryRow('── Score Averages ──', '', true, 'FF58A6FF');
  addSummaryRow('Avg Overall Score (all)',  `${avgOverall}%`,  false, 'FFC9D1D9');
  addSummaryRow('Avg Semantic Score (all)', `${avgSemantic}%`, false, 'FFC9D1D9');
  addSummaryRow('Top-10 Avg Overall Score', `${top10Avg}%`,    true,  'FFFFD700');
  ws3.addRow(['']);
  addSummaryRow('── Top 10 Candidates ──', '', true, 'FF58A6FF');
  rows.slice(0, 10).forEach(r => {
    addSummaryRow(`  #${r.rank}  ${r.candidate_name}`,
                  `${r.overall_score}%  —  ${r.recommendation}`, false, 'FF79C0FF');
  });
  ws3.addRow(['']);
  addSummaryRow('── Data Sources ──', '', true, 'FF58A6FF');
  addSummaryRow('Live AI Pipeline', usedLivePipeline, false, 'FFC9D1D9');
  addSummaryRow('DB Formula',       usedDB,           false, 'FFC9D1D9');
  addSummaryRow('Raw JSONL',        usedJSONL,        false, 'FFC9D1D9');
  addSummaryRow('CSV Fallback',     usedCSVFallback,  false, 'FFC9D1D9');
  ws3.addRow(['']);
  addSummaryRow('Generated At',     new Date().toLocaleString('en-IN'), false, 'FF8B949E');
  addSummaryRow('Scoring Engine',   'AI-Recruiter Hybrid Ranking v1.0.0', false, 'FF8B949E');

  // ── Write file ────────────────────────────────────────────────────────────
  await wb.xlsx.writeFile(OUTPUT_PATH);
  console.log(`\n✅ Excel file written to:\n   ${OUTPUT_PATH}`);
  console.log(`\n📊 Final Statistics:`);
  console.log(`   Total ranked  : ${rows.length}`);
  console.log(`   Strong Hire   : ${strongHires}`);
  console.log(`   Hire          : ${hires}`);
  console.log(`   Consider      : ${considers}`);
  console.log(`   Not Rec.      : ${notRec}`);
  console.log(`   Avg Score     : ${avgOverall}%`);
  console.log(`   Top Candidate : ${rows[0]?.candidate_name} (${rows[0]?.overall_score}%)\n`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});

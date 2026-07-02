#!/usr/bin/env node
/**
 * seedApplications.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads sample_submission.csv and creates Application records for those top 100
 * candidates against the seeded job.
 *
 * Idempotent: checks for existing applications.
 *
 * Uses:
 *   - backend/scripts/.seed_state.json to find the Job ID
 *   - DatasetCandidate collection to resolve Candidate IDs to Mongo User/Profile IDs
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const path     = require('path');
const fs       = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Application      = require('../models/Application');
const DatasetCandidate = require('../models/DatasetCandidate');

const SEED_STATE_PATH = path.resolve(__dirname, '.seed_state.json');
const CSV_PATH        = path.resolve(__dirname, '../data/India_runs_data_and_ai_challenge/sample_submission.csv');

// Simple CSV parser function to avoid package installation dependency issues
function parseCSV(content) {
  const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i];
    // Handle quoted fields like reasoning
    const matches = currentLine.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    const values = matches.map(v => v.replace(/^"|"$/g, '').trim());
    
    // Fallback if regex match doesn't align with headers
    if (values.length !== headers.length) {
      // Split by comma fallback
      const simpleValues = currentLine.split(',');
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = simpleValues[idx] || '';
      });
      rows.push(row);
    } else {
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      rows.push(row);
    }
  }
  return rows;
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║           TalentAI — Seed Applications               ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) { console.error('❌  MONGO_URI not set'); process.exit(1); }

  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected to MongoDB');

  // Load Seed State
  if (!fs.existsSync(SEED_STATE_PATH)) {
    console.error('❌  .seed_state.json not found. Run seedRecruiterAndJob.js first.');
    process.exit(1);
  }
  const state = JSON.parse(fs.readFileSync(SEED_STATE_PATH, 'utf8'));
  const jobId = state.jobId;
  const recruiterId = state.recruiterId;

  if (!jobId || !recruiterId) {
    console.error('❌  jobId or recruiterId missing from seed state.');
    process.exit(1);
  }

  // Load sample_submission.csv
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌  sample_submission.csv not found at ${CSV_PATH}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
  const records = parseCSV(csvContent);
  console.log(`📄  Loaded ${records.length} records from sample_submission.csv`);

  let applicationsCreated = 0;
  let applicationsSkipped = 0;
  let candidatesNotFound = 0;

  for (const record of records) {
    const candidateId = record.candidate_id;
    if (!candidateId) continue;

    // Find candidate in DatasetCandidate
    const dc = await DatasetCandidate.findOne({ candidateId }).populate('resumeVersionId');
    if (!dc) {
      candidatesNotFound++;
      continue;
    }

    // Check if application already exists
    const existingApp = await Application.findOne({ candidate: dc.userId, job: jobId });
    if (existingApp) {
      applicationsSkipped++;
      continue;
    }

    // Determine status based on rank
    const rank = parseInt(record.rank);
    let status = 'Applied';
    if (rank <= 15) {
      status = 'Shortlisted';
    } else if (rank <= 40) {
      status = 'Under Review';
    }

    // Parse score
    const csvScore = parseFloat(record.score) * 100; // normalize to 0-100 if CSV has decimals like 0.9920

    // Create application record
    await Application.create({
      candidate: dc.userId,
      candidateProfile: dc.candidateProfileId,
      job: jobId,
      recruiter: recruiterId,
      resumeFile: `/dataset/${dc.candidateId}.txt`,
      resumeOriginalName: `${dc.candidateId}_dataset.txt`,
      resumeVersion: '1',
      resumeUploadedAt: new Date(),
      status: status,
      coverLetter: `Hi, I am interested in the Senior AI/ML Engineer position. I have candidates.jsonl ID: ${dc.candidateId}.`,
      notes: record.reasoning || '',
      // Seed initial mock scores/metadata from CSV
      ai: {
        semanticScore: Math.round(csvScore),
        technicalSkillScore: Math.round(csvScore),
        softSkillScore: 80,
        experienceScore: 85,
        projectScore: 75,
        certificationScore: 70,
        matchedSkills: [],
        missingSkills: [],
        relatedSkills: [],
        confidence: {
          overall: 90,
          technical: 90,
          experience: 85,
          education: 90
        },
        aiStatus: 'Completed'
      },
      ranking: {
        status: 'Completed',
        overallScore: Math.round(csvScore),
        semanticScore: Math.round(csvScore),
        experienceScore: 85,
        projectScore: 75,
        educationScore: 80,
        certificationScore: 70,
        profileScore: 90,
        platformScore: dc.signalBoostScore || 50,
        strengths: ['Hackathon top candidate', 'High platform score'],
        weaknesses: [],
        missingSkills: [],
        relatedSkills: [],
        recommendedInterviewTopics: ['System Design', 'LLMs'],
        recommendation: rank <= 15 ? 'Strong Hire' : (rank <= 50 ? 'Hire' : 'Consider'),
        scoreExplanation: record.reasoning || '',
        rankingMetadata: {
          rankingVersion: 'hackathon-csv-import',
          rankingWeights: {},
          generatedBy: 'csv-import',
          generatedAt: new Date()
        }
      }
    });

    applicationsCreated++;
  }

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║            Application Seeder Summary                ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Applications Created  : ${String(applicationsCreated).padEnd(28)}║`);
  console.log(`║  Applications Skipped  : ${String(applicationsSkipped).padEnd(28)}║`);
  console.log(`║  Candidates Not Found  : ${String(candidatesNotFound).padEnd(28)}║`);
  console.log('╚══════════════════════════════════════════════════════╝\n');

  console.log('✅  Applications seeded successfully.\n');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌  Fatal error:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});

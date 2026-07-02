#!/usr/bin/env node
/**
 * seedRecruiterAndJob.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates one system Recruiter user, one RecruiterProfile, and one published Job.
 * The Job is based on the Redrob hackathon challenge context (Senior AI Engineer).
 *
 * Idempotent: safe to re-run. Uses upsert on email and companyName.
 * Saves created IDs to backend/scripts/.seed_state.json for use by other scripts.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const path     = require('path');
const fs       = require('fs');
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User             = require('../models/User');
const RecruiterProfile = require('../models/RecruiterProfile');
const Job              = require('../models/Job');

const SEED_STATE_PATH = path.resolve(__dirname, '.seed_state.json');

// ── Seed Data ─────────────────────────────────────────────────────────────────

const RECRUITER = {
  fullName: 'Redrob Talent Team',
  email:    'talent@redrob.org',
  password: 'Redrob@Recruiter2024',
  role:     'Recruiter'
};

const COMPANY = {
  companyName:       'Redrob Technologies',
  industry:          'Technology / AI',
  companySize:       '201-500',
  foundedYear:       '2019',
  headquarters:      'Bengaluru, Karnataka, India',
  website:           'https://redrob.in',
  description:       'Redrob is a next-generation AI-powered talent platform connecting India\'s best technical talent with high-growth companies. We run the largest AI recruitment challenge in South Asia.',
  companyEmail:      'talent@redrob.org',
  jobTitle:          'Head of Engineering Talent',
  verification:      { status: 'Verified' }
};

const JOB_DESCRIPTION_HTML = `
<h2>About the Role</h2>
<p>We are looking for a <strong>Senior AI/ML Engineer</strong> to join our core AI Platform team. 
You will design, build, and productionise machine-learning systems that power Redrob's intelligent candidate 
discovery and ranking engine, serving millions of recruiters and candidates across India and globally.</p>

<h2>What You'll Do</h2>
<ul>
  <li>Build and maintain large-scale ML pipelines for candidate ranking, semantic matching, and intelligent recommendations.</li>
  <li>Fine-tune and deploy LLMs (including Gemini, LLaMA, Mistral) for domain-specific NLP tasks.</li>
  <li>Design vector search and embedding infrastructure using Milvus / Pinecone / pgvector.</li>
  <li>Collaborate with product and data engineering teams to ship AI features end-to-end.</li>
  <li>Define model evaluation frameworks and champion a culture of rigorous experimentation.</li>
  <li>Mentor junior ML engineers and contribute to our technical blog and research initiatives.</li>
</ul>

<h2>Tech Stack</h2>
<ul>
  <li><strong>Languages</strong>: Python, SQL</li>
  <li><strong>ML Frameworks</strong>: PyTorch, TensorFlow, Hugging Face Transformers, scikit-learn</li>
  <li><strong>Data Engineering</strong>: Apache Spark, Kafka, Airflow, dbt</li>
  <li><strong>Cloud</strong>: GCP (Vertex AI, BigQuery, Cloud Run), AWS (SageMaker)</li>
  <li><strong>Serving</strong>: BentoML, FastAPI, Docker, Kubernetes</li>
</ul>
`;

const JOB_DATA = {
  title:              'Senior AI/ML Engineer',
  department:         'AI Platform',
  employmentType:     'Full-time',
  workplaceType:      'Hybrid',
  location:           'Bengaluru, Karnataka, India',
  status:             'Published',
  visibility:         'Public',
  description:        JOB_DESCRIPTION_HTML,
  responsibilities: [
    'Design and build scalable ML pipelines for candidate ranking and semantic matching',
    'Fine-tune and deploy large language models for NLP tasks',
    'Build and maintain vector search infrastructure',
    'Define model evaluation and A/B testing frameworks',
    'Collaborate cross-functionally with product and data engineering',
    'Mentor junior ML engineers'
  ],
  requiredSkills: [
    'Python', 'Machine Learning', 'Deep Learning', 'PyTorch', 'NLP',
    'LLMs', 'Fine-tuning LLMs', 'Transformers', 'SQL', 'Apache Spark'
  ],
  preferredSkills: [
    'Milvus', 'Pinecone', 'Vertex AI', 'BentoML', 'Kafka', 'Airflow',
    'Kubernetes', 'GCP', 'Hugging Face', 'LoRA', 'RAG', 'Vector Databases'
  ],
  requiredExperience: '4',   // years
  educationRequirement: 'B.Tech / B.E. / B.Sc in Computer Science, AI, or related field',
  certifications: [],
  openings:          10,
  salaryMin:         2500000,   // INR 25 LPA
  salaryMax:         6000000,   // INR 60 LPA
  currency:          'INR',
  benefits: [
    'Health insurance (employee + family)',
    'Flexible working hours',
    'ESOPs',
    'Annual learning budget ₹1 Lakh',
    'Work from home 3 days/week'
  ],
  applicationDeadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),  // 90 days from now
  hiringManager: 'Redrob Talent Team',
  aiEnabled: true,
  aiProcessing: {
    status: 'Pending',
    extractedSkills: [],
    extractedKeywords: [],
    embeddingId: '',
    embeddingModel: ''
  },
  // Pre-populate AI Analysis so Semantic Matching and Ranking can run immediately
  aiAnalysis: {
    status: 'Completed',
    summary: 'Senior AI/ML Engineer role at Redrob Technologies requiring deep expertise in ML pipelines, LLM fine-tuning, NLP, and distributed data engineering. Strong Python and ML framework skills essential.',
    normalizedData: {
      seniority:        'Senior',
      jobDomain:        'Machine Learning / AI',
      industry:         'Technology',
      jobCategory:      'Engineering',
      experienceLevel:  '4+ years',
      requiredSkills: [
        'Python', 'Machine Learning', 'Deep Learning', 'PyTorch', 'NLP',
        'LLMs', 'Fine-tuning LLMs', 'Transformers', 'SQL', 'Apache Spark'
      ],
      preferredSkills: [
        'Milvus', 'Pinecone', 'Vertex AI', 'BentoML', 'Kafka', 'Airflow',
        'Kubernetes', 'GCP', 'Hugging Face', 'LoRA', 'RAG'
      ],
      mustHaveSkills: ['Python', 'Machine Learning', 'NLP', 'PyTorch'],
      niceToHaveSkills: ['LoRA', 'RAG', 'Milvus', 'BentoML'],
      softSkills: ['Communication', 'Collaboration', 'Problem Solving', 'Leadership'],
      technicalSkills: [
        'Python', 'PyTorch', 'TensorFlow', 'Hugging Face', 'SQL',
        'Apache Spark', 'Kafka', 'Airflow', 'GCP', 'AWS', 'Docker', 'Kubernetes'
      ],
      technologies: ['PyTorch', 'Transformers', 'Milvus', 'BentoML', 'FastAPI', 'Docker'],
      tools:         ['Airflow', 'dbt', 'Weights & Biases', 'MLflow'],
      programmingLanguages: ['Python', 'SQL'],
      educationRequirements: ['B.Tech in CS/AI', 'M.Tech preferred'],
      certifications: [],
      keywords: [
        'AI', 'ML', 'LLM', 'NLP', 'Deep Learning', 'Neural Networks',
        'Embeddings', 'Vector Search', 'Candidate Ranking', 'Recommendation Systems'
      ],
      responsibilities: [
        'Build ML pipelines for candidate ranking',
        'Fine-tune and deploy LLMs',
        'Design vector search infrastructure',
        'Model evaluation and A/B testing',
        'Cross-functional collaboration',
        'Mentor junior engineers'
      ],
      recommendedInterviewTopics: [
        'ML system design (candidate ranking at scale)',
        'LLM fine-tuning techniques (LoRA, RLHF)',
        'Vector similarity search and embeddings',
        'Distributed data processing with Spark',
        'Python coding and algorithm problems',
        'ML experimentation and evaluation frameworks'
      ],
      missingInformation: []
    },
    rawResponse: '',
    model: 'dataset-seed-v1',
    promptVersion: '1.0.0',
    confidence: { overall: 95, skills: 95, experience: 90, education: 90 },
    analyzedAt: new Date()
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadSeedState() {
  if (fs.existsSync(SEED_STATE_PATH)) {
    return JSON.parse(fs.readFileSync(SEED_STATE_PATH, 'utf8'));
  }
  return {};
}

function saveSeedState(state) {
  fs.writeFileSync(SEED_STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║       AI-Recruiter — Seed Recruiter & Job                ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) { console.error('❌  MONGO_URI not set'); process.exit(1); }

  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected to MongoDB\n');

  const state = loadSeedState();

  // ── 1. Upsert Recruiter User ───────────────────────────────────────────────
  let recruiterUser = await User.findOne({ email: RECRUITER.email });
  if (!recruiterUser) {
    const hashed = await bcrypt.hash(RECRUITER.password, 10);
    recruiterUser = await User.create({ ...RECRUITER, password: hashed });
    console.log(`✅  Recruiter user created: ${recruiterUser.email}`);
  } else {
    console.log(`⏭️  Recruiter user already exists: ${recruiterUser.email}`);
  }
  state.recruiterId = recruiterUser._id;

  // ── 2. Upsert RecruiterProfile ─────────────────────────────────────────────
  let recruiterProfile = await RecruiterProfile.findOne({ user: recruiterUser._id });
  if (!recruiterProfile) {
    recruiterProfile = await RecruiterProfile.create({
      user: recruiterUser._id,
      ...COMPANY,
      hiringPreferences: {
        departments:     ['Engineering', 'AI / ML', 'Data Science'],
        experienceLevels:['Senior', 'Staff', 'Principal'],
        employmentTypes: ['Full-time'],
        preferredSkills: ['Python', 'Machine Learning', 'NLP', 'LLMs'],
        preferredLocations: ['Bengaluru', 'Hyderabad', 'Remote'],
        remotePolicy:    'Hybrid',
        salaryBudget:    '25–60 LPA INR'
      },
      links: { linkedin: 'https://linkedin.com/company/redrob', twitter: '' }
    });
    console.log(`✅  Recruiter profile created: ${recruiterProfile.companyName}`);
  } else {
    console.log(`⏭️  Recruiter profile already exists: ${recruiterProfile.companyName}`);
  }
  state.recruiterProfileId = recruiterProfile._id;

  // ── 3. Upsert Job ──────────────────────────────────────────────────────────
  let job = await Job.findOne({ recruiter: recruiterUser._id, title: JOB_DATA.title });
  if (!job) {
    job = await Job.create({
      ...JOB_DATA,
      recruiter:      recruiterUser._id,
      companyProfile: recruiterProfile._id
    });
    console.log(`✅  Job created: "${job.title}" (ID: ${job._id})`);
  } else {
    console.log(`⏭️  Job already exists: "${job.title}" (ID: ${job._id})`);
  }
  state.jobId    = job._id;
  state.jobTitle = job.title;

  saveSeedState(state);

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║                  Seed Complete                       ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Recruiter ID       : ${String(state.recruiterId).padEnd(31)}║`);
  console.log(`║  Recruiter Profile  : ${String(state.recruiterProfileId).padEnd(31)}║`);
  console.log(`║  Job ID             : ${String(state.jobId).padEnd(31)}║`);
  console.log(`║  Job Title          : ${String(state.jobTitle).substring(0,30).padEnd(31)}║`);
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Seed state saved   : .seed_state.json               ║`);
  console.log('╚══════════════════════════════════════════════════════╝\n');

  console.log('🔑  Recruiter login credentials:');
  console.log(`    Email    : ${RECRUITER.email}`);
  console.log(`    Password : ${RECRUITER.password}\n`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌  Fatal error:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});

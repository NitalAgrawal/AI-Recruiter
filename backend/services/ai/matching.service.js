const crypto = require('crypto');
const VectorCache = require('../../models/VectorCache');
const Application = require('../../models/Application');
const Job = require('../../models/Job');
const ResumeVersion = require('../../models/ResumeVersion');
const embeddingsProvider = require('./providers/embeddings.provider');

// ── Configuration ──────────────────────────────────────────────────────────
const MATCHING_VERSION = '1.0.0';
const WEIGHTS = {
  technical: 0.40,
  experience: 0.20,
  projects: 0.15,
  education: 0.10,
  soft: 0.10,
  certifications: 0.05
};

// ── Math & Hashing Utilities ───────────────────────────────────────────────

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function computeHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

// ── Core Service ────────────────────────────────────────────────────────────

/**
 * Get or generate embedding for a specific field, using VectorCache.
 */
async function getCachedEmbedding(entityId, entityType, field, text) {
  if (!text || text.trim() === '') return null;
  
  const contentHash = computeHash(text);
  const modelName = embeddingsProvider.getModelName();

  // Try to find exact cache match
  let cache = await VectorCache.findOne({ entityId, entityType, field, model: modelName, contentHash });
  if (cache) return cache.embedding;

  // Cache miss -> Generate
  const embedding = await embeddingsProvider.getEmbedding(text);
  
  // Upsert to handle concurrent writes cleanly
  await VectorCache.findOneAndUpdate(
    { entityId, entityType, field, model: modelName }, // unique constraint minus hash
    { embedding, contentHash }, // Update or set
    { upsert: true, new: true }
  );

  return embedding;
}

/**
 * Score a candidate's section against a job's requirement using dense vectors.
 */
async function scoreSection(jobId, jobText, resumeId, resumeText, fieldName) {
  if (!jobText || !resumeText) return 0; // If either is missing, score is 0
  
  const jobVec = await getCachedEmbedding(jobId, 'Job', fieldName, jobText);
  const resVec = await getCachedEmbedding(resumeId, 'Resume', fieldName, resumeText);
  
  if (!jobVec || !resVec) return 0;
  
  const sim = cosineSimilarity(jobVec, resVec);
  // Convert [-1, 1] to [0, 100] cleanly. Usually for embeddings, it's [0, 1].
  return Math.max(0, Math.min(100, Math.round(sim * 100)));
}

/**
 * Advanced skill extraction via O(N*M) individual vector comparisons.
 * Finds Exact Matches, Missing Skills, and Related Skills (semantic equivalents).
 */
async function analyzeSkills(jobId, requiredSkills, resumeId, resumeSkills) {
  const result = { matched: [], missing: [], related: [] };
  if (!requiredSkills || requiredSkills.length === 0) return result;
  
  // Lowercase for exact matching
  const candSkillsLower = (resumeSkills || []).map(s => s.toLowerCase());

  // We need embeddings for all required job skills and all candidate skills that aren't exact matches
  const skillsToEmbed = [];
  const reqSkillsToEmbed = [];

  for (const reqSkill of requiredSkills) {
    if (candSkillsLower.includes(reqSkill.toLowerCase())) {
      result.matched.push(reqSkill);
    } else {
      reqSkillsToEmbed.push(reqSkill);
    }
  }

  if (reqSkillsToEmbed.length === 0) return result; // All matched exactly!
  if (!resumeSkills || resumeSkills.length === 0) {
    result.missing = reqSkillsToEmbed;
    return result;
  }

  // Get embeddings for Job missing skills and Candidate available skills
  // (We bypass VectorCache here to avoid bloating the DB with thousands of 1-word vectors, 
  // though we could cache them by string hash globally).
  const candEmbeddingsRes = await embeddingsProvider.getBatchEmbeddings(resumeSkills);
  const reqEmbeddingsRes = await embeddingsProvider.getBatchEmbeddings(reqSkillsToEmbed);

  const SIMILARITY_THRESHOLD = 0.78; // Very high threshold for semantic equivalents

  for (let i = 0; i < reqSkillsToEmbed.length; i++) {
    const reqSkill = reqSkillsToEmbed[i];
    const reqVec = reqEmbeddingsRes[i];
    
    let bestMatchIdx = -1;
    let highestSim = 0;

    for (let j = 0; j < resumeSkills.length; j++) {
      const sim = cosineSimilarity(reqVec, candEmbeddingsRes[j]);
      if (sim > highestSim) {
        highestSim = sim;
        bestMatchIdx = j;
      }
    }

    if (highestSim >= SIMILARITY_THRESHOLD) {
      result.related.push(`${reqSkill} (via ${resumeSkills[bestMatchIdx]})`);
    } else {
      result.missing.push(reqSkill);
    }
  }

  return result;
}

/**
 * Orchestrate the complete semantic match for an Application.
 */
exports.runSemanticMatchAsync = async (applicationId) => {
  const application = await Application.findById(applicationId).populate('job');
  if (!application) throw new Error('Application not found');
  
  const job = application.job;
  
  // Find the exact resume version used (or fallback to latest)
  let resume = await ResumeVersion.findOne({ candidate: application.candidate }).sort({ version: -1 });
  if (application.resumeVersion) {
    const exactResume = await ResumeVersion.findOne({ candidate: application.candidate, version: Number(application.resumeVersion) });
    if (exactResume) resume = exactResume;
  }

  if (!resume || !resume.parsedResume) {
    throw new Error('Candidate resume is not parsed or available.');
  }
  if (!job.aiAnalysis || job.aiAnalysis.status !== 'Completed') {
    throw new Error('Job AI Analysis must be completed before matching.');
  }

  // Set to Processing
  application.ai = { ...application.ai, aiStatus: 'Processing' };
  await application.save();

  setImmediate(async () => {
    try {
      const jobData = job.aiAnalysis.normalizedData || {};
      const resData = resume.parsedResume || {};

      // 1. Prepare texts for embedding
      const jobTechText = [...(jobData.requiredSkills || []), ...(jobData.niceToHaveSkills || [])].join(', ');
      const resTechText = resData.skills?.technical?.join(', ') || '';

      const jobSoftText = jobData.softSkills?.join(', ') || '';
      const resSoftText = resData.skills?.soft?.join(', ') || '';

      const jobExpText = `${jobData.experienceLevel || ''} ${jobData.responsibilities?.join(' ') || ''}`;
      const resExpText = resData.experience?.map(e => `${e.position} at ${e.company}. ${e.description}`).join(' ') || '';

      const jobEduText = jobData.educationRequirements?.join(', ') || '';
      const resEduText = resData.education?.map(e => `${e.degree} from ${e.institution}`).join(', ') || '';

      const jobProjText = 'Projects portfolio'; // Minimal job side expectation
      const resProjText = resData.projects?.map(p => `${p.title}. ${p.description}`).join(' ') || '';

      const jobCertText = jobData.certifications?.join(', ') || '';
      const resCertText = resData.certifications?.map(c => c.name).join(', ') || '';

      // 2. Score sections via Embeddings Cosine Similarity
      const technicalSkillScore = await scoreSection(job._id, jobTechText, resume._id, resTechText, 'technicalSkills');
      const softSkillScore = await scoreSection(job._id, jobSoftText, resume._id, resSoftText, 'softSkills');
      const experienceScore = await scoreSection(job._id, jobExpText, resume._id, resExpText, 'experience');
      const educationScore = jobEduText ? await scoreSection(job._id, jobEduText, resume._id, resEduText, 'education') : 100; // 100 if no edu req
      const projectScore = await scoreSection(job._id, jobProjText, resume._id, resProjText, 'projects');
      const certificationScore = jobCertText ? await scoreSection(job._id, jobCertText, resume._id, resCertText, 'certifications') : 100;

      // 3. Compute detailed skill overlap
      const requiredSkills = [...(jobData.requiredSkills || []), ...(jobData.mustHaveSkills || [])];
      const { matched, missing, related } = await analyzeSkills(job._id, requiredSkills, resume._id, resData.skills?.technical || []);

      // 4. Compute Weighted Semantic Score
      const semanticScore = Math.round(
        (technicalSkillScore * WEIGHTS.technical) +
        (experienceScore * WEIGHTS.experience) +
        (projectScore * WEIGHTS.projects) +
        (educationScore * WEIGHTS.education) +
        (softSkillScore * WEIGHTS.soft) +
        (certificationScore * WEIGHTS.certifications)
      );

      // 5. Confidence estimation (heuristic based on text lengths)
      const confOverall = resTechText.length > 10 && jobTechText.length > 10 ? 95 : 60;

      // 6. Save results
      await Application.findByIdAndUpdate(applicationId, {
        'ai.semanticScore': semanticScore,
        'ai.technicalSkillScore': technicalSkillScore,
        'ai.softSkillScore': softSkillScore,
        'ai.experienceScore': experienceScore,
        'ai.projectScore': projectScore,
        'ai.educationScore': educationScore,
        'ai.certificationScore': certificationScore,
        'ai.matchedSkills': matched,
        'ai.missingSkills': missing,
        'ai.relatedSkills': related,
        'ai.confidence': {
          overall: confOverall,
          technical: 90,
          experience: 85,
          education: 90
        },
        'ai.matchingMetadata': {
          embeddingModel: embeddingsProvider.getModelName(),
          similarityAlgorithm: 'Cosine',
          matchingVersion: MATCHING_VERSION,
          processedAt: new Date()
        },
        'ai.aiStatus': 'Completed'
      });
      console.log(`Semantic Matching completed for Application ${applicationId}`);
    } catch (error) {
      console.error(`Semantic Matching failed for ${applicationId}:`, error);
      await Application.findByIdAndUpdate(applicationId, {
        'ai.aiStatus': 'Failed'
      });
    }
  });

  return { message: 'Semantic matching started in the background.' };
};

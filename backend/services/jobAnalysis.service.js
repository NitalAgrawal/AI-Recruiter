const Job = require('../models/Job');
const geminiProvider = require('./ai/providers/gemini.provider');
const { PROMPT_VERSION, SYSTEM_INSTRUCTION, buildPrompt } = require('./ai/prompts/jobAnalysis.prompt');

/**
 * Trigger background AI analysis of a Job Posting.
 * 
 * Flow:
 * 1. Validate Job exists.
 * 2. Mark status as Processing.
 * 3. Immediately return success so the client isn't blocked.
 * 4. Background: Call AI Provider.
 * 5. Background: Parse JSON and update Job.aiAnalysis.
 */
exports.analyzeJobAsync = async (jobId, recruiterUserId) => {
  const job = await Job.findOne({ _id: jobId, recruiter: recruiterUserId });
  if (!job) throw new Error('Job not found or unauthorized');

  // Set to Processing
  if (!job.aiAnalysis) job.aiAnalysis = {};
  job.aiAnalysis.status = 'Processing';
  await job.save();

  // Run asynchronously
  setImmediate(async () => {
    try {
      const prompt = buildPrompt(job);
      const { rawText, modelUsed } = await geminiProvider.generateJSON(prompt, SYSTEM_INSTRUCTION);
      
      let parsedJson;
      try {
        parsedJson = JSON.parse(rawText);
      } catch (parseErr) {
        throw new Error('AI returned malformed JSON');
      }

      await Job.findByIdAndUpdate(jobId, {
        aiAnalysis: {
          status: 'Completed',
          summary: parsedJson.summary || '',
          normalizedData: parsedJson.normalizedData || {},
          rawResponse: rawText,
          model: modelUsed,
          promptVersion: PROMPT_VERSION,
          confidence: parsedJson.confidence || {},
          analyzedAt: new Date()
        }
      });
      console.log(`Job ${jobId} analysis completed.`);

    } catch (error) {
      console.error(`Job Analysis failed for ${jobId}:`, error);
      await Job.findByIdAndUpdate(jobId, {
        'aiAnalysis.status': 'Failed',
        'aiAnalysis.rawResponse': error.message || 'Unknown error'
      });
    }
  });

  return { message: 'AI Job Analysis started in the background.' };
};

/**
 * Fetch the latest analysis status and data.
 */
exports.getJobAnalysis = async (jobId, recruiterUserId) => {
  const job = await Job.findOne({ _id: jobId, recruiter: recruiterUserId }).select('aiAnalysis title');
  if (!job) throw new Error('Job not found or unauthorized');
  
  return job.aiAnalysis;
};

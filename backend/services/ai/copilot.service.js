const { GoogleGenerativeAI } = require('@google/generative-ai');
const Application = require('../../models/Application');
const Job = require('../../models/Job');
const CopilotLog = require('../../models/CopilotLog');
const { getSystemInstruction } = require('./prompts/copilot.prompt');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

// Lightweight in-memory conversation store mapping jobId_recruiterId -> array of messages
// In production, use Redis.
const conversationMemory = new Map();

function getMemoryKey(jobId, recruiterId) {
  return `${jobId}_${recruiterId}`;
}

/**
 * Advanced Retrieval logic based on the user's prompt.
 * We fetch applications for the job that are relevant.
 */
async function retrieveRelevantContext(jobId, prompt) {
  const job = await Job.findById(jobId);
  
  let applications = [];
  const lowerPrompt = prompt.toLowerCase();
  
  // Strategy 1: Check for candidate names in the prompt
  const allApps = await Application.find({ job: jobId })
    .populate('candidate', 'fullName email')
    .populate('candidateProfile', 'technicalSkills professionalTitle location yearsOfExperience links')
    .select('ranking status ai candidate candidateProfile resumeOriginalName');
  
  const mentionedCandidates = allApps.filter(app => 
    app.candidate?.fullName && lowerPrompt.includes(app.candidate.fullName.toLowerCase())
  );

  if (mentionedCandidates.length > 0) {
    applications = mentionedCandidates;
  } else if (lowerPrompt.includes('top') || lowerPrompt.includes('best') || lowerPrompt.includes('recommend')) {
    // Strategy 2: Fetch top 5 ranked
    applications = allApps.sort((a, b) => (b.ranking?.overallScore || 0) - (a.ranking?.overallScore || 0)).slice(0, 5);
  } else {
    // Strategy 3: Keyword/skill search in matchedSkills or Profile skills
    const matchingApps = allApps.filter(app => {
      const skills = (app.ai?.matchedSkills || []).join(' ').toLowerCase() + ' ' + 
                     (app.candidateProfile?.technicalSkills?.map(s => s.name).join(' ') || '').toLowerCase();
      
      // Simple heuristic: if prompt contains a skill word that exists in candidate skills
      const words = lowerPrompt.split(/[\s,?.!]+/);
      return words.some(w => w.length > 2 && skills.includes(w));
    });
    
    if (matchingApps.length > 0) {
      applications = matchingApps.slice(0, 5); // Limit context size
    } else {
      // Fallback: Just top 3
      applications = allApps.sort((a, b) => (b.ranking?.overallScore || 0) - (a.ranking?.overallScore || 0)).slice(0, 3);
    }
  }

  // Format context cleanly to save tokens
  const formattedJob = {
    title: job.title,
    department: job.department,
    analysis: job.aiAnalysis?.normalizedData || {}
  };

  const formattedCandidates = applications.map(app => ({
    name: app.candidate?.fullName,
    status: app.status,
    overallScore: app.ranking?.overallScore,
    semanticScore: app.ranking?.semanticScore,
    experienceScore: app.ranking?.experienceScore,
    projectScore: app.ranking?.projectScore,
    educationScore: app.ranking?.educationScore,
    platformScore: app.ranking?.platformScore,
    strengths: app.ranking?.strengths || [],
    weaknesses: app.ranking?.weaknesses || [],
    missingSkills: app.ranking?.missingSkills || [],
    relatedSkills: app.ranking?.relatedSkills || [],
    recommendation: app.ranking?.recommendation || '',
    skills: app.candidateProfile?.technicalSkills?.map(s => s.name) || [],
    yearsOfExperience: app.candidateProfile?.yearsOfExperience || 0
  }));

  return JSON.stringify({
    jobContext: formattedJob,
    relevantCandidatesData: formattedCandidates
  }, null, 2);
}

/**
 * Streaming Copilot Chat
 */
exports.chatStream = async (jobId, recruiterId, prompt, res) => {
  if (!genAI) {
    res.write('data: {"error": "GEMINI_API_KEY missing"}\n\n');
    res.end();
    return;
  }

  try {
    const memoryKey = getMemoryKey(jobId, recruiterId);
    if (!conversationMemory.has(memoryKey)) {
      conversationMemory.set(memoryKey, []);
    }
    const history = conversationMemory.get(memoryKey);

    // 1. Retrieve Dynamic Context
    const contextStr = await retrieveRelevantContext(jobId, prompt);
    
    // 2. Build Gemini History
    // We add the system instruction and context to the very first message or as a system instruction (Gemini 1.5 supports system instruction parameter)
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: getSystemInstruction() + "\n\nCURRENT CONTEXT DATA:\n" + contextStr
    });

    // 3. Init Chat
    const chat = model.startChat({
      history: history
    });

    // 4. Stream response
    const result = await chat.sendMessageStream(prompt);
    
    let fullResponse = "";
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      // SSE format
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
    }

    // 5. Update Memory (Limit to last 10 messages = 5 turns)
    history.push({ role: 'user', parts: [{ text: prompt }] });
    history.push({ role: 'model', parts: [{ text: fullResponse }] });
    
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }
    conversationMemory.set(memoryKey, history);

    // 6. Log interaction asynchronously
    setImmediate(async () => {
      try {
        await CopilotLog.create({
          recruiter: recruiterId,
          job: jobId,
          prompt,
          response: fullResponse
        });
      } catch (err) {
        console.error('Failed to save CopilotLog:', err.message);
      }
    });

    res.write('data: {"done": true}\n\n');
    res.end();

  } catch (error) {
    console.error('Copilot Stream Error:', error);
    res.write(`data: {"error": "${error.message}"}\n\n`);
    res.end();
  }
};

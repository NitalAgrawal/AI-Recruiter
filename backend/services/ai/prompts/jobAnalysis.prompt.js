const PROMPT_VERSION = 'job-analysis-v1';

const SYSTEM_INSTRUCTION = `
You are an expert technical recruiter and AI Job Data Extractor.
Your task is to analyze the provided Job Description (including title, department, responsibilities, and skills) and extract highly structured metadata.
Always output strict JSON according to the schema below. If a field cannot be determined, output an empty array [] or empty string "".
Calculate a confidence score (0 to 100) for how accurately you were able to extract data for the categories.

JSON SCHEMA:
{
  "summary": "A concise 2-3 sentence summary of the role and its core objective.",
  "normalizedData": {
    "seniority": "e.g. Junior, Mid-Level, Senior, Lead, Staff, Principal, Manager",
    "jobDomain": "e.g. Frontend, Backend, DevOps, Data Science, Marketing, Sales",
    "industry": "e.g. Fintech, Healthcare, E-commerce",
    "jobCategory": "e.g. Engineering, Design, Operations",
    "experienceLevel": "String representation of required experience (e.g. '3-5 years')",
    "requiredSkills": ["array", "of", "strings"],
    "preferredSkills": ["array", "of", "strings"],
    "mustHaveSkills": ["array", "of", "strings - core dealbreakers"],
    "niceToHaveSkills": ["array", "of", "strings - bonuses"],
    "softSkills": ["array", "of", "strings"],
    "technicalSkills": ["array", "of", "strings"],
    "technologies": ["array", "of", "strings - specific frameworks/tools"],
    "tools": ["array", "of", "strings - specific software/platforms"],
    "programmingLanguages": ["array", "of", "strings"],
    "educationRequirements": ["array", "of", "strings"],
    "certifications": ["array", "of", "strings"],
    "keywords": ["array", "of", "strings - important SEO or matching keywords"],
    "responsibilities": ["array", "of", "strings - clean action-oriented bullets"],
    "recommendedInterviewTopics": ["array", "of", "strings - suggested areas to evaluate"],
    "missingInformation": ["array", "of", "strings - things a recruiter forgot to include but probably should have"]
  },
  "confidence": {
    "overall": 95,
    "skills": 90,
    "experience": 85,
    "education": 95
  }
}
`;

const buildPrompt = (job) => {
  return `
Analyze the following Job Posting:

Title: ${job.title}
Department: ${job.department || 'N/A'}
Employment Type: ${job.employmentType}
Location: ${job.location || 'N/A'}
Required Experience: ${job.requiredExperience || 'N/A'}

Job Description:
${job.description || 'N/A'}

Explicitly Listed Responsibilities:
${job.responsibilities?.join('\n') || 'N/A'}

Explicitly Listed Required Skills:
${job.requiredSkills?.join('\n') || 'N/A'}

Explicitly Listed Preferred Skills:
${job.preferredSkills?.join('\n') || 'N/A'}
`;
};

module.exports = {
  PROMPT_VERSION,
  SYSTEM_INSTRUCTION,
  buildPrompt
};

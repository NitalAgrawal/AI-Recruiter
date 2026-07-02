/**
 * Resume Parser Service v1.0.0
 * 
 * Parses raw resume text into a structured JSON object using
 * regex-based heuristics. This service is fully modular —
 * replace parseResumeText() with a Gemini / OpenAI API call
 * in the future without changing any controller or route.
 * 
 * Parser Version: 1.0.0
 */

const PARSER_VERSION = '1.0.0';

// ── Helpers ────────────────────────────────────────────────────────────────

const findLine = (text, keywords) => {
  const lines = text.split('\n');
  for (const line of lines) {
    for (const kw of keywords) {
      if (line.toLowerCase().includes(kw.toLowerCase())) return line.trim();
    }
  }
  return '';
};

const extractEmail = (text) => {
  const match = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : '';
};

const extractPhone = (text) => {
  const match = text.match(/(\+?\d[\d\s\-().]{8,}\d)/);
  return match ? match[0].trim() : '';
};

const extractUrl = (text, patterns) => {
  for (const pattern of patterns) {
    const regex = new RegExp(`(https?:\\/\\/)?(?:www\\.)?${pattern}[^\\s,<>"']+`, 'i');
    const match = text.match(regex);
    if (match) return match[0].trim();
  }
  return '';
};

const extractSection = (text, sectionHeaders, nextSectionHeaders = []) => {
  const lines = text.split('\n');
  let inSection = false;
  const sectionLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const isHeader = sectionHeaders.some(h => trimmed.toLowerCase().includes(h.toLowerCase()) && trimmed.length < 50);
    const isNext = nextSectionHeaders.some(h => trimmed.toLowerCase().includes(h.toLowerCase()) && trimmed.length < 50);

    if (isHeader) { inSection = true; continue; }
    if (inSection && isNext) break;
    if (inSection) sectionLines.push(trimmed);
  }

  return sectionLines.join('\n');
};

const extractSkills = (skillsText) => {
  const rawSkills = skillsText
    .split(/[,|\n•·▪\-\/]/)
    .map(s => s.trim())
    .filter(s => s.length > 1 && s.length < 40);

  const softKeywords = ['communication', 'leadership', 'teamwork', 'problem', 'analytical', 'creative', 'adaptable', 'time management', 'critical thinking', 'collaboration', 'attention to detail'];

  const technical = [];
  const soft = [];

  rawSkills.forEach(skill => {
    const lower = skill.toLowerCase();
    if (softKeywords.some(k => lower.includes(k))) {
      soft.push(skill);
    } else {
      technical.push(skill);
    }
  });

  return { technical: [...new Set(technical)], soft: [...new Set(soft)] };
};

const extractExperience = (expText) => {
  const experiences = [];
  const blocks = expText.split(/\n{2,}/);

  for (const block of blocks) {
    if (!block.trim()) continue;
    const lines = block.split('\n').filter(l => l.trim());
    if (lines.length === 0) continue;

    const datePattern = /(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)?\s*\d{4}\b)/gi;
    const dates = block.match(datePattern) || [];
    const currentPattern = /present|current|till date|ongoing/i;
    const isCurrent = currentPattern.test(block);

    experiences.push({
      company: lines[0] || '',
      position: lines[1] || '',
      startDate: dates[0] || '',
      endDate: isCurrent ? 'Present' : (dates[1] || ''),
      description: lines.slice(2).join(' ').substring(0, 300)
    });
  }

  return experiences.slice(0, 10);
};

const extractEducation = (eduText) => {
  const educations = [];
  const blocks = eduText.split(/\n{2,}/);

  for (const block of blocks) {
    if (!block.trim()) continue;
    const lines = block.split('\n').filter(l => l.trim());
    if (lines.length === 0) continue;

    const yearMatch = block.match(/\b(19|20)\d{2}\b/);
    const cgpaMatch = block.match(/(\d\.\d{1,2})\s*(?:\/\s*\d+(?:\.\d+)?)?(?:\s*CGPA|GPA|grade)?/i);
    const degreeKeywords = ['bachelor', 'master', 'phd', 'b.tech', 'm.tech', 'b.e', 'm.e', 'b.sc', 'm.sc', 'mba', 'diploma', 'associate', 'b.com'];
    
    const degreeLine = lines.find(l => degreeKeywords.some(k => l.toLowerCase().includes(k))) || lines[0] || '';
    const institutionLine = lines.find(l => l !== degreeLine) || lines[1] || '';

    educations.push({
      degree: degreeLine,
      institution: institutionLine,
      graduationYear: yearMatch ? yearMatch[0] : '',
      cgpa: cgpaMatch ? cgpaMatch[1] : ''
    });
  }

  return educations.slice(0, 5);
};

const extractProjects = (projText) => {
  const projects = [];
  const blocks = projText.split(/\n{2,}/);

  for (const block of blocks) {
    if (!block.trim()) continue;
    const lines = block.split('\n').filter(l => l.trim());
    if (lines.length === 0) continue;

    const techMatch = block.match(/(?:Tech(?:nologies|nology)?|Stack|Built with|Tools|Languages)[:\s]+([^\n]+)/i);
    const techList = techMatch
      ? techMatch[1].split(/[,|]/).map(t => t.trim()).filter(Boolean)
      : [];

    projects.push({
      title: lines[0] || '',
      description: lines.slice(1).join(' ').substring(0, 300),
      technologies: techList
    });
  }

  return projects.slice(0, 8);
};

const extractCertifications = (certText) => {
  const certs = [];
  const lines = certText.split('\n').filter(l => l.trim());

  for (const line of lines) {
    if (line.length < 5) continue;
    const orgMatch = line.match(/(?:by|from|–|-)\s+([A-Za-z].+)$/i);
    certs.push({
      name: line.split(/(?:by|from|–|-)/i)[0].trim(),
      organization: orgMatch ? orgMatch[1].trim() : ''
    });
  }

  return certs.slice(0, 10);
};

const estimateTotalExperience = (experiences) => {
  let totalMonths = 0;
  const monthMap = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

  for (const exp of experiences) {
    try {
      const startYear = exp.startDate ? parseInt(exp.startDate.match(/\d{4}/)?.[0]) : null;
      const endYear = exp.endDate === 'Present' ? new Date().getFullYear() : (exp.endDate ? parseInt(exp.endDate.match(/\d{4}/)?.[0]) : null);
      if (startYear && endYear) {
        totalMonths += (endYear - startYear) * 12;
      }
    } catch (_) {}
  }

  return Math.round(totalMonths / 12 * 10) / 10;
};

// ── Main Parser ─────────────────────────────────────────────────────────────

const ALL_SECTION_HEADERS = ['experience', 'education', 'skills', 'projects', 'certifications', 'links', 'objective', 'summary', 'profile', 'awards', 'publications'];

const parseResumeText = (rawText) => {
  const text = rawText || '';

  // Sections
  const skillsText = extractSection(text, ['skills', 'technical skills', 'core competencies', 'technologies'], ALL_SECTION_HEADERS);
  const expText = extractSection(text, ['experience', 'work experience', 'employment', 'work history'], ALL_SECTION_HEADERS);
  const eduText = extractSection(text, ['education', 'academic'], ALL_SECTION_HEADERS);
  const projText = extractSection(text, ['projects', 'personal projects', 'academic projects'], ALL_SECTION_HEADERS);
  const certText = extractSection(text, ['certifications', 'certificates', 'credentials'], ALL_SECTION_HEADERS);

  const skills = extractSkills(skillsText);
  const experience = extractExperience(expText);
  const education = extractEducation(eduText);
  const projects = extractProjects(projText);
  const certifications = extractCertifications(certText);

  const parsed = {
    personalInfo: {
      name: text.split('\n').find(l => l.trim().length > 2 && l.trim().length < 60)?.trim() || '',
      email: extractEmail(text),
      phone: extractPhone(text),
      location: findLine(text, ['location', 'city', 'address', 'based in']) || ''
    },
    skills,
    experience,
    education,
    projects,
    certifications,
    links: {
      github: extractUrl(text, ['github\\.com']),
      linkedin: extractUrl(text, ['linkedin\\.com']),
      portfolio: extractUrl(text, ['portfolio', 'personal.*site']),
      leetcode: extractUrl(text, ['leetcode\\.com']),
      hackerrank: extractUrl(text, ['hackerrank\\.com'])
    },
    totalYearsExperience: estimateTotalExperience(experience)
  };

  return { parsed, parserVersion: PARSER_VERSION };
};

module.exports = { parseResumeText, PARSER_VERSION };

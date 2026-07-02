const path = require('path');
const fs = require('fs');
const ResumeVersion = require('../models/ResumeVersion');
const CandidateProfile = require('../models/CandidateProfile');
const Application = require('../models/Application');
const { extractText } = require('./resume.extractor');
const { parseResumeText, PARSER_VERSION } = require('./resume.parser');

/**
 * Upload and parse a resume.
 * 
 * Steps:
 *  1. Determine file type from extension
 *  2. Get current version number for this candidate
 *  3. Create a ResumeVersion record (status: Processing)
 *  4. Extract text from file
 *  5. Parse text into structured JSON
 *  6. Save results back to ResumeVersion
 *  7. Sync parsed data to CandidateProfile
 *  8. If applicationId provided, link resume to Application
 */
exports.uploadAndParse = async (candidateUserId, file, applicationId = null) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (!['pdf', 'docx'].includes(ext)) throw new Error('Only PDF and DOCX files are supported');

  const profile = await CandidateProfile.findOne({ user: candidateUserId });
  if (!profile) throw new Error('Candidate profile not found. Please complete your profile first.');

  // Determine version number
  const latestVersion = await ResumeVersion.findOne({ candidate: candidateUserId })
    .sort({ version: -1 }).select('version');
  const versionNumber = latestVersion ? latestVersion.version + 1 : 1;

  const fileUrl = `/uploads/${file.filename}`;

  // Create record in Processing state
  const resumeRecord = await ResumeVersion.create({
    candidate: candidateUserId,
    candidateProfile: profile._id,
    application: applicationId || undefined,
    fileUrl,
    originalFileName: file.originalname,
    fileType: ext,
    fileSizeBytes: file.size,
    version: versionNumber,
    parsingStatus: 'Processing'
  });

  // Sync basic resume info to CandidateProfile SYNCHRONOUSLY so the frontend knows it was uploaded immediately
  await CandidateProfile.findByIdAndUpdate(profile._id, {
    'resume.uploaded': true,
    'resume.fileUrl': fileUrl,
    'resume.originalFileName': file.originalname,
    'resume.uploadedAt': new Date(),
  });

  // Extract and parse asynchronously (non-blocking parse in background)
  setImmediate(async () => {
    try {
      const fullFilePath = path.join(__dirname, '../uploads', file.filename);
      const rawText = await extractText(fullFilePath, ext);
      const { parsed } = parseResumeText(rawText);

      await ResumeVersion.findByIdAndUpdate(resumeRecord._id, {
        resumeText: rawText,
        parsedResume: parsed,
        parsingStatus: 'Completed',
        parserVersion: PARSER_VERSION,
        parsedAt: new Date(),
        aiReady: true
      });

      // Sync skills and links into CandidateProfile (non-destructive merge)
      await _syncProfileFromResume(profile, parsed);

      // Link to application if provided
      if (applicationId) {
        await Application.findByIdAndUpdate(applicationId, {
          resumeFile: fileUrl,
          resumeOriginalName: file.originalname,
          resumeVersion: String(versionNumber),
          resumeUploadedAt: new Date()
        });
      }

      // Update parsed status
      await CandidateProfile.findByIdAndUpdate(profile._id, {
        'resume.parsed': true,
        'resume.parsedText': rawText.substring(0, 5000),
        'resume.parserVersion': PARSER_VERSION
      });

    } catch (err) {
      await ResumeVersion.findByIdAndUpdate(resumeRecord._id, {
        parsingStatus: 'Failed',
        parsingError: err.message
      });
      console.error('Resume parsing failed:', err.message);
    }
  });

  return resumeRecord;
};

/**
 * Re-trigger parsing for an existing resume version.
 */
exports.reparse = async (resumeVersionId, candidateUserId) => {
  const record = await ResumeVersion.findOne({ _id: resumeVersionId, candidate: candidateUserId });
  if (!record) throw new Error('Resume version not found or unauthorized');

  await record.updateOne({ parsingStatus: 'Processing', parsingError: '' });

  setImmediate(async () => {
    try {
      const fullFilePath = path.join(__dirname, '../uploads', path.basename(record.fileUrl));
      const rawText = await extractText(fullFilePath, record.fileType);
      const { parsed } = parseResumeText(rawText);

      await ResumeVersion.findByIdAndUpdate(record._id, {
        resumeText: rawText,
        parsedResume: parsed,
        parsingStatus: 'Completed',
        parserVersion: PARSER_VERSION,
        parsedAt: new Date(),
        aiReady: true
      });

      const profile = await CandidateProfile.findById(record.candidateProfile);
      if (profile) await _syncProfileFromResume(profile, parsed);
    } catch (err) {
      await ResumeVersion.findByIdAndUpdate(record._id, {
        parsingStatus: 'Failed',
        parsingError: err.message
      });
    }
  });

  return { message: 'Re-parsing started', resumeVersionId };
};

exports.getResumeVersionsByApplication = async (applicationId, candidateUserId) => {
  return await ResumeVersion.find({ application: applicationId, candidate: candidateUserId })
    .sort({ version: -1 });
};

exports.getMyResumeHistory = async (candidateUserId) => {
  return await ResumeVersion.find({ candidate: candidateUserId }).sort({ version: -1 });
};

// ── Private ─────────────────────────────────────────────────────────────────

async function _syncProfileFromResume(profile, parsed) {
  const updateData = {};

  if (parsed.links?.github && !profile.links?.github)    updateData['links.github'] = parsed.links.github;
  if (parsed.links?.linkedin && !profile.links?.linkedin) updateData['links.linkedin'] = parsed.links.linkedin;
  if (parsed.links?.portfolio && !profile.links?.portfolio) updateData['links.portfolio'] = parsed.links.portfolio;
  if (parsed.links?.leetcode && !profile.links?.leetcode)  updateData['links.leetcode'] = parsed.links.leetcode;
  if (parsed.personalInfo?.phone && !profile.phone)        updateData.phone = parsed.personalInfo.phone;
  if (parsed.personalInfo?.location && !profile.location) updateData.location = parsed.personalInfo.location;
  if (parsed.totalYearsExperience && !profile.yearsOfExperience) {
    updateData.yearsOfExperience = parsed.totalYearsExperience;
  }

  if (Object.keys(updateData).length > 0) {
    await CandidateProfile.findByIdAndUpdate(profile._id, { $set: updateData });
  }
}

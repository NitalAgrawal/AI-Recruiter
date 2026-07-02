require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const ResumeVersion = require('../models/ResumeVersion');
const CandidateProfile = require('../models/CandidateProfile');
const { extractText } = require('../services/resume.extractor');
const { parseResumeText, PARSER_VERSION } = require('../services/resume.parser');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ai-recruiter')
  .then(async () => {
    const failed = await ResumeVersion.find({ parsingStatus: { $in: ['Failed', 'Processing'] } });
    console.log(`Found ${failed.length} failed/stuck resumes to re-parse...`);

    for (const record of failed) {
      try {
        console.log(`\nRe-parsing: ${record.originalFileName} (${record._id})`);
        const fullFilePath = path.join(__dirname, '../uploads', path.basename(record.fileUrl));
        
        const rawText = await extractText(fullFilePath, record.fileType);
        console.log(`  ✓ Extracted ${rawText.length} chars`);
        
        const { parsed } = parseResumeText(rawText);
        console.log(`  ✓ Parsed: name="${parsed.personalInfo?.name}", skills=${parsed.skills?.technical?.length}`);
        
        await ResumeVersion.findByIdAndUpdate(record._id, {
          resumeText: rawText,
          parsedResume: parsed,
          parsingStatus: 'Completed',
          parserVersion: PARSER_VERSION,
          parsedAt: new Date(),
          aiReady: true,
          parsingError: ''
        });
        console.log(`  ✓ Saved to DB`);

        // Sync to profile if possible
        if (record.candidateProfile) {
          const profile = await CandidateProfile.findById(record.candidateProfile);
          if (profile) {
            const updateData = {};
            if (parsed.links?.github && !profile.links?.github) updateData['links.github'] = parsed.links.github;
            if (parsed.links?.linkedin && !profile.links?.linkedin) updateData['links.linkedin'] = parsed.links.linkedin;
            if (parsed.personalInfo?.phone && !profile.phone) updateData.phone = parsed.personalInfo.phone;
            if (parsed.personalInfo?.location && !profile.location) updateData.location = parsed.personalInfo.location;
            if (Object.keys(updateData).length > 0) {
              await CandidateProfile.findByIdAndUpdate(profile._id, { $set: updateData });
            }
            await CandidateProfile.findByIdAndUpdate(profile._id, {
              'resume.parsed': true,
              'resume.parsedText': rawText.substring(0, 5000),
              'resume.parserVersion': PARSER_VERSION
            });
            console.log(`  ✓ Profile synced`);
          }
        }
      } catch (err) {
        console.error(`  ✗ Failed to re-parse ${record._id}:`, err.message);
      }
    }

    console.log('\n✅ Done! All failed resumes have been re-parsed.');
    process.exit(0);
  })
  .catch(e => { console.error(e.message); process.exit(1); });

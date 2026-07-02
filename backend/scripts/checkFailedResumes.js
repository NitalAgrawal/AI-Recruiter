require('dotenv').config();
const mongoose = require('mongoose');
const ResumeVersion = require('../models/ResumeVersion');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ai-recruiter')
  .then(async () => {
    const failed = await ResumeVersion.find({ parsingStatus: { $in: ['Failed', 'Processing'] } })
      .select('_id originalFileName parsingStatus parsingError');
    console.log('Failed/Processing resumes:', JSON.stringify(failed, null, 2));
    process.exit(0);
  })
  .catch(e => { console.error(e.message); process.exit(1); });

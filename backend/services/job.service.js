const Job = require('../models/Job');
const RecruiterProfile = require('../models/RecruiterProfile');

exports.createJob = async (userId, jobData) => {
  const profile = await RecruiterProfile.findOne({ user: userId });
  if (!profile) throw new Error('Recruiter profile not found. Please complete your profile first.');

  const job = new Job({
    ...jobData,
    recruiter: userId,
    companyProfile: profile._id
  });

  return await job.save();
};

exports.updateJob = async (jobId, userId, jobData) => {
  const job = await Job.findOne({ _id: jobId, recruiter: userId });
  if (!job) throw new Error('Job not found or unauthorized');

  Object.assign(job, jobData);
  return await job.save();
};

exports.updateJobStatus = async (jobId, userId, status) => {
  const job = await Job.findOne({ _id: jobId, recruiter: userId });
  if (!job) throw new Error('Job not found or unauthorized');

  job.status = status;
  return await job.save();
};

exports.deleteJob = async (jobId, userId) => {
  const job = await Job.findOneAndDelete({ _id: jobId, recruiter: userId });
  if (!job) throw new Error('Job not found or unauthorized');
  return job;
};

exports.cloneJob = async (jobId, userId) => {
  const originalJob = await Job.findOne({ _id: jobId, recruiter: userId }).lean();
  if (!originalJob) throw new Error('Job not found or unauthorized');

  delete originalJob._id;
  delete originalJob.createdAt;
  delete originalJob.updatedAt;
  delete originalJob.__v;
  
  originalJob.title = `${originalJob.title} (Copy)`;
  originalJob.status = 'Draft';
  
  // Reset AI Processing
  originalJob.aiProcessing = {
    status: 'Pending',
    extractedSkills: [],
    extractedKeywords: [],
    embeddingId: '',
    embeddingModel: '',
    lastProcessedAt: null
  };

  const clonedJob = new Job(originalJob);
  return await clonedJob.save();
};

exports.getJobById = async (jobId) => {
  return await Job.findById(jobId).populate('companyProfile', 'companyName companyLogo headquarters industry website');
};

exports.getRecruiterJobs = async (userId) => {
  return await Job.find({ recruiter: userId }).sort({ createdAt: -1 });
};

exports.getPublishedJobs = async (filters = {}) => {
  const query = { status: 'Published', visibility: 'Public', ...filters };
  return await Job.find(query).populate('companyProfile', 'companyName companyLogo headquarters industry').sort({ createdAt: -1 });
};

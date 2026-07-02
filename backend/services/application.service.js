const Application = require('../models/Application');
const Job = require('../models/Job');
const CandidateProfile = require('../models/CandidateProfile');

// ── Candidate ──────────────────────────────────────────────────────────────

exports.applyToJob = async (candidateUserId, jobId, { resumeFile, resumeOriginalName, coverLetter }) => {
  // Validate job exists and is published
  const job = await Job.findById(jobId);
  if (!job) throw new Error('Job not found');
  if (job.status !== 'Published') throw new Error('This job is no longer accepting applications');

  // Ensure candidate has a profile
  const profile = await CandidateProfile.findOne({ user: candidateUserId });
  if (!profile) throw new Error('Please complete your candidate profile before applying');

  // Check for duplicate
  const existing = await Application.findOne({ candidate: candidateUserId, job: jobId });
  if (existing) throw new Error('You have already applied to this job');

  const application = await Application.create({
    candidate: candidateUserId,
    candidateProfile: profile._id,
    job: jobId,
    recruiter: job.recruiter,
    resumeFile: resumeFile || profile.resume?.fileUrl || '',
    resumeOriginalName: resumeOriginalName || profile.resume?.originalFileName || '',
    resumeVersion: '1.0',
    resumeUploadedAt: new Date(),
    coverLetter
  });

  return application;
};

exports.withdrawApplication = async (candidateUserId, applicationId) => {
  const app = await Application.findOne({ _id: applicationId, candidate: candidateUserId });
  if (!app) throw new Error('Application not found or unauthorized');
  if (['Hired', 'Interview Scheduled'].includes(app.status)) {
    throw new Error('Cannot withdraw application at this stage');
  }
  await app.deleteOne();
  return { success: true };
};

exports.getMyApplications = async (candidateUserId) => {
  return await Application.find({ candidate: candidateUserId })
    .populate('job', 'title employmentType workplaceType location status companyProfile')
    .populate({ path: 'job', populate: { path: 'companyProfile', select: 'companyName companyLogo' } })
    .sort({ createdAt: -1 });
};

// ── Recruiter ──────────────────────────────────────────────────────────────

exports.getApplicantsForJob = async (recruiterUserId, jobId) => {
  const job = await Job.findOne({ _id: jobId, recruiter: recruiterUserId });
  if (!job) throw new Error('Job not found or unauthorized');

  return await Application.find({ job: jobId })
    .populate('candidate', 'fullName email avatar')
    .populate('candidateProfile', 'professionalTitle yearsOfExperience technicalSkills currentCompany location resume')
    .sort({ createdAt: -1 });
};

exports.updateStatus = async (recruiterUserId, applicationId, status) => {
  const app = await Application.findById(applicationId).populate('job');
  if (!app) throw new Error('Application not found');
  if (String(app.job.recruiter) !== String(recruiterUserId)) throw new Error('Unauthorized');

  app.status = status;
  return await app.save();
};

exports.addNotes = async (recruiterUserId, applicationId, notes) => {
  const app = await Application.findById(applicationId).populate('job');
  if (!app) throw new Error('Application not found');
  if (String(app.job.recruiter) !== String(recruiterUserId)) throw new Error('Unauthorized');

  app.notes = notes;
  return await app.save();
};

// ── Admin ──────────────────────────────────────────────────────────────────

exports.getAllApplications = async () => {
  return await Application.find()
    .populate('candidate', 'fullName email')
    .populate('job', 'title')
    .sort({ createdAt: -1 });
};

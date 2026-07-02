import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UploadCloud, Send, FileText, CheckCircle2 } from 'lucide-react'
import api from '../services/api'
import Button from '../design-system/Button'
import { Heading4, Body } from '../design-system/Typography'
import Card from '../design-system/Card'

export default function ApplyModal({ job, onClose, onSuccess }) {
  const [coverLetter, setCoverLetter] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedResumeUrl, setUploadedResumeUrl] = useState('')
  const [uploadedName, setUploadedName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setResumeFile(file)
    setIsUploading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      if (res.data.success) {
        setUploadedResumeUrl(res.data.fileUrl)
        setUploadedName(res.data.originalFileName)
      }
    } catch {
      setError('Resume upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError('')
    try {
      const res = await api.post(`/applications/apply/${job._id}`, {
        resumeFile: uploadedResumeUrl,
        resumeOriginalName: uploadedName,
        coverLetter,
      })
      if (res.data.success) {
        onSuccess?.()
        onClose()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-primary/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl z-10"
      >
        <Card padding={false} goldBorder className="shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-white/[0.06] flex items-start justify-between bg-black/20">
            <div>
              <Heading4>Apply for Position</Heading4>
              <p className="text-sm text-text-secondary mt-1 font-medium">
                {job.title}
                {job.companyProfile?.companyName && (
                  <span className="text-text-muted"> · {job.companyProfile.companyName}</span>
                )}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/[0.05] text-text-muted hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Resume Upload */}
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">
                Resume (PDF)
              </label>
              <label className="block w-full cursor-pointer">
                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${uploadedResumeUrl ? 'border-success/50 bg-success/5' : 'border-white/15 bg-black/20 hover:border-gold/50 hover:bg-black/40'}`}>
                  {uploadedResumeUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 size={24} className="text-success" />
                      <p className="text-sm font-bold text-white truncate max-w-xs">{uploadedName}</p>
                      <p className="text-xs text-success">Uploaded successfully</p>
                    </div>
                  ) : isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-text-muted">Uploading…</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <UploadCloud size={28} className="text-text-muted" />
                      <p className="text-sm font-semibold text-white">Click to upload your resume</p>
                      <p className="text-xs text-text-muted">PDF up to 10MB</p>
                    </div>
                  )}
                </div>
                <input type="file" accept="application/pdf" className="hidden" onChange={handleFileSelect} />
              </label>
            </div>

            {/* Cover Letter */}
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">
                Cover Letter <span className="text-text-muted normal-case font-medium">(Optional)</span>
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={5}
                placeholder="Tell the recruiter why you're a great fit for this role…"
                className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-gold/50 resize-none transition-colors"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger font-medium">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/[0.06] bg-black/20 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              leftIcon={<Send size={16} />}
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={isUploading}
              className="shadow-gold"
            >
              Submit Application
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

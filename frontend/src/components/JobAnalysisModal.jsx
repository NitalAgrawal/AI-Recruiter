import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Zap, RefreshCw, CheckCircle2, AlertCircle, Sparkles, 
  ChevronDown, ChevronUp, Code2, Briefcase, FileSearch, Lightbulb
} from 'lucide-react'
import api from '../services/api'
import { Heading4 } from '../design-system/Typography'
import Button from '../design-system/Button'

function ParsedSection({ title, icon: Icon, color = 'text-gold', children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-white/[0.06] rounded-xl overflow-hidden mb-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-4 bg-black/20 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center`}>
            <Icon size={16} className={color} />
          </div>
          <span className="font-bold text-white">{title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-white/[0.04] bg-black/10">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Chip({ label, color = 'bg-white/[0.06] border-white/10 text-text-secondary' }) {
  return <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold inline-block ${color}`}>{label}</span>
}

export default function JobAnalysisModal({ job, onClose }) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pollingId, setPollingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAnalysis()
    return () => { if (pollingId) clearInterval(pollingId) }
  }, [job._id])

  const fetchAnalysis = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/jobs/${job._id}/analysis`)
      if (res.data.success && res.data.analysis) {
        setAnalysis(res.data.analysis)
        if (res.data.analysis.status === 'Processing') {
          startPolling()
        }
      } else {
        setAnalysis({ status: 'Pending' }) // Default state if none exists
      }
    } catch (err) {
      setError('Failed to fetch analysis')
    } finally {
      setLoading(false)
    }
  }

  const startPolling = () => {
    if (pollingId) return
    const id = setInterval(async () => {
      try {
        const res = await api.get(`/jobs/${job._id}/analysis`)
        if (res.data.success && res.data.analysis) {
          if (res.data.analysis.status !== 'Processing') {
            clearInterval(id)
            setPollingId(null)
            setAnalysis(res.data.analysis)
          }
        }
      } catch (err) {
        clearInterval(id)
        setPollingId(null)
      }
    }, 3000)
    setPollingId(id)
  }

  const handleAnalyze = async () => {
    try {
      setAnalysis(prev => ({ ...prev, status: 'Processing' }))
      await api.post(`/jobs/${job._id}/analyze`)
      startPolling()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start analysis')
      setAnalysis(prev => ({ ...prev, status: 'Failed' }))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl max-h-[90vh] bg-surface border border-white/[0.05] shadow-2xl rounded-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Sparkles size={20} className="text-gold" />
            </div>
            <div>
              <Heading4>AI Job Understanding</Heading4>
              <p className="text-xs text-text-muted mt-0.5">{job.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {analysis?.status === 'Completed' && analysis.confidence?.overall && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20 text-success text-xs font-bold">
                <CheckCircle2 size={14} /> {analysis.confidence.overall}% Confidence
              </div>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-text-muted transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted">
              <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mb-4" />
              <p>Loading AI Analysis...</p>
            </div>
          ) : !analysis || analysis.status === 'Pending' ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-gold/5 flex items-center justify-center mb-6">
                <Zap size={32} className="text-gold" />
              </div>
              <Heading4 className="mb-2">Understand this Job with AI</Heading4>
              <p className="text-sm text-text-secondary max-w-md mx-auto mb-8">
                Use Google Gemini to extract structured metadata, skills, missing requirements, and interview topics to improve semantic matching.
              </p>
              <Button leftIcon={<Sparkles size={16} />} onClick={handleAnalyze} className="shadow-gold">
                Analyze with AI
              </Button>
            </div>
          ) : analysis.status === 'Processing' ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mb-6" />
              <Heading4 className="mb-2">AI is analyzing the job...</Heading4>
              <p className="text-sm text-text-secondary">Extracting skills, domains, and generating interview topics.</p>
            </div>
          ) : analysis.status === 'Failed' ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle size={40} className="text-danger mb-4" />
              <Heading4 className="mb-2 text-danger">Analysis Failed</Heading4>
              <p className="text-sm text-text-secondary mb-6">{error || 'An unexpected error occurred.'}</p>
              <Button variant="outline" leftIcon={<RefreshCw size={16} />} onClick={handleAnalyze}>Try Again</Button>
            </div>
          ) : analysis.status === 'Completed' && analysis.normalizedData ? (
            <div className="space-y-2 animate-fade-in">
              {/* Summary */}
              {analysis.summary && (
                <ParsedSection title="AI Summary" icon={Lightbulb} color="text-gold">
                  <p className="text-sm text-white leading-relaxed">{analysis.summary}</p>
                  <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/[0.04]">
                    {analysis.normalizedData.seniority && (
                      <div><span className="text-[10px] text-text-muted uppercase font-bold block mb-1">Seniority</span><span className="text-sm text-white font-medium">{analysis.normalizedData.seniority}</span></div>
                    )}
                    {analysis.normalizedData.jobDomain && (
                      <div><span className="text-[10px] text-text-muted uppercase font-bold block mb-1">Domain</span><span className="text-sm text-white font-medium">{analysis.normalizedData.jobDomain}</span></div>
                    )}
                    {analysis.normalizedData.experienceLevel && (
                      <div><span className="text-[10px] text-text-muted uppercase font-bold block mb-1">Experience</span><span className="text-sm text-white font-medium">{analysis.normalizedData.experienceLevel}</span></div>
                    )}
                  </div>
                </ParsedSection>
              )}

              {/* Skills */}
              {(analysis.normalizedData.requiredSkills?.length > 0 || analysis.normalizedData.niceToHaveSkills?.length > 0) && (
                <ParsedSection title="Skill Extraction" icon={Code2} color="text-info">
                  {analysis.normalizedData.requiredSkills?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Required / Must Have</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.normalizedData.requiredSkills.map((s, i) => <Chip key={i} label={s} color="bg-info/10 border-info/20 text-info" />)}
                      </div>
                    </div>
                  )}
                  {analysis.normalizedData.niceToHaveSkills?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Nice to Have</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.normalizedData.niceToHaveSkills.map((s, i) => <Chip key={i} label={s} />)}
                      </div>
                    </div>
                  )}
                </ParsedSection>
              )}

              {/* Interview Topics */}
              {analysis.normalizedData.recommendedInterviewTopics?.length > 0 && (
                <ParsedSection title="Suggested Interview Topics" icon={Briefcase} color="text-purple-400">
                  <ul className="space-y-2">
                    {analysis.normalizedData.recommendedInterviewTopics.map((topic, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white">
                        <span className="text-purple-400 mt-0.5">•</span> {topic}
                      </li>
                    ))}
                  </ul>
                </ParsedSection>
              )}

              {/* Missing Information */}
              {analysis.normalizedData.missingInformation?.length > 0 && (
                <ParsedSection title="Missing Information" icon={FileSearch} color="text-warning">
                  <p className="text-xs text-text-muted mb-3">The AI noticed these details are missing from the description and might improve clarity:</p>
                  <ul className="space-y-2">
                    {analysis.normalizedData.missingInformation.map((info, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white">
                        <span className="text-warning mt-0.5">•</span> {info}
                      </li>
                    ))}
                  </ul>
                </ParsedSection>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.05] bg-black/20 flex justify-between items-center">
          <div className="text-xs text-text-muted flex items-center gap-2">
            {analysis?.model && <span>Model: <span className="font-semibold text-text-secondary">{analysis.model}</span></span>}
            {analysis?.promptVersion && <span>Prompt: <span className="font-semibold text-text-secondary">{analysis.promptVersion}</span></span>}
          </div>
          {analysis?.status === 'Completed' && (
            <Button size="sm" variant="outline" leftIcon={<RefreshCw size={14} />} onClick={handleAnalyze}>
              Re-analyze
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

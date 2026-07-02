import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  X, RefreshCw, CheckCircle2, AlertCircle, Cpu, Zap
} from 'lucide-react'
import api from '../services/api'
import { Heading4 } from '../design-system/Typography'
import Button from '../design-system/Button'

// ── Progress Ring ────────────────────────────────────────────────────────────
function ProgressRing({ radius, stroke, progress, colorClass = "text-gold", label }) {
  const normalizedRadius = radius - stroke * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
        <circle
          stroke="currentColor" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius}
          className="text-white/10"
        />
        <circle
          stroke="currentColor" fill="transparent" strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }} strokeLinecap="round" r={normalizedRadius} cx={radius} cy={radius}
          className={`${colorClass} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-3xl font-black">{progress}</span>
        <span className="text-[10px] text-text-muted font-bold tracking-widest uppercase">{label}</span>
      </div>
    </div>
  )
}

function ScoreBar({ label, score, colorClass = "bg-gold" }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-end mb-1.5">
        <span className="text-xs font-bold text-white uppercase tracking-wider">{label}</span>
        <span className="text-xs font-bold text-text-secondary">{score}%</span>
      </div>
      <div className="w-full bg-white/[0.04] rounded-full h-2 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          className={`h-full rounded-full ${colorClass}`}
        />
      </div>
    </div>
  )
}

function Chip({ label, color = 'bg-white/[0.06] border-white/10 text-text-secondary' }) {
  return <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold inline-block ${color} mb-1 mr-1`}>{label}</span>
}

export default function SemanticMatchModal({ application, onClose }) {
  const [matchData, setMatchData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pollingId, setPollingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMatch()
    return () => { if (pollingId) clearInterval(pollingId) }
  }, [application._id])

  const fetchMatch = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/applications/${application._id}/match`)
      if (res.data.success && res.data.match) {
        setMatchData(res.data.match)
        if (res.data.match.aiStatus === 'Processing') startPolling()
      } else {
        setMatchData({ aiStatus: 'Pending' })
      }
    } catch (err) {
      setError('Failed to fetch match data')
    } finally {
      setLoading(false)
    }
  }

  const startPolling = () => {
    if (pollingId) return
    const id = setInterval(async () => {
      try {
        const res = await api.get(`/applications/${application._id}/match`)
        if (res.data.success && res.data.match) {
          if (res.data.match.aiStatus !== 'Processing') {
            clearInterval(id)
            setPollingId(null)
            setMatchData(res.data.match)
          }
        }
      } catch (err) {
        clearInterval(id)
        setPollingId(null)
      }
    }, 3000)
    setPollingId(id)
  }

  const handleRunMatch = async () => {
    try {
      setMatchData(prev => ({ ...prev, aiStatus: 'Processing' }))
      await api.post(`/applications/${application._id}/match`)
      startPolling()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start matching')
      setMatchData(prev => ({ ...prev, aiStatus: 'Failed' }))
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
        className="relative w-full max-w-4xl max-h-[90vh] bg-surface border border-white/[0.05] shadow-2xl rounded-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Cpu size={20} className="text-primary" />
            </div>
            <div>
              <Heading4>Semantic Vector Match</Heading4>
              <p className="text-xs text-text-muted mt-0.5">Candidate: {application.candidate?.fullName || 'Applicant'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {matchData?.aiStatus === 'Completed' && matchData.confidence?.overall && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20 text-success text-xs font-bold">
                <CheckCircle2 size={14} /> {matchData.confidence.overall}% Confidence
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
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p>Loading Match Data...</p>
            </div>
          ) : !matchData || matchData.aiStatus === 'Pending' ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                <Zap size={32} className="text-primary" />
              </div>
              <Heading4 className="mb-2">Run Semantic Matching</Heading4>
              <p className="text-sm text-text-secondary max-w-md mx-auto mb-8">
                Use advanced vector embeddings to mathematically compare the candidate's parsed resume against the AI-analyzed Job Description.
              </p>
              <Button leftIcon={<Cpu size={16} />} onClick={handleRunMatch} className="bg-primary hover:bg-primary-dark text-black font-bold">
                Run Semantic Match
              </Button>
            </div>
          ) : matchData.aiStatus === 'Processing' ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6" />
              <Heading4 className="mb-2">Calculating Vectors...</Heading4>
              <p className="text-sm text-text-secondary">Generating embeddings and computing cosine similarities.</p>
            </div>
          ) : matchData.aiStatus === 'Failed' ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle size={40} className="text-danger mb-4" />
              <Heading4 className="mb-2 text-danger">Match Failed</Heading4>
              <p className="text-sm text-text-secondary mb-6">{error || 'An unexpected error occurred.'}</p>
              <Button variant="outline" leftIcon={<RefreshCw size={16} />} onClick={handleRunMatch}>Try Again</Button>
            </div>
          ) : matchData.aiStatus === 'Completed' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
              {/* Left Column: Overall Score & Breakdowns */}
              <div className="lg:col-span-1 border-r border-white/[0.04] pr-8">
                <div className="flex justify-center mb-8">
                  <ProgressRing radius={70} stroke={10} progress={matchData.semanticScore || 0} label="Match" colorClass="text-primary" />
                </div>
                
                <h5 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 border-b border-white/[0.04] pb-2">Breakdown</h5>
                <ScoreBar label="Technical (40%)" score={matchData.technicalSkillScore || 0} colorClass="bg-info" />
                <ScoreBar label="Experience (20%)" score={matchData.experienceScore || 0} colorClass="bg-gold" />
                <ScoreBar label="Projects (15%)" score={matchData.projectScore || 0} colorClass="bg-success" />
                <ScoreBar label="Education (10%)" score={matchData.educationScore || 0} colorClass="bg-purple-400" />
                <ScoreBar label="Soft Skills (10%)" score={matchData.softSkillScore || 0} colorClass="bg-warning" />
              </div>

              {/* Right Column: Skill Analysis */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h5 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Exact Skill Matches</h5>
                  {matchData.matchedSkills?.length > 0 ? (
                    matchData.matchedSkills.map((s, i) => <Chip key={i} label={s} color="bg-success/10 border-success/20 text-success" />)
                  ) : <p className="text-sm text-text-secondary">No exact matches found.</p>}
                </div>

                <div>
                  <h5 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Related Skills (Semantic Equivalents)</h5>
                  {matchData.relatedSkills?.length > 0 ? (
                    matchData.relatedSkills.map((s, i) => <Chip key={i} label={s} color="bg-info/10 border-info/20 text-info" />)
                  ) : <p className="text-sm text-text-secondary">No semantic equivalents identified.</p>}
                </div>

                <div>
                  <h5 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Missing Requirements</h5>
                  {matchData.missingSkills?.length > 0 ? (
                    matchData.missingSkills.map((s, i) => <Chip key={i} label={s} color="bg-danger/10 border-danger/20 text-danger" />)
                  ) : <p className="text-sm text-success font-semibold">Candidate meets all skill requirements!</p>}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.05] bg-black/20 flex justify-between items-center">
          <div className="text-[10px] text-text-muted flex items-center gap-3">
            {matchData?.matchingMetadata?.embeddingModel && <span>Model: <span className="font-semibold text-text-secondary">{matchData.matchingMetadata.embeddingModel}</span></span>}
            {matchData?.matchingMetadata?.similarityAlgorithm && <span>Alg: <span className="font-semibold text-text-secondary">{matchData.matchingMetadata.similarityAlgorithm}</span></span>}
            {matchData?.matchingMetadata?.processedAt && <span>Parsed: <span className="font-semibold text-text-secondary">{new Date(matchData.matchingMetadata.processedAt).toLocaleString()}</span></span>}
          </div>
          {matchData?.aiStatus === 'Completed' && (
            <Button size="sm" variant="outline" leftIcon={<RefreshCw size={14} />} onClick={handleRunMatch}>
              Re-Run Match
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

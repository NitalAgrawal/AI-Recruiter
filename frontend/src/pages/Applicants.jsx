import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Download, FileText, User, MapPin, Briefcase,
  Clock, ChevronDown, CheckCircle2, StickyNote, Cpu, MessageSquare, Trophy
} from 'lucide-react'
import api from '../services/api'
import { Heading3, Heading4, Label } from '../design-system/Typography'
import Card from '../design-system/Card'
import Button from '../design-system/Button'
import SemanticMatchModal from '../components/SemanticMatchModal'

const STATUSES = ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Rejected', 'Hired']

const STATUS_CONFIG = {
  'Applied':              { text: 'text-info',    bg: 'bg-info/10',    border: 'border-info/20' },
  'Under Review':         { text: 'text-warning',  bg: 'bg-warning/10', border: 'border-warning/20' },
  'Shortlisted':          { text: 'text-gold',     bg: 'bg-gold/10',    border: 'border-gold/20' },
  'Interview Scheduled':  { text: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
  'Rejected':             { text: 'text-danger',   bg: 'bg-danger/10',  border: 'border-danger/20' },
  'Hired':                { text: 'text-success',  bg: 'bg-success/10', border: 'border-success/20' },
}

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || { text: 'text-text-muted', bg: 'bg-white/5', border: 'border-white/10' }
  return (
    <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${c.bg} ${c.border} ${c.text}`}>
      {status}
    </span>
  )
}

function ApplicantRow({ app, onStatusChange, onNoteSave, onOpenSemanticMatch }) {
  const [status, setStatus] = useState(app.status)
  const [notes, setNotes] = useState(app.notes || '')
  const [showNotes, setShowNotes] = useState(false)
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const profile = app.candidateProfile || {}
  const candidate = app.candidate || {}

  const handleStatusChange = async (newStatus) => {
    setIsUpdatingStatus(true)
    try {
      await onStatusChange(app._id, newStatus)
      setStatus(newStatus)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleSaveNote = async () => {
    setIsSavingNote(true)
    try {
      await onNoteSave(app._id, notes)
    } finally {
      setIsSavingNote(false)
    }
  }

  const resumeUrl = app.resumeFile
    ? `http://localhost:5000${app.resumeFile}`
    : (profile.resume?.fileUrl ? `http://localhost:5000${profile.resume.fileUrl}` : null)

  return (
    <Card hover={false} className="!p-0 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 text-lg font-black text-white">
            {candidate.fullName?.[0] || 'U'}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="font-bold text-white">{candidate.fullName || 'Candidate'}</p>
                <p className="text-xs text-text-secondary mt-0.5">{candidate.email}</p>
              </div>
              <StatusBadge status={status} />
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-2 text-xs text-text-muted font-medium">
              {profile.professionalTitle && <span className="flex items-center gap-1.5"><Briefcase size={12} /> {profile.professionalTitle}</span>}
              {profile.location && <span className="flex items-center gap-1.5"><MapPin size={12} /> {profile.location}</span>}
              {profile.yearsOfExperience > 0 && <span className="flex items-center gap-1.5"><Clock size={12} /> {profile.yearsOfExperience} yrs exp</span>}
            </div>

            {/* Skills preview */}
            {profile.technicalSkills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {profile.technicalSkills.slice(0, 5).map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] text-text-secondary">
                    {s.name || s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center gap-2 px-5 py-3 border-t border-white/[0.04] bg-black/20 flex-wrap">
        {/* Status Dropdown */}
        <div className="relative">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isUpdatingStatus}
            className="appearance-none pl-3 pr-8 py-1.5 text-xs font-bold bg-white/[0.04] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-gold/50 cursor-pointer disabled:opacity-50 transition-colors"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        </div>

        {resumeUrl && (
          <a
            href={resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-bold text-white hover:bg-white/[0.08] transition-colors"
          >
            <Download size={13} /> Resume
          </a>
        )}

        <button
          onClick={() => setShowNotes(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${showNotes ? 'bg-gold/10 border-gold/30 text-gold' : 'bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.08]'}`}
        >
          <StickyNote size={13} /> {notes ? 'View Note' : 'Add Note'}
        </button>

        <button 
          onClick={() => onOpenSemanticMatch?.(app)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/10 text-xs font-bold text-primary hover:bg-primary/20 transition-colors shadow-glow-primary"
        >
          <Cpu size={13} /> Semantic Match
        </button>

        <span className="ml-auto text-xs text-text-muted">
          Applied {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      {/* Notes Panel */}
      {showNotes && (
        <div className="px-5 pb-5 pt-4 border-t border-white/[0.04] bg-black/10 space-y-3">
          <Label className="block">Internal Notes (Candidate cannot see this)</Label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this candidate…"
            className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-gold/50 resize-none transition-colors"
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSaveNote} loading={isSavingNote} leftIcon={<CheckCircle2 size={14} />}>
              Save Note
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

export default function Applicants() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [job, setJob] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('All')

  useEffect(() => {
    fetchData()
  }, [jobId])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [appRes, jobRes] = await Promise.all([
        api.get(`/applications/job/${jobId}`),
        api.get(`/jobs/${jobId}`)
      ])
      if (appRes.data.success) setApplications(appRes.data.applications)
      if (jobRes.data.success) setJob(jobRes.data.job)
    } catch (err) {
      console.error('Failed to fetch applicants', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (appId, newStatus) => {
    await api.patch(`/applications/${appId}/status`, { status: newStatus })
  }

  const handleNoteSave = async (appId, notes) => {
    await api.patch(`/applications/${appId}/notes`, { notes })
  }

  const filtered = filterStatus === 'All'
    ? applications
    : applications.filter(a => a.status === filterStatus)

  const stats = STATUSES.map(s => ({ status: s, count: applications.filter(a => a.status === s).length }))

  return (
    <div className="space-y-8 animate-page-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate('/jobs')} className="p-2 mt-1 hover:bg-white/5 rounded-full transition-colors text-text-muted hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <Heading3>{job?.title || 'Applicants'}</Heading3>
            <p className="text-sm text-text-secondary mt-1">{applications.length} total applications</p>
          </div>
        </div>
        <Button 
          onClick={() => navigate(`/jobs/${jobId}/ranking`)}
          leftIcon={<Trophy size={16} />}
          className="shadow-glow-gold bg-gold hover:bg-gold-dark text-black font-bold"
        >
          AI Ranking Dashboard
        </Button>
      </div>

      {/* Status Filter Chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStatus('All')}
          className={`px-4 py-1.5 rounded-full border text-sm font-bold transition-colors ${filterStatus === 'All' ? 'bg-white/10 border-white/20 text-white' : 'border-white/[0.08] text-text-muted hover:text-white hover:border-white/20'}`}
        >
          All <span className="ml-1 text-xs opacity-70">{applications.length}</span>
        </button>
        {stats.filter(s => s.count > 0).map(({ status, count }) => {
          const c = STATUS_CONFIG[status] || {}
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-1.5 rounded-full border text-sm font-bold transition-colors ${filterStatus === status ? `${c.bg} ${c.border} ${c.text}` : 'border-white/[0.08] text-text-muted hover:text-white hover:border-white/20'}`}
            >
              {status} <span className="ml-1 text-xs opacity-70">{count}</span>
            </button>
          )
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
            <User size={28} className="text-text-muted" />
          </div>
          <p className="text-lg font-bold text-white">No applicants yet</p>
          <p className="text-sm text-text-muted">Applications will appear here once candidates start applying.</p>
        </div>
      ) : (
        <motion.div
          initial="hidden" animate="show"
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          className="space-y-4"
        >
          {filtered.map(app => (
            <motion.div
              key={app._id}
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            >
              <ApplicantRow
                app={app}
                onStatusChange={handleStatusChange}
                onNoteSave={handleNoteSave}
                onOpenSemanticMatch={setSemanticMatchApp}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {semanticMatchApp && (
        <SemanticMatchModal 
          application={semanticMatchApp} 
          onClose={() => setSemanticMatchApp(null)} 
        />
      )}
    </div>
  )
}

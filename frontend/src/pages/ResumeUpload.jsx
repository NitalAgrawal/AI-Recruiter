import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import {
  UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw,
  ChevronDown, ChevronUp, User, Code2, Briefcase, GraduationCap,
  FolderOpen, Award, Link2, Clock, History, Download, Zap
} from 'lucide-react'
import api, { BACKEND_URL } from '../services/api'
import { Heading3, Heading4, Label } from '../design-system/Typography'
import Card from '../design-system/Card'
import Button from '../design-system/Button'

// ── Collapsible Section ──────────────────────────────────────────────────────
function ParsedSection({ title, icon: Icon, color = 'text-gold', children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-white/[0.06] rounded-xl overflow-hidden">
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

// ── Chip ────────────────────────────────────────────────────────────────────
function Chip({ label, color = 'bg-white/[0.06] border-white/10 text-text-secondary' }) {
  return (
    <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${color}`}>{label}</span>
  )
}

// ── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const config = {
    Pending:    { color: 'text-text-muted bg-white/5 border-white/10', icon: Clock, label: 'Pending' },
    Processing: { color: 'text-gold bg-gold/10 border-gold/20', icon: RefreshCw, label: 'Processing…' },
    Completed:  { color: 'text-success bg-success/10 border-success/20', icon: CheckCircle2, label: 'Parsed' },
    Failed:     { color: 'text-danger bg-danger/10 border-danger/20', icon: AlertCircle, label: 'Failed' },
  }
  const c = config[status] || config.Pending
  const Icon = c.icon
  return (
    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${c.color}`}>
      <Icon size={12} className={status === 'Processing' ? 'animate-spin' : ''} />
      {c.label}
    </span>
  )
}

// ── Parsed Preview ────────────────────────────────────────────────────────────
function ParsedPreview({ parsed }) {
  if (!parsed) return null
  const { personalInfo, skills, experience, education, projects, certifications, links, totalYearsExperience } = parsed

  return (
    <div className="space-y-3">
      {personalInfo && (personalInfo.name || personalInfo.email) && (
        <ParsedSection title="Personal Information" icon={User} color="text-gold">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Name', value: personalInfo.name },
              { label: 'Email', value: personalInfo.email },
              { label: 'Phone', value: personalInfo.phone },
              { label: 'Location', value: personalInfo.location },
            ].filter(f => f.value).map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-sm text-white font-medium">{value}</p>
              </div>
            ))}
          </div>
        </ParsedSection>
      )}

      {skills && (skills.technical?.length > 0 || skills.soft?.length > 0) && (
        <ParsedSection title="Skills" icon={Code2} color="text-info">
          {skills.technical?.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Technical</p>
              <div className="flex flex-wrap gap-1.5">
                {skills.technical.map((s, i) => <Chip key={i} label={s} color="bg-info/10 border-info/20 text-info" />)}
              </div>
            </div>
          )}
          {skills.soft?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Soft Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {skills.soft.map((s, i) => <Chip key={i} label={s} />)}
              </div>
            </div>
          )}
        </ParsedSection>
      )}

      {experience?.length > 0 && (
        <ParsedSection title={`Experience (${totalYearsExperience || '?'} yrs estimated)`} icon={Briefcase} color="text-gold">
          <div className="space-y-4">
            {experience.map((exp, i) => (
              <div key={i} className="border-l-2 border-gold/30 pl-4">
                <p className="font-bold text-white text-sm">{exp.position || 'Position'}</p>
                <p className="text-xs text-gold font-semibold mt-0.5">{exp.company}</p>
                {(exp.startDate || exp.endDate) && (
                  <p className="text-xs text-text-muted mt-0.5">{exp.startDate} – {exp.endDate}</p>
                )}
                {exp.description && <p className="text-xs text-text-secondary mt-1 leading-relaxed line-clamp-2">{exp.description}</p>}
              </div>
            ))}
          </div>
        </ParsedSection>
      )}

      {education?.length > 0 && (
        <ParsedSection title="Education" icon={GraduationCap} color="text-purple-400" defaultOpen={false}>
          <div className="space-y-3">
            {education.map((edu, i) => (
              <div key={i} className="border-l-2 border-purple-400/30 pl-4">
                <p className="font-bold text-white text-sm">{edu.degree}</p>
                <p className="text-xs text-purple-400 font-semibold">{edu.institution}</p>
                <div className="flex gap-3 text-xs text-text-muted mt-0.5">
                  {edu.graduationYear && <span>Grad: {edu.graduationYear}</span>}
                  {edu.cgpa && <span>CGPA: {edu.cgpa}</span>}
                </div>
              </div>
            ))}
          </div>
        </ParsedSection>
      )}

      {projects?.length > 0 && (
        <ParsedSection title="Projects" icon={FolderOpen} color="text-success" defaultOpen={false}>
          <div className="space-y-4">
            {projects.map((proj, i) => (
              <div key={i}>
                <p className="font-bold text-white text-sm">{proj.title}</p>
                {proj.description && <p className="text-xs text-text-secondary mt-1 leading-relaxed line-clamp-2">{proj.description}</p>}
                {proj.technologies?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {proj.technologies.map((t, j) => <Chip key={j} label={t} color="bg-success/10 border-success/20 text-success" />)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ParsedSection>
      )}

      {certifications?.length > 0 && (
        <ParsedSection title="Certifications" icon={Award} color="text-warning" defaultOpen={false}>
          <div className="space-y-2">
            {certifications.map((cert, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-warning mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-white">{cert.name}</p>
                  {cert.organization && <p className="text-xs text-warning">{cert.organization}</p>}
                </div>
              </div>
            ))}
          </div>
        </ParsedSection>
      )}

      {links && Object.values(links).some(Boolean) && (
        <ParsedSection title="Links" icon={Link2} color="text-text-secondary" defaultOpen={false}>
          <div className="space-y-2">
            {Object.entries(links).filter(([, v]) => v).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted w-20 capitalize">{key}</span>
                <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noreferrer"
                  className="text-xs text-gold hover:underline truncate">{value}</a>
              </div>
            ))}
          </div>
        </ParsedSection>
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ResumeUpload() {
  const [history, setHistory] = useState([])
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [pollingId, setPollingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchHistory()
    return () => { if (pollingId) clearInterval(pollingId) }
  }, [])

  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true)
      const res = await api.get('/resume/history')
      if (res.data.success) {
        setHistory(res.data.history)
        if (res.data.history.length > 0 && !selectedVersion) {
          setSelectedVersion(res.data.history[0])
        }
      }
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Poll for parsing completion
  const startPolling = (resumeId) => {
    const id = setInterval(async () => {
      try {
        const res = await api.get('/resume/history')
        if (res.data.success) {
          const updated = res.data.history.find(r => r._id === resumeId)
          if (updated && updated.parsingStatus !== 'Processing') {
            clearInterval(id)
            setHistory(res.data.history)
            setSelectedVersion(updated)
          }
        }
      } catch { clearInterval(id) }
    }, 2000)
    setPollingId(id)
  }

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    setError('')
    setIsUploading(true)
    setUploadProgress(0)

    const form = new FormData()
    form.append('file', file)

    try {
      const res = await api.post('/resume/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          setUploadProgress(Math.round((e.loaded * 100) / e.total))
        }
      })
      if (res.data.success) {
        const newRecord = res.data.resume
        setHistory(prev => [newRecord, ...prev])
        setSelectedVersion(newRecord)
        startPolling(newRecord._id)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false
  })

  const handleReparse = async (id) => {
    try {
      await api.post(`/resume/${id}/reparse`)
      setHistory(prev => prev.map(r => r._id === id ? { ...r, parsingStatus: 'Processing' } : r))
      if (selectedVersion?._id === id) setSelectedVersion(v => ({ ...v, parsingStatus: 'Processing' }))
      startPolling(id)
    } catch (err) {
      alert('Re-parse failed')
    }
  }

  return (
    <div className="space-y-8 animate-page-in max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div>
        <Heading3>Resume Manager</Heading3>
        <p className="text-sm text-text-secondary mt-1">Upload your resume and let AI extract your profile data automatically.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Left: Upload + History */}
        <div className="xl:col-span-2 space-y-6">
          {/* Dropzone */}
          <Card hover={false} className="!p-0 overflow-hidden">
            <div
              {...getRootProps()}
              className={`p-8 text-center cursor-pointer transition-all ${isDragActive ? 'bg-gold/5 border-gold/50' : 'hover:bg-white/[0.01]'}`}
            >
              <input {...getInputProps()} />
              <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-colors ${isDragActive ? 'bg-gold/20 border-gold/40' : 'bg-white/[0.04] border-white/[0.08]'} border`}>
                <UploadCloud size={28} className={isDragActive ? 'text-gold' : 'text-text-muted'} />
              </div>
              {isUploading ? (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-white">Uploading…</p>
                  <div className="w-full bg-black/40 rounded-full h-2 border border-white/[0.04]">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-gold-dark to-gold"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-muted">{uploadProgress}%</p>
                </div>
              ) : (
                <>
                  <p className="text-base font-bold text-white mb-1">
                    {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
                  </p>
                  <p className="text-sm text-text-muted mb-4">or click to browse — PDF or DOCX, up to 10MB</p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-bold">
                    <Zap size={14} fill="currentColor" /> AI Parsing Enabled
                  </div>
                </>
              )}
            </div>
            {error && (
              <div className="px-6 py-3 border-t border-danger/20 bg-danger/5 text-sm text-danger font-medium flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}
          </Card>

          {/* Version History */}
          <Card hover={false}>
            <div className="flex items-center gap-3 mb-4">
              <History size={18} className="text-gold" />
              <Heading4>Version History</Heading4>
            </div>
            {isLoadingHistory ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">No resumes uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {history.map(v => (
                  <button
                    key={v._id}
                    onClick={() => setSelectedVersion(v)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedVersion?._id === v._id ? 'bg-gold/5 border-gold/20' : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04] hover:border-white/10'}`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{v.originalFileName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-text-muted">v{v.version}</span>
                        <span className="text-[10px] text-text-muted">·</span>
                        <span className="text-[10px] text-text-muted">{new Date(v.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <StatusBadge status={v.parsingStatus} />
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right: Parsed Preview */}
        <div className="xl:col-span-3 space-y-4">
          {!selectedVersion ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                <FileText size={36} className="text-text-muted" />
              </div>
              <p className="text-lg font-bold text-white mb-2">No resume selected</p>
              <p className="text-sm text-text-muted">Upload a resume to see the AI-parsed data.</p>
            </div>
          ) : (
            <>
              {/* Resume Header */}
              <Card hover={false} className="!p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <FileText size={20} className="text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{selectedVersion.originalFileName}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <StatusBadge status={selectedVersion.parsingStatus} />
                    <span className="text-xs text-text-muted">Version {selectedVersion.version}</span>
                    {selectedVersion.parserVersion && <span className="text-xs text-text-muted">Parser v{selectedVersion.parserVersion}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`${BACKEND_URL}${selectedVersion.fileUrl}`}
                    target="_blank" rel="noreferrer"
                    className="p-2 rounded-lg border border-white/[0.08] bg-white/[0.04] text-text-muted hover:text-white hover:border-white/20 transition-all"
                    title="Download"
                  >
                    <Download size={16} />
                  </a>
                  {selectedVersion.parsingStatus === 'Completed' || selectedVersion.parsingStatus === 'Failed' ? (
                    <button
                      onClick={() => handleReparse(selectedVersion._id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.04] text-xs font-bold text-white hover:bg-white/[0.08] transition-all"
                    >
                      <RefreshCw size={13} /> Re-parse
                    </button>
                  ) : null}
                </div>
              </Card>

              {/* Parsing states */}
              {selectedVersion.parsingStatus === 'Processing' && (
                <Card hover={false} className="text-center py-10">
                  <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="font-bold text-white">AI is parsing your resume…</p>
                  <p className="text-sm text-text-muted mt-1">This usually takes 5–10 seconds.</p>
                </Card>
              )}

              {selectedVersion.parsingStatus === 'Failed' && (
                <Card hover={false} className="border-danger/20 bg-danger/5 py-8 text-center">
                  <AlertCircle size={28} className="text-danger mx-auto mb-3" />
                  <p className="font-bold text-white">Parsing failed</p>
                  <p className="text-sm text-text-muted mt-1 mb-4">{selectedVersion.parsingError || 'An unknown error occurred.'}</p>
                  <Button size="sm" variant="outline" onClick={() => handleReparse(selectedVersion._id)} leftIcon={<RefreshCw size={14}/>}>
                    Try Again
                  </Button>
                </Card>
              )}

              {selectedVersion.parsingStatus === 'Completed' && selectedVersion.parsedResume && (
                <ParsedPreview parsed={selectedVersion.parsedResume} />
              )}

              {selectedVersion.parsingStatus === 'Pending' && (
                <Card hover={false} className="text-center py-8">
                  <Clock size={28} className="text-text-muted mx-auto mb-3" />
                  <p className="text-sm text-text-muted">Parsing is queued and will begin shortly.</p>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

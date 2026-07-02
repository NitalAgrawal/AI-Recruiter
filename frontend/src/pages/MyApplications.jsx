import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, Building2, MapPin, Clock, ChevronRight, Trash2, AlertTriangle } from 'lucide-react'
import api from '../services/api'
import { Heading3, Heading4 } from '../design-system/Typography'
import Card from '../design-system/Card'
import Badge from '../design-system/Badge'
import Button from '../design-system/Button'

const stagger = { show: { transition: { staggerChildren: 0.07 } } }
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } } }

const STATUS_CONFIG = {
  'Applied':              { dot: 'bg-info',    text: 'text-info',    bg: 'bg-info/10',    border: 'border-info/20' },
  'Under Review':         { dot: 'bg-warning',  text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  'Shortlisted':          { dot: 'bg-gold',     text: 'text-gold',    bg: 'bg-gold/10',    border: 'border-gold/20' },
  'Interview Scheduled':  { dot: 'bg-purple-400', text: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
  'Rejected':             { dot: 'bg-danger',   text: 'text-danger',  bg: 'bg-danger/10',  border: 'border-danger/20' },
  'Hired':                { dot: 'bg-success',  text: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
}

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || { dot: 'bg-text-muted', text: 'text-text-muted', bg: 'bg-white/5', border: 'border-white/10' }
  return (
    <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${c.bg} ${c.border} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />
      {status}
    </span>
  )
}

export default function MyApplications() {
  const [applications, setApplications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [withdrawingId, setWithdrawingId] = useState(null)

  useEffect(() => { fetchApplications() }, [])

  const fetchApplications = async () => {
    try {
      setIsLoading(true)
      const res = await api.get('/applications/my')
      if (res.data.success) setApplications(res.data.applications)
    } catch (err) {
      console.error('Failed to fetch applications', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdraw = async (id) => {
    if (!window.confirm('Withdraw this application? This cannot be undone.')) return
    setWithdrawingId(id)
    try {
      await api.delete(`/applications/${id}/withdraw`)
      setApplications(prev => prev.filter(a => a._id !== id))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to withdraw application')
    } finally {
      setWithdrawingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-page-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <Heading3>My Applications</Heading3>
          <p className="text-sm text-text-secondary mt-1">Track the status of all your job applications.</p>
        </div>
        <div className="bg-black/20 border border-white/[0.04] px-5 py-3 rounded-xl text-center">
          <p className="text-2xl font-black text-white">{applications.length}</p>
          <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold">Total Applied</p>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="flex flex-wrap gap-3">
        {Object.keys(STATUS_CONFIG).map(status => {
          const count = applications.filter(a => a.status === status).length
          if (count === 0) return null
          const c = STATUS_CONFIG[status]
          return (
            <span key={status} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${c.bg} ${c.border} ${c.text}`}>
              {status} <span className="bg-black/30 px-1.5 py-0.5 rounded-full">{count}</span>
            </span>
          )
        })}
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="text-center py-24 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
            <Briefcase size={28} className="text-text-muted" />
          </div>
          <p className="text-lg font-bold text-white">No applications yet</p>
          <p className="text-sm text-text-muted">Browse jobs and apply to get started.</p>
          <Button onClick={() => window.location.href = '/jobs'}>Browse Jobs</Button>
        </div>
      ) : (
        <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-4">
          {applications.map((app) => {
            const job = app.job || {}
            const company = job.companyProfile?.companyName || 'Company'
            const logoUrl = job.companyProfile?.companyLogo ? `http://localhost:5000${job.companyProfile.companyLogo}` : null
            const canWithdraw = !['Hired', 'Interview Scheduled', 'Rejected'].includes(app.status)

            return (
              <motion.div key={app._id} variants={fadeUp}>
                <Card hover={false} className="!p-0 overflow-hidden">
                  <div className="flex items-start gap-5 p-5">
                    {/* Logo */}
                    <div className="w-14 h-14 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 overflow-hidden">
                      {logoUrl
                        ? <img src={logoUrl} alt={company} className="w-full h-full object-cover" />
                        : <Building2 size={22} className="text-gold" />
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <h3 className="text-base font-bold text-white">{job.title || 'Job Title'}</h3>
                          <p className="text-sm text-text-secondary font-medium mt-0.5">{company}</p>
                        </div>
                        <StatusBadge status={app.status} />
                      </div>

                      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-xs text-text-muted font-medium">
                        {job.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-text-secondary" /> {job.location}
                          </span>
                        )}
                        {job.employmentType && (
                          <span className="flex items-center gap-1.5">
                            <Clock size={13} className="text-text-secondary" /> {job.employmentType}
                          </span>
                        )}
                        <span>Applied {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>Updated {new Date(app.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04] bg-black/20">
                    {app.resumeFile ? (
                      <a
                        href={`http://localhost:5000${app.resumeFile}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-gold font-bold hover:underline flex items-center gap-1.5"
                      >
                        <ChevronRight size={13} /> View Submitted Resume
                      </a>
                    ) : (
                      <span className="text-xs text-text-muted">No resume submitted</span>
                    )}
                    {canWithdraw && (
                      <button
                        onClick={() => handleWithdraw(app._id)}
                        disabled={withdrawingId === app._id}
                        className="flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-danger transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={13} /> Withdraw
                      </button>
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}

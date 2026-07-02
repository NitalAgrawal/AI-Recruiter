import React from 'react'
import { MapPin, Clock, DollarSign, Copy, Pencil, X, ChevronRight, Building2, Bookmark, Share2, Users, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Badge from '../design-system/Badge'
import Button from '../design-system/Button'
import { useAuth } from '../contexts/AuthContext'

const statusColor = (status) => {
  switch (status) {
    case 'Published': return 'active'
    case 'Draft': return 'pending'
    case 'Closed': return 'closed'
    default: return 'default'
  }
}

export default function JobCard({ job, onClone, onStatusChange, onDelete, onApply, onAnalyze }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isRecruiter = user?.role === 'Recruiter' || user?.role === 'Admin'

  const {
    _id, title, department, location, workplaceType, employmentType,
    salaryMin, salaryMax, currency = 'USD', status, companyProfile,
    createdAt, requiredSkills = []
  } = job

  const salaryLabel = salaryMin && salaryMax
    ? `${currency} ${(salaryMin / 1000).toFixed(0)}k – ${(salaryMax / 1000).toFixed(0)}k`
    : null

  const company = companyProfile?.companyName || 'Company'
  const logoUrl = companyProfile?.companyLogo
    ? `http://localhost:5000${companyProfile.companyLogo}`
    : null

  return (
    <div className="glass-card-hover p-6 flex flex-col h-full group">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform shadow-inner">
            {logoUrl
              ? <img src={logoUrl} alt={company} className="w-full h-full object-cover" />
              : <Building2 size={20} className="text-gold" />
            }
          </div>
          <div>
            <h3 className="text-base font-bold text-white group-hover:text-gold transition-colors leading-tight">{title}</h3>
            <p className="text-xs text-text-secondary font-medium mt-0.5">{company} · {department}</p>
          </div>
        </div>
        <Badge status={statusColor(status)} label={status} />
      </div>

      {/* Meta Chips */}
      <div className="flex flex-wrap gap-2 mb-4 flex-1">
        {location && (
          <span className="flex items-center gap-1.5 bg-elevated px-2.5 py-1.5 rounded-md border border-border text-xs text-text-muted font-medium">
            <MapPin size={13} className="text-text-secondary" /> {location}
          </span>
        )}
        <span className="flex items-center gap-1.5 bg-elevated px-2.5 py-1.5 rounded-md border border-border text-xs text-text-muted font-medium">
          <Clock size={13} className="text-text-secondary" /> {employmentType}
        </span>
        {workplaceType && (
          <span className="bg-elevated px-2.5 py-1.5 rounded-md border border-border text-xs text-text-muted font-medium">
            {workplaceType}
          </span>
        )}
        {salaryLabel && (
          <span className="flex items-center gap-1.5 bg-gold/5 px-2.5 py-1.5 rounded-md border border-gold/10 text-gold-light text-xs font-medium">
            <DollarSign size={13} className="text-gold" /> {salaryLabel}
          </span>
        )}
      </div>

      {/* Skills Preview */}
      {requiredSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {requiredSkills.slice(0, 3).map((s) => (
            <span key={s} className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] text-text-secondary font-medium">{s}</span>
          ))}
          {requiredSkills.length > 3 && (
            <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] text-text-muted">+{requiredSkills.length - 3} more</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.05] mt-auto gap-2">
        {isRecruiter ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(`/jobs/edit/${_id}`)}
              className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors"
              title="Edit"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onClone?.(_id)}
              className="p-1.5 rounded-lg text-text-muted hover:text-gold hover:bg-gold/5 transition-colors"
              title="Clone"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={() => onAnalyze?.(job)}
              className="p-1.5 rounded-lg text-text-muted hover:text-purple-400 hover:bg-purple-400/5 transition-colors"
              title="AI Insight"
            >
              <Sparkles size={14} />
            </button>
            {status !== 'Closed' && (
              <button
                onClick={() => onStatusChange?.(_id, status === 'Published' ? 'Closed' : 'Published')}
                className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/5 transition-colors"
                title={status === 'Published' ? 'Close Job' : 'Publish'}
              >
                <X size={14} />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg text-text-muted hover:text-gold hover:bg-gold/5 transition-colors" title="Bookmark">
              <Bookmark size={14} />
            </button>
            <button
              onClick={() => { if (navigator.share) navigator.share({ title, url: window.location.href }) }}
              className="p-1.5 rounded-lg text-text-muted hover:text-info hover:bg-info/5 transition-colors"
              title="Share"
            >
              <Share2 size={14} />
            </button>
          </div>
        )}

        {isRecruiter ? (
          <Button
            size="sm" variant="ghost"
            leftIcon={<Users size={14} />}
            rightIcon={<ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />}
            onClick={() => navigate(`/applicants/${_id}`)}
          >
            View Applicants
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => onApply?.(job)}
            className="shadow-gold"
          >
            Apply Now
          </Button>
        )}
      </div>
    </div>
  )
}

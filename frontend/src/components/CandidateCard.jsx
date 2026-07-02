import React from 'react'
import { MapPin, Briefcase, Star, ChevronRight, User } from 'lucide-react'
import Avatar from '../design-system/Avatar'
import Badge, { ScoreBadge, Tag } from '../design-system/Badge'
import Button from '../design-system/Button'

export default function CandidateCard({ candidate, onClick, compact = false }) {
  const {
    name, role, location, experience, skills = [],
    status, matchScore, rating, appliedDate,
  } = candidate

  if (compact) {
    return (
      <div
        onClick={onClick}
        className="flex items-center gap-4 px-5 py-4 rounded-xl hover:bg-white/[0.04] cursor-pointer transition-colors group border border-transparent hover:border-white/[0.06]"
      >
        <Avatar name={name} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{name}</p>
          <p className="text-xs text-text-muted truncate mt-0.5">{role}</p>
        </div>
        <div className="flex items-center gap-4">
          <ScoreBadge score={matchScore} />
          <ChevronRight size={16} className="text-text-muted opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className="glass-card-hover p-6 cursor-pointer group flex flex-col h-full"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-4">
          <Avatar name={name} size="lg" className="ring-2 ring-primary group-hover:ring-gold/20 transition-all" />
          <div>
            <h3 className="text-base font-bold text-white group-hover:text-gold transition-colors">{name}</h3>
            <p className="text-sm text-text-secondary mt-1">{role}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ScoreBadge score={matchScore} />
          <Badge status={status} />
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-6 text-xs text-text-muted font-medium">
        {location && (
          <span className="flex items-center gap-1.5 bg-elevated px-2 py-1 rounded-md border border-border">
            <MapPin size={12} className="text-text-secondary" /> {location}
          </span>
        )}
        {experience && (
          <span className="flex items-center gap-1.5 bg-elevated px-2 py-1 rounded-md border border-border">
            <Briefcase size={12} className="text-text-secondary" /> {experience}
          </span>
        )}
        {rating && (
          <span className="flex items-center gap-1.5 bg-gold/5 px-2 py-1 rounded-md border border-gold/10 text-gold-light">
            <Star size={12} fill="currentColor" /> {rating}
          </span>
        )}
      </div>

      {/* Skills */}
      <div className="flex-1">
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {skills.slice(0, 4).map((s) => <Tag key={s}>{s}</Tag>)}
            {skills.length > 4 && (
              <Tag className="opacity-60 hover:opacity-100">+{skills.length - 4}</Tag>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.05] mt-auto">
        <span className="text-[11px] font-medium text-text-muted">Applied {appliedDate}</span>
        <Button size="sm" variant="ghost" rightIcon={<ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />}>
          View Profile
        </Button>
      </div>
    </div>
  )
}

import React from 'react'
import { clsx } from 'clsx'
import { statusConfig } from './tokens'

/* ── Status Badge ─────────────────────────────────────────── */
export default function Badge({ status, label, className = '' }) {
  const config = statusConfig[status] || {
    label: label || status || '—',
    color: 'text-text-secondary',
    bg:    'bg-elevated',
    dot:   'bg-text-muted',
  }
  return (
    <span className={clsx('badge', config.bg, config.color, className)}
      style={{ backdropFilter: 'blur(8px)' }}>
      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />
      {label || config.label}
    </span>
  )
}

/* ── Skill Tag ────────────────────────────────────────────── */
export function Tag({ children, className = '', active = false }) {
  return (
    <span className={clsx(
      'inline-flex items-center rounded-md text-xs font-medium border transition-all duration-150',
      'px-2.5 py-1',
      active
        ? 'bg-gold/10 text-gold border-gold/25 shadow-[0_0_8px_rgba(212,175,55,0.08)]'
        : 'bg-white/[0.03] text-text-secondary border-white/[0.06] hover:border-white/[0.12] hover:text-white/80',
      className
    )}>
      {children}
    </span>
  )
}

/* ── AI Score Badge ───────────────────────────────────────── */
export function ScoreBadge({ score, className = '' }) {
  const getStyle = (s) => {
    if (s >= 85) return { text: 'text-success', bg: 'bg-success/8', border: 'border-success/20' }
    if (s >= 65) return { text: 'text-gold',    bg: 'bg-gold/8',    border: 'border-gold/20' }
    return              { text: 'text-danger',  bg: 'bg-danger/8',  border: 'border-danger/20' }
  }
  const { text, bg, border } = getStyle(score)
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 rounded-md text-xs font-bold border tabular-nums',
      'px-2 py-0.5',
      bg, text, border, className
    )}>
      <span className={clsx('w-1 h-1 rounded-full', text === 'text-gold' ? 'bg-gold' : text === 'text-success' ? 'bg-success' : 'bg-danger')} />
      {score}%
    </span>
  )
}

/* ── Count Badge ──────────────────────────────────────────── */
export function CountBadge({ count, className = '' }) {
  return (
    <span className={clsx(
      'inline-flex items-center justify-center w-5 h-5 rounded-full',
      'bg-gold text-primary text-[9px] font-black tracking-tight',
      className
    )}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

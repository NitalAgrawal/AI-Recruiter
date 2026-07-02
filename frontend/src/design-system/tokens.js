// Design System Tokens — single source of truth
export const colors = {
  primary:    '#0B0B0B',
  surface:    '#111111',
  elevated:   '#1A1A1A',
  border:     '#222222',
  gold:       '#D4AF37',
  goldLight:  '#E8C94B',
  goldDark:   '#A8891F',
  goldMuted:  'rgba(212,175,55,0.12)',
  goldGlow:   'rgba(212,175,55,0.25)',
  textPrimary:   '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted:     '#555555',
  success: '#22C55E',
  warning: '#F59E0B',
  danger:  '#EF4444',
  info:    '#3B82F6',
}

export const radius = {
  sm:   '6px',
  md:   '10px',
  lg:   '14px',
  xl:   '16px',
  '2xl':'20px',
  full: '9999px',
}

export const shadows = {
  card:      '0 1px 3px rgba(0,0,0,0.4)',
  cardHover: '0 8px 32px rgba(0,0,0,0.6)',
  goldSm:    '0 0 12px rgba(212,175,55,0.15)',
  gold:      '0 0 24px rgba(212,175,55,0.2)',
  goldLg:    '0 0 48px rgba(212,175,55,0.25)',
}

// Status badge configs
export const statusConfig = {
  active:      { label: 'Active',      color: 'text-success', bg: 'bg-success-muted', dot: 'bg-success' },
  screening:   { label: 'Screening',   color: 'text-info',    bg: 'bg-info-muted',    dot: 'bg-info' },
  interview:   { label: 'Interview',   color: 'text-gold',    bg: 'bg-gold-muted',    dot: 'bg-gold' },
  offer:       { label: 'Offer',       color: 'text-warning', bg: 'bg-warning-muted', dot: 'bg-warning' },
  hired:       { label: 'Hired',       color: 'text-success', bg: 'bg-success-muted', dot: 'bg-success' },
  rejected:    { label: 'Rejected',    color: 'text-danger',  bg: 'bg-danger-muted',  dot: 'bg-danger' },
  pending:     { label: 'Pending',     color: 'text-text-secondary', bg: 'bg-elevated', dot: 'bg-text-muted' },
  open:        { label: 'Open',        color: 'text-success', bg: 'bg-success-muted', dot: 'bg-success' },
  closed:      { label: 'Closed',      color: 'text-danger',  bg: 'bg-danger-muted',  dot: 'bg-danger' },
  paused:      { label: 'Paused',      color: 'text-warning', bg: 'bg-warning-muted', dot: 'bg-warning' },
}

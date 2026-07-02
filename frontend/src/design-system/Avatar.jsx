import React from 'react'
import { clsx } from 'clsx'

const sizeMap = {
  xs:  { outer: 'w-6 h-6',   text: 'text-[10px]' },
  sm:  { outer: 'w-8 h-8',   text: 'text-xs' },
  md:  { outer: 'w-10 h-10', text: 'text-sm' },
  lg:  { outer: 'w-12 h-12', text: 'text-base' },
  xl:  { outer: 'w-14 h-14', text: 'text-lg' },
  '2xl':{ outer: 'w-16 h-16', text: 'text-xl' },
}

const palette = [
  'from-gold/60 to-gold-dark/60 border-gold/30',
  'from-info/60 to-blue-700/60 border-info/30',
  'from-success/60 to-emerald-700/60 border-success/30',
  'from-warning/60 to-orange-600/60 border-warning/30',
  'from-purple-500/60 to-purple-800/60 border-purple-500/30',
  'from-pink-500/60 to-rose-700/60 border-pink-500/30',
]

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function pickStyle(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

export default function Avatar({
  name = '',
  src,
  size = 'md',
  online = false,
  className = '',
}) {
  const { outer, text } = sizeMap[size] || sizeMap.md
  const styleStr = pickStyle(name)
  const initials = getInitials(name)

  return (
    <div className={clsx('relative shrink-0', className)}>
      <div className={clsx(
        'rounded-full flex items-center justify-center overflow-hidden border bg-elevated shadow-inner',
        outer, styleStr.split(' ').find(c => c.startsWith('border-'))
      )}>
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className={clsx('w-full h-full flex items-center justify-center bg-gradient-to-br font-semibold text-white/90', styleStr, text)}>
            {initials || '?'}
          </div>
        )}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success border-2 border-primary shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
      )}
    </div>
  )
}

// ─── Avatar Group ─────────────────────────────────────────
export function AvatarGroup({ names = [], max = 4, size = 'sm' }) {
  const visible  = names.slice(0, max)
  const overflow = names.length - max

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((name, i) => (
        <Avatar key={i} name={name} size={size} className="ring-2 ring-primary relative hover:z-10 transition-transform hover:scale-105" style={{ zIndex: visible.length - i }} />
      ))}
      {overflow > 0 && (
        <div className={clsx(
          'flex items-center justify-center rounded-full bg-elevated border border-border text-text-secondary font-medium ring-2 ring-primary relative z-0',
          sizeMap[size].outer, sizeMap[size].text
        )}>
          +{overflow}
        </div>
      )}
    </div>
  )
}

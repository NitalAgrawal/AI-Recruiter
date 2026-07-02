import React from 'react'
import { clsx } from 'clsx'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function StatCard({ label, value, sub, icon: Icon, trend, trendLabel, iconColor = 'text-gold', iconBg = 'bg-gold/10', delay = 0 }) {
  const isPositive = trend > 0
  const isNeutral  = trend === 0

  return (
    <div
      className="stat-card"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background glow behind icon */}
      {Icon && (
        <div className={clsx('absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-50 pointer-events-none', 
          iconColor === 'text-gold' ? 'bg-gold' : iconColor === 'text-success' ? 'bg-success' : iconColor === 'text-info' ? 'bg-info' : 'bg-warning')} />
      )}

      <div className="relative flex justify-between items-start">
        <div className="flex-1 min-w-0 pr-4">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-muted mb-4">{label}</h3>
          <div className="flex items-end gap-3 mb-2">
            <span className="text-4xl font-black text-white leading-none tracking-tight">{value}</span>
            {trend !== undefined && (
              <div className={clsx(
                'flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold tabular-nums mb-1 border',
                isPositive ? 'bg-success/10 text-success border-success/20'
                  : isNeutral ? 'bg-white/5 text-text-secondary border-white/10'
                  : 'bg-danger/10 text-danger border-danger/20'
              )}>
                {isPositive ? <TrendingUp size={12} />
                  : isNeutral ? <Minus size={12} />
                  : <TrendingDown size={12} />}
                {isPositive ? '+' : ''}{trend}%
              </div>
            )}
          </div>
          {sub && <p className="text-xs text-text-secondary mt-1 truncate">{sub} {trendLabel ? `(${trendLabel})` : ''}</p>}
        </div>
        {Icon && (
          <div className={clsx('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 shadow-inner', iconBg)}>
            <Icon size={22} className={iconColor} />
          </div>
        )}
      </div>
    </div>
  )
}

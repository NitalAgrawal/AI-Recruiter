import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, Bell, Plus, ChevronDown, Sparkles } from 'lucide-react'
import Avatar from '../design-system/Avatar'
import { CountBadge } from '../design-system/Badge'
import Button from '../design-system/Button'
import { useAuth } from '../contexts/AuthContext'

const PAGE_TITLES = {
  '/dashboard':  { title: 'Dashboard',    sub: "Here's what's happening with your candidates today." },
  '/candidates': { title: 'Candidates',   sub: 'Manage and track applicants across all open roles.' },
  '/jobs':       { title: 'Job Listings', sub: 'Monitor active openings and pipeline health.' },
  '/interview':  { title: 'AI Interview', sub: 'Live assessment sessions powered by AI-Recruiter.' },
  '/reports':    { title: 'Reports',      sub: 'Advanced analytics and recruitment insights.' },
  '/settings':   { title: 'Settings',     sub: 'Manage your account and workspace preferences.' },
}

export default function Header({ onSearch }) {
  const { pathname } = useLocation()
  const page = PAGE_TITLES[pathname] || { title: 'AI-Recruiter', sub: '' }
  const [query, setQuery] = useState('')
  const { user } = useAuth()

  return (
    <header className="h-20 flex items-center justify-between px-8 border-b border-white/[0.04] bg-primary/70 backdrop-blur-2xl sticky top-0 z-20 shadow-[0_1px_0_0_rgba(255,255,255,0.01)]">
      {/* ── Page Title ─── */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">{page.title}</h1>
        <p className="text-xs text-text-secondary mt-1">{page.sub}</p>
      </div>

      {/* ── Right Controls ─── */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden lg:block group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-gold transition-colors" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); onSearch?.(e.target.value) }}
            type="text"
            placeholder="Search candidates, jobs (Press ⌘K)"
            className="pl-9 pr-4 py-2 text-sm bg-black/50 border border-white/[0.06] rounded-xl text-white placeholder:text-text-muted
                       focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 w-72 transition-all hover:bg-black/70"
          />
          {/* Cmd+K Hint */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-sans font-semibold text-text-muted bg-white/[0.05] rounded border border-white/[0.05]">⌘</kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] font-sans font-semibold text-text-muted bg-white/[0.05] rounded border border-white/[0.05]">K</kbd>
          </div>
        </div>

        {/* AI Action */}
        <button className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-gold/10 border border-gold/20 text-gold text-sm font-semibold hover:bg-gold/15 transition-colors">
          <Sparkles size={14} />
          <span>Ask AI</span>
        </button>

        <div className="w-px h-6 bg-white/[0.06] mx-1 hidden md:block" />

        {/* New Job CTA */}
        <Button size="sm" leftIcon={<Plus size={16} />}>
          Post Job
        </Button>

        {/* Notifications */}
        <button className="relative w-10 h-10 rounded-xl bg-black/50 border border-white/[0.06] flex items-center justify-center
                           text-text-secondary hover:text-white hover:border-gold/30 hover:bg-black/80 transition-all cursor-pointer shadow-inner">
          <Bell size={18} />
          <CountBadge count={3} className="absolute -top-1.5 -right-1.5" />
        </button>

        {/* Avatar dropdown */}
        <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer border border-transparent hover:border-white/[0.06]">
          <Avatar name={user?.fullName || "Sarah Chen"} size="sm" />
          <ChevronDown size={14} className="text-text-muted" />
        </button>
      </div>
    </header>
  )
}

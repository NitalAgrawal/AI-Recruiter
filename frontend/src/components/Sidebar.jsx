import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard, Users, Briefcase, MessageSquare, BarChart3,
  Settings, ChevronLeft, ChevronRight, Zap, LogOut, HelpCircle, FileText, User, FileUp
} from 'lucide-react'
import Avatar from '../design-system/Avatar'
import { CountBadge } from '../design-system/Badge'
import { useAuth } from '../contexts/AuthContext'

const RECRUITER_NAV = [
  { to: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/analytics',  label: 'AI Analytics', icon: BarChart3 },
  { to: '/candidates', label: 'Candidates',  icon: Users,           badge: 3 },
  { to: '/jobs',       label: 'Jobs',        icon: Briefcase },
  { to: '/interview',  label: 'AI Interview',icon: MessageSquare },
  { to: '/reports',    label: 'Reports',     icon: FileText },
  { to: '/recruiter-profile', label: 'Profile', icon: Settings },
]

const CANDIDATE_NAV = [
  { to: '/candidate-dashboard', label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/jobs',                label: 'Browse Jobs',     icon: Briefcase },
  { to: '/my-applications',    label: 'My Applications', icon: FileText },
  { to: '/resume',             label: 'Resume Manager',  icon: FileUp },
  { to: '/candidate-dashboard',label: 'My Profile',      icon: User },
]

const BOTTOM_ITEMS = [
  { to: '/settings', label: 'Settings', icon: Settings },
  { label: 'Help',   icon: HelpCircle,  to: '#' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const isCandidate = user?.role === 'Candidate'
  const NAV_ITEMS = isCandidate ? CANDIDATE_NAV : RECRUITER_NAV

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={clsx(
        'h-screen sticky top-0 flex flex-col bg-surface/50 backdrop-blur-xl border-r border-white/[0.05] transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] shrink-0 z-30',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* ── Logo ─── */}
      <div className={clsx(
        'flex items-center h-20 px-6 gap-3',
        collapsed && 'justify-center px-4'
      )}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shrink-0 shadow-gold">
          <Zap size={16} className="text-primary" fill="currentColor" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in origin-left">
            <span className="text-base font-black text-white tracking-tight leading-none block">TalentAI</span>
            <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-gold mt-1 block">Recruitment</span>
          </div>
        )}
      </div>

      {/* ── Nav ─── */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-6 px-4 space-y-1">
        {!collapsed && (
          <p className="px-3 mb-4 text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted">
            Platform
          </p>
        )}
        {NAV_ITEMS.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx('nav-item group', isActive && 'active', collapsed && 'justify-center px-0')
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="shrink-0 transition-transform group-hover:scale-110" />
            {!collapsed && <span className="flex-1 font-semibold">{label}</span>}
            {!collapsed && badge && <CountBadge count={badge} />}
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom ─── */}
      <div className="px-4 py-6 space-y-1 bg-gradient-to-t from-primary/80 to-transparent">
        {BOTTOM_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={clsx('nav-item group', collapsed && 'justify-center px-0')}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="shrink-0 transition-transform group-hover:scale-110" />
            {!collapsed && <span className="font-semibold">{label}</span>}
          </NavLink>
        ))}

        {/* User profile */}
        <div className={clsx(
          'mt-4 pt-4 border-t border-white/[0.05] flex items-center gap-3',
          collapsed ? 'justify-center' : 'px-2'
        )}>
          <Avatar name={user?.fullName || "Sarah Chen"} size="sm" online />
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-sm font-bold text-white truncate">{user?.fullName || "Sarah Chen"}</p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-text-muted truncate mt-0.5">{user?.role || "Admin"}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="text-text-muted hover:text-danger hover:bg-danger/10 p-1.5 rounded-lg transition-all"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Collapse Toggle ─── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={clsx(
          'absolute -right-3 top-24 w-6 h-6 rounded-full bg-elevated border border-border shadow-glass',
          'flex items-center justify-center text-text-secondary hover:text-gold hover:border-gold/40 hover:scale-110',
          'transition-all duration-300 z-10 cursor-pointer'
        )}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}

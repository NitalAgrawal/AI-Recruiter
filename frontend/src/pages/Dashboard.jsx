import React from 'react'
import { motion } from 'framer-motion'
import {
  Users, Briefcase, MessageSquare, TrendingUp,
  Calendar, ChevronRight, Clock, Star, ArrowUpRight,
  Zap, CheckCircle2, AlertCircle, Circle, ArrowRight,
} from 'lucide-react'
import StatCard from '../components/StatCard'
import CandidateCard from '../components/CandidateCard'
import Badge, { ScoreBadge } from '../design-system/Badge'
import Avatar from '../design-system/Avatar'
import Card from '../design-system/Card'
import Button from '../design-system/Button'
import { Label, Heading3 } from '../design-system/Typography'

/* ─── Mock Data ──────────────────────────────────────── */
const STATS = [
  { label: 'Active Jobs',        value: '24',    sub: '6 closing soon',  icon: Briefcase,    trend: 12,  iconColor: 'text-gold',    iconBg: 'bg-gold/10' },
  { label: 'Total Candidates',   value: '1,284', sub: '342 new this week',icon: Users,        trend: 8,   iconColor: 'text-info',    iconBg: 'bg-info/10' },
  { label: 'Interviews Today',   value: '7',     sub: '3 AI-assisted',   icon: MessageSquare,trend: 0,   iconColor: 'text-success', iconBg: 'bg-success/10' },
  { label: 'Hire Rate',          value: '34%',   sub: 'Industry avg 18%', icon: TrendingUp,  trend: 5,   iconColor: 'text-warning', iconBg: 'bg-warning/10' },
]

const TOP_CANDIDATES = [
  { name: 'Jordan Mitchell', role: 'Senior React Engineer', status: 'interview', matchScore: 94, rating: 4.9, location: 'San Francisco, CA', experience: '7 years', skills: ['React', 'TypeScript', 'Node.js'], appliedDate: '2 days ago' },
  { name: 'Aisha Kamara',    role: 'Product Designer',      status: 'screening', matchScore: 91, rating: 4.8, location: 'New York, NY',    experience: '5 years', skills: ['Figma', 'UX Research', 'Prototyping'], appliedDate: '3 days ago' },
  { name: 'Luca Bianchi',    role: 'ML Engineer',           status: 'offer',     matchScore: 89, rating: 4.7, location: 'London, UK',       experience: '6 years', skills: ['Python', 'PyTorch', 'MLOps'], appliedDate: '1 week ago' },
]

const ACTIVITY = [
  { icon: CheckCircle2, color: 'text-success', msg: 'Offer sent to Priya Nair for Senior PM role', time: '5 min ago' },
  { icon: Zap,          color: 'text-gold',    msg: 'AI screened 48 new applications for DevOps Engineer', time: '1 hr ago' },
  { icon: Calendar,     color: 'text-info',    msg: 'Interview scheduled: Marcus Webb — 3:00 PM today', time: '2 hr ago' },
  { icon: AlertCircle,  color: 'text-warning', msg: 'Job posting "Data Scientist" closing in 2 days', time: '4 hr ago' },
  { icon: CheckCircle2, color: 'text-success', msg: 'Elena Vasquez moved to final round', time: 'Yesterday' },
  { icon: Circle,       color: 'text-text-muted', msg: 'New job posted: Staff Backend Engineer', time: 'Yesterday' },
]

const UPCOMING = [
  { candidate: 'Jordan Mitchell', role: 'Sr. React Eng', time: '10:00 AM', type: 'AI Interview',    avatar: 'Jordan Mitchell' },
  { candidate: 'Simone Dubois',   role: 'UX Lead',       time: '11:30 AM', type: 'Technical Round', avatar: 'Simone Dubois' },
  { candidate: 'Chris Okafor',    role: 'Data Scientist', time: '2:00 PM', type: 'Final Interview', avatar: 'Chris Okafor' },
  { candidate: 'Maya Patel',      role: 'DevOps Eng',    time: '3:30 PM',  type: 'Culture Fit',     avatar: 'Maya Patel' },
]

/* ─── Pipeline Bar ───────────────────────────────────── */
const PIPELINE = [
  { label: 'Applied',    count: 324, color: 'bg-text-muted',   pct: 100 },
  { label: 'Screened',   count: 186, color: 'bg-info',         pct: 57  },
  { label: 'Interview',  count: 52,  color: 'bg-gold',         pct: 16  },
  { label: 'Offer',      count: 12,  color: 'bg-warning',      pct: 4   },
  { label: 'Hired',      count: 8,   color: 'bg-success',      pct: 2.5 },
]

const stagger = { show: { transition: { staggerChildren: 0.1 } } }
const fadeUp  = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }

export default function Dashboard() {
  return (
    <div className="space-y-8 animate-page-in">
      <header className="mb-2">
        <Heading3>Dashboard Overview</Heading3>
        <p className="text-text-secondary mt-1 text-sm">Real-time insights across your recruitment pipeline.</p>
      </header>

      {/* ── Stat Cards ────────────────────────────────── */}
      <motion.div initial="hidden" animate="show" variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {STATS.map((s, i) => (
          <motion.div key={s.label} variants={fadeUp}>
            <StatCard {...s} delay={i * 60} />
          </motion.div>
        ))}
      </motion.div>

      {/* ── Main Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Left col — candidates + pipeline */}
        <div className="xl:col-span-2 space-y-8">

          {/* Top Candidates */}
          <Card hover={false} className="h-[460px] flex flex-col">
            <Card.Header className="mb-6">
              <div>
                <Label>Top Candidates</Label>
                <p className="text-xs text-text-secondary mt-1">Highest AI match scores this week</p>
              </div>
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={16} />}
                onClick={() => window.location.href = '/candidates'}>
                View All
              </Button>
            </Card.Header>
            <div className="space-y-4 overflow-y-auto pr-2 no-scrollbar flex-1">
              {TOP_CANDIDATES.map((c) => (
                <CandidateCard key={c.name} candidate={c} compact />
              ))}
            </div>
          </Card>

          {/* Hiring Pipeline */}
          <Card hover={false}>
            <Card.Header className="mb-6">
              <div>
                <Label>Hiring Pipeline Conversion</Label>
                <p className="text-xs text-text-secondary mt-1">Senior React Engineer breakdown</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-white block leading-none">324</span>
                <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Total</span>
              </div>
            </Card.Header>
            <div className="space-y-5">
              {PIPELINE.map(({ label, count, color, pct }, i) => (
                <div key={label} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-text-secondary group-hover:text-white transition-colors">{label}</span>
                    <span className="text-sm font-bold text-white tabular-nums">{count} <span className="text-text-muted font-normal ml-1">({pct.toFixed(0)}%)</span></span>
                  </div>
                  <div className="h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/[0.04] shadow-inner">
                    <motion.div
                      className={`h-full ${color} rounded-full relative`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 + i * 0.1 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right col — activity + interviews */}
        <div className="space-y-8">

          {/* Upcoming Interviews */}
          <Card hover={false}>
            <Card.Header className="mb-6">
              <Label>Today's Interviews</Label>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.04] border border-white/[0.05]">
                <Calendar size={12} className="text-text-muted" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </Card.Header>
            <div className="space-y-4">
              {UPCOMING.map(({ candidate, role, time, type, avatar }) => (
                <div key={candidate} className="flex items-center gap-4 p-4 rounded-xl bg-black/20 border border-white/[0.04] hover:border-gold/20 hover:bg-white/[0.02] transition-all cursor-pointer group relative overflow-hidden">
                  <div className="absolute left-0 inset-y-0 w-1 bg-gold scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom" />
                  <Avatar name={avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate group-hover:text-gold transition-colors">{candidate}</p>
                    <p className="text-xs text-text-secondary truncate mt-0.5">{type}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-white">{time}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mt-1">{role}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button fullWidth variant="ghost" className="mt-5" rightIcon={<ArrowRight size={14} />}>
              View Calendar
            </Button>
          </Card>

          {/* Recent Activity */}
          <Card hover={false} className="flex-1">
            <Card.Header className="mb-6">
              <Label>Recent Activity</Label>
            </Card.Header>
            <div className="space-y-6">
              {ACTIVITY.map(({ icon: Icon, color, msg, time }, i) => (
                <div key={i} className="flex items-start gap-4 relative group">
                  {i !== ACTIVITY.length - 1 && (
                    <div className="absolute left-[15px] top-8 bottom-[-24px] w-px bg-white/[0.05] group-hover:bg-gold/20 transition-colors" />
                  )}
                  <div className="relative z-10 w-8 h-8 rounded-full bg-elevated border border-white/[0.05] flex items-center justify-center shrink-0 shadow-sm">
                    <Icon size={14} className={color} />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-sm text-text-secondary leading-relaxed group-hover:text-white transition-colors">{msg}</p>
                    <p className="text-xs font-semibold text-text-muted mt-1.5">{time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

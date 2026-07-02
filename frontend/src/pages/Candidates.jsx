import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal, X, ChevronDown, Filter } from 'lucide-react'
import CandidateCard from '../components/CandidateCard'
import Button from '../design-system/Button'
import { Heading3 } from '../design-system/Typography'

/* ─── Mock Data ──────────────────────────────────────── */
const ALL_CANDIDATES = [
  { id: 1,  name: 'Jordan Mitchell', role: 'Senior React Engineer',     status: 'interview', matchScore: 94, rating: 4.9, location: 'San Francisco, CA', experience: '7 yrs', skills: ['React','TypeScript','Node.js','GraphQL'], appliedDate: '2 days ago' },
  { id: 2,  name: 'Aisha Kamara',    role: 'Product Designer',           status: 'screening', matchScore: 91, rating: 4.8, location: 'New York, NY',    experience: '5 yrs', skills: ['Figma','UX Research','Prototyping','Design Systems'], appliedDate: '3 days ago' },
  { id: 3,  name: 'Luca Bianchi',    role: 'ML Engineer',                status: 'offer',     matchScore: 89, rating: 4.7, location: 'London, UK',       experience: '6 yrs', skills: ['Python','PyTorch','MLOps','Kubernetes'], appliedDate: '1 week ago' },
  { id: 4,  name: 'Priya Nair',      role: 'Senior Product Manager',     status: 'hired',     matchScore: 96, rating: 5.0, location: 'Austin, TX',       experience: '9 yrs', skills: ['Roadmapping','Agile','Go-to-Market','OKRs'], appliedDate: '2 weeks ago' },
  { id: 5,  name: 'Marcus Webb',     role: 'Staff Backend Engineer',     status: 'interview', matchScore: 88, rating: 4.6, location: 'Seattle, WA',      experience: '8 yrs', skills: ['Go','PostgreSQL','Kafka','Docker'], appliedDate: '4 days ago' },
  { id: 6,  name: 'Elena Vasquez',   role: 'UX Researcher',              status: 'screening', matchScore: 82, rating: 4.5, location: 'Chicago, IL',      experience: '4 yrs', skills: ['User Testing','Interviews','Figma','Analytics'], appliedDate: '5 days ago' },
  { id: 7,  name: 'Chris Okafor',    role: 'Data Scientist',             status: 'screening', matchScore: 87, rating: 4.7, location: 'Boston, MA',       experience: '5 yrs', skills: ['Python','Spark','SQL','Tableau'], appliedDate: '1 week ago' },
  { id: 8,  name: 'Simone Dubois',   role: 'Head of Design',             status: 'interview', matchScore: 93, rating: 4.9, location: 'Paris, France',    experience: '10 yrs', skills: ['Design Leadership','Brand','Figma','Webflow'], appliedDate: '3 days ago' },
  { id: 9,  name: 'Maya Patel',      role: 'DevOps Engineer',            status: 'pending',   matchScore: 78, rating: 4.3, location: 'Remote',           experience: '4 yrs', skills: ['AWS','Terraform','CI/CD','Kubernetes'], appliedDate: '1 week ago' },
  { id: 10, name: 'James Kim',       role: 'iOS Engineer',               status: 'rejected',  matchScore: 61, rating: 3.8, location: 'Los Angeles, CA',  experience: '3 yrs', skills: ['Swift','UIKit','SwiftUI','XCTest'], appliedDate: '2 weeks ago' },
  { id: 11, name: 'Nadia Osei',      role: 'Security Engineer',          status: 'offer',     matchScore: 90, rating: 4.8, location: 'Washington, DC',   experience: '7 yrs', skills: ['Pen Testing','SIEM','SOC 2','Zero Trust'], appliedDate: '1 week ago' },
  { id: 12, name: 'Ravi Shankar',    role: 'Fullstack Engineer',         status: 'interview', matchScore: 85, rating: 4.6, location: 'Bangalore, India', experience: '6 yrs', skills: ['React','Rails','PostgreSQL','Redis'], appliedDate: '4 days ago' },
]

const STATUS_FILTERS = ['All', 'screening', 'interview', 'offer', 'hired', 'pending', 'rejected']
const SORT_OPTIONS   = ['Best Match', 'Most Recent', 'Highest Rating', 'Name A–Z']

const stagger = { show: { transition: { staggerChildren: 0.08 } } }
const fadeUp  = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }

export default function Candidates() {
  const [search,  setSearch]  = useState('')
  const [status,  setStatus]  = useState('All')
  const [sortBy,  setSortBy]  = useState('Best Match')

  const filtered = useMemo(() => {
    let list = [...ALL_CANDIDATES]
    if (search)        list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase()))
    if (status !== 'All') list = list.filter(c => c.status === status)
    if (sortBy === 'Best Match')     list.sort((a, b) => b.matchScore - a.matchScore)
    if (sortBy === 'Highest Rating') list.sort((a, b) => b.rating - a.rating)
    if (sortBy === 'Name A–Z')       list.sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [search, status, sortBy])

  return (
    <div className="space-y-8 animate-page-in">

      {/* ── Top Bar ───────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Heading3>Candidate Pipeline</Heading3>
          <p className="text-sm text-text-secondary mt-1">Showing {filtered.length} of {ALL_CANDIDATES.length} candidates</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative group">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-gold transition-colors" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or role…"
              className="pl-10 pr-10 py-2.5 text-sm bg-black/40 border border-white/[0.08] rounded-xl text-white placeholder:text-text-muted focus:outline-none focus:border-gold/50 focus:bg-black/60 w-64 md:w-80 transition-all shadow-inner"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-black/40 border border-white/[0.08] rounded-xl pl-4 pr-10 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-gold/50 cursor-pointer transition-all shadow-inner hover:bg-black/60"
            >
              {SORT_OPTIONS.map((o) => <option key={o} value={o} className="bg-elevated text-white">{o}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
          <Button variant="ghost" leftIcon={<Filter size={16} />}>
            Advanced
          </Button>
        </div>
      </div>

      {/* ── Status Filter Pills ───────────────────────── */}
      <div className="flex flex-wrap gap-2.5 pb-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border shadow-sm ${
              status === s
                ? 'bg-gold/10 text-gold border-gold/30 shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                : 'bg-elevated/50 text-text-secondary border-white/[0.05] hover:border-white/[0.15] hover:text-white hover:bg-elevated'
            }`}
          >
            {s === 'All' ? `All Candidates (${ALL_CANDIDATES.length})` : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Candidate Grid ────────────────────────────── */}
      <AnimatePresence mode="wait">
        {filtered.length > 0 ? (
          <motion.div
            key={`${status}-${sortBy}-${search}`}
            initial="hidden"
            animate="show"
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {filtered.map((c) => (
              <motion.div key={c.id} variants={fadeUp}>
                <CandidateCard candidate={c} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 bg-black/20 border border-white/[0.02] rounded-3xl"
          >
            <div className="w-20 h-20 rounded-full bg-white/[0.03] flex items-center justify-center mb-6 shadow-inner">
              <Search size={32} className="text-text-muted" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No candidates found</h3>
            <p className="text-sm text-text-secondary mb-6 max-w-sm text-center">We couldn't find any candidates matching your current filters and search query.</p>
            <Button variant="outline" onClick={() => { setSearch(''); setStatus('All') }}>
              Clear all filters
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

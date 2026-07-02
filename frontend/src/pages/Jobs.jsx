import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Plus, Filter, LayoutGrid, List, RefreshCw } from 'lucide-react'
import JobCard from '../components/JobCard'
import ApplyModal from '../components/ApplyModal'
import JobAnalysisModal from '../components/JobAnalysisModal'
import Button from '../design-system/Button'
import { Heading3 } from '../design-system/Typography'
import { Select } from '../design-system/Input'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const stagger = { show: { transition: { staggerChildren: 0.07 } } }
const fadeUp  = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }

const ITEMS_PER_PAGE = 9

export default function Jobs() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isRecruiter = user?.role === 'Recruiter' || user?.role === 'Admin'

  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterType, setFilterType] = useState('All')
  const [viewMode, setViewMode] = useState('grid')
  const [page, setPage] = useState(1)
  const [applyingJob, setApplyingJob] = useState(null)
  const [analyzingJob, setAnalyzingJob] = useState(null)

  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true)
      const endpoint = isRecruiter ? '/jobs/recruiter/me' : '/jobs'
      const res = await api.get(endpoint)
      if (res.data.success) setJobs(res.data.jobs)
    } catch (err) {
      console.error('Failed to fetch jobs', err)
    } finally {
      setIsLoading(false)
    }
  }, [isRecruiter])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const handleClone = async (id) => {
    try {
      const res = await api.post(`/jobs/${id}/clone`)
      if (res.data.success) {
        setJobs(prev => [res.data.job, ...prev])
      }
    } catch (err) {
      alert('Failed to clone job')
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await api.patch(`/jobs/${id}/status`, { status: newStatus })
      if (res.data.success) {
        setJobs(prev => prev.map(j => j._id === id ? res.data.job : j))
      }
    } catch (err) {
      alert('Failed to update job status')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this job? This action cannot be undone.')) return
    try {
      await api.delete(`/jobs/${id}`)
      setJobs(prev => prev.filter(j => j._id !== id))
    } catch (err) {
      alert('Failed to delete job')
    }
  }

  const filtered = useMemo(() => {
    return jobs.filter(j => {
      const matchSearch = j.title.toLowerCase().includes(search.toLowerCase()) ||
        (j.department || '').toLowerCase().includes(search.toLowerCase())
      const matchStatus = filterStatus === 'All' || j.status === filterStatus
      const matchType = filterType === 'All' || j.employmentType === filterType
      return matchSearch && matchStatus && matchType
    })
  }, [jobs, search, filterStatus, filterType])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  // Summary stats
  const stats = useMemo(() => ({
    active: jobs.filter(j => j.status === 'Published').length,
    draft: jobs.filter(j => j.status === 'Draft').length,
    closed: jobs.filter(j => j.status === 'Closed').length,
    total: jobs.length,
  }), [jobs])

  return (
    <div className="space-y-8 animate-page-in">

      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Heading3>{isRecruiter ? 'Job Openings' : 'Browse Jobs'}</Heading3>
          <p className="text-sm text-text-secondary mt-1">
            {isRecruiter ? 'Manage postings and monitor applicant volume.' : 'Discover your next opportunity.'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative group">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-gold transition-colors" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search jobs…"
              className="pl-10 pr-4 py-2.5 text-sm bg-black/40 border border-white/[0.08] rounded-xl text-white placeholder:text-text-muted focus:outline-none focus:border-gold/50 w-52 transition-all shadow-inner"
            />
          </div>

          {/* Filters */}
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
            className="py-2.5 px-3 text-sm bg-black/40 border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-gold/50 transition-all"
          >
            <option value="All">All Status</option>
            <option>Published</option><option>Draft</option><option>Closed</option>
          </select>
          <select
            value={filterType}
            onChange={e => { setFilterType(e.target.value); setPage(1) }}
            className="py-2.5 px-3 text-sm bg-black/40 border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-gold/50 transition-all"
          >
            <option value="All">All Types</option>
            <option>Full-time</option><option>Part-time</option><option>Contract</option>
            <option>Internship</option><option>Freelance</option><option>Apprenticeship</option>
          </select>

          {/* View Toggle */}
          <div className="hidden sm:flex bg-black/40 border border-white/[0.08] rounded-xl p-1 shadow-inner">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white shadow' : 'text-text-muted hover:text-white'}`}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white shadow' : 'text-text-muted hover:text-white'}`}>
              <List size={16} />
            </button>
          </div>

          <button onClick={fetchJobs} className="p-2.5 rounded-xl border border-white/[0.08] bg-black/40 text-text-muted hover:text-white hover:border-white/20 transition-all" title="Refresh">
            <RefreshCw size={16} />
          </button>

          {isRecruiter && (
            <Button leftIcon={<Plus size={16} />} onClick={() => navigate('/jobs/create')}>
              Post Job
            </Button>
          )}
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: isRecruiter ? 'Active Roles' : 'Total Jobs', v: isRecruiter ? stats.active : stats.total, c: 'text-white' },
          { l: isRecruiter ? 'Draft' : 'Published', v: isRecruiter ? stats.draft : stats.active, c: 'text-gold' },
          { l: 'Closed', v: stats.closed, c: 'text-text-muted' },
          { l: 'Showing', v: filtered.length, c: 'text-info' },
        ].map(({ l, v, c }) => (
          <div key={l} className="bg-black/20 border border-white/[0.04] p-4 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-text-muted tracking-widest block mb-1">{l}</span>
            <span className={`text-2xl font-black ${c}`}>{v}</span>
          </div>
        ))}
      </div>

      {/* Job Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-24 text-text-muted">
          <p className="text-lg font-bold text-white mb-2">No jobs found</p>
          <p className="text-sm">{isRecruiter ? 'Post your first job to get started.' : 'Check back soon for new opportunities.'}</p>
        </div>
      ) : (
        <motion.div
          key={`${page}-${search}-${filterStatus}-${filterType}`}
          initial="hidden" animate="show" variants={stagger}
          className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'grid grid-cols-1 gap-4'}
        >
          {paginated.map((job) => (
            <motion.div key={job._id} variants={fadeUp}>
              <JobCard
                job={job}
                onClone={isRecruiter ? handleClone : undefined}
                onStatusChange={isRecruiter ? handleStatusChange : undefined}
                onDelete={isRecruiter ? handleDelete : undefined}
                onAnalyze={isRecruiter ? setAnalyzingJob : undefined}
                onApply={!isRecruiter ? setApplyingJob : undefined}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-white/[0.08] bg-black/40 text-sm font-bold text-white disabled:opacity-30 hover:bg-white/5 transition-colors"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl border text-sm font-bold transition-colors ${p === page ? 'bg-gold text-black border-gold' : 'border-white/[0.08] bg-black/40 text-white hover:bg-white/5'}`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl border border-white/[0.08] bg-black/40 text-sm font-bold text-white disabled:opacity-30 hover:bg-white/5 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Apply Modal */}
      {applyingJob && (
        <ApplyModal
          job={applyingJob}
          onClose={() => setApplyingJob(null)}
          onSuccess={() => setApplyingJob(null)}
        />
      )}

      {/* AI Analysis Modal */}
      {analyzingJob && (
        <JobAnalysisModal
          job={analyzingJob}
          onClose={() => setAnalyzingJob(null)}
        />
      )}
    </div>
  )
}

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, AreaChart, Area, CartesianGrid, Legend
} from 'recharts'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { 
  Download, Sparkles, TrendingUp, Users, Briefcase, 
  AlertTriangle, Target, CheckCircle2, ChevronDown
} from 'lucide-react'
import api from '../services/api'
import { Heading3 } from '../design-system/Typography'
import Card from '../design-system/Card'
import Button from '../design-system/Button'

const COLORS = {
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  primary: '#0ea5e9',
  purple: '#a855f7',
  gold: '#fcd34d'
}

export default function Analytics() {
  const [data, setData] = useState(null)
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [insight, setInsight] = useState(null)
  const [generatingInsight, setGeneratingInsight] = useState(false)
  
  const dashboardRef = useRef(null)

  useEffect(() => {
    fetchJobs()
  }, [])

  useEffect(() => {
    fetchMetrics()
  }, [selectedJob])

  const fetchJobs = async () => {
    try {
      const res = await api.get('/jobs')
      if (res.data.success) {
        setJobs(res.data.jobs || [])
      }
    } catch (err) {
      console.error('Failed to fetch jobs', err)
    }
  }

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const url = selectedJob ? `/analytics?jobId=${selectedJob}` : '/analytics'
      const res = await api.get(url)
      if (res.data.success) {
        setData(res.data.metrics)
        setInsight(res.data.aiInsight)
      }
    } catch (err) {
      console.error('Failed to fetch metrics', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateInsight = async () => {
    try {
      setGeneratingInsight(true)
      const res = await api.post('/analytics/insight', { jobId: selectedJob || null })
      if (res.data.success) {
        setInsight(res.data.aiInsight)
      }
    } catch (err) {
      console.error('Failed to generate insight', err)
    } finally {
      setGeneratingInsight(false)
    }
  }

  const exportPDF = async () => {
    if (!dashboardRef.current) return
    try {
      const canvas = await html2canvas(dashboardRef.current, { backgroundColor: '#0a0a0a' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save('talentai-analytics.pdf')
    } catch (err) {
      console.error('Export failed', err)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[500px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const kpis = data?.kpis || {}
  const skills = data?.skills || { matched: [], missing: [], emerging: [] }

  return (
    <div className="space-y-8 animate-page-in pb-12 max-w-[1400px] mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-white/[0.04] py-6">
        <div>
          <Heading3>AI Analytics</Heading3>
          <p className="text-sm text-text-secondary mt-1">Real-time hiring intelligence and pipeline velocity.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="appearance-none bg-white/[0.04] border border-white/[0.08] text-white text-sm font-semibold rounded-xl py-2 pl-4 pr-10 focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
            >
              <option value="">Global (All Jobs)</option>
              {jobs.map(j => <option key={j._id} value={j._id}>{j.title}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-3 text-text-muted pointer-events-none" />
          </div>
          <Button 
            onClick={exportPDF} 
            variant="outline" 
            leftIcon={<Download size={16} />}
          >
            Export
          </Button>
        </div>
      </div>

      <div ref={dashboardRef} className="space-y-8 pb-8 bg-background p-2">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatBox label="Total Applicants" value={kpis.totalApplications} icon={Users} color="text-primary" />
          <StatBox label="Active Jobs" value={kpis.activeJobs} icon={Briefcase} color="text-purple-400" />
          <StatBox label="Avg Semantic" value={`${kpis.avgSemanticScore}%`} icon={Target} color="text-info" />
          <StatBox label="Avg Overall AI" value={`${kpis.avgOverallScore}`} icon={Sparkles} color="text-gold" />
          <StatBox label="Avg Time to Rank" value={`${kpis.avgTimeInDays}d`} icon={TrendingUp} color="text-warning" />
          <StatBox label="Strong Hires" value={kpis.totalStrongHires} icon={CheckCircle2} color="text-success" />
        </div>

        {/* AI Insight Panel */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 shadow-glow-primary">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 text-primary shadow-glow-primary">
                <Sparkles size={20} />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Copilot Strategic Insight</h3>
            </div>
            {!insight && !generatingInsight && (
              <Button onClick={handleGenerateInsight} className="bg-primary text-black font-bold text-sm shadow-glow-primary">
                Generate AI Insight
              </Button>
            )}
            {generatingInsight && <span className="text-sm text-primary font-bold animate-pulse">Generating...</span>}
          </div>

          {insight ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Summary</h4>
                  <p className="text-white text-base leading-relaxed">{insight.summary}</p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-bold text-warning uppercase tracking-widest mb-2 flex items-center gap-1.5"><AlertTriangle size={14}/> Top Risks</h4>
                    <ul className="space-y-1.5">
                      {insight.topHiringRisks?.map((r, i) => <li key={i} className="text-sm text-text-secondary">• {r}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-success uppercase tracking-widest mb-2 flex items-center gap-1.5"><Target size={14}/> Suggested Actions</h4>
                    <ul className="space-y-1.5">
                      {insight.suggestedNextActions?.map((a, i) => <li key={i} className="text-sm text-text-secondary">• {a}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="bg-black/40 border border-white/[0.05] rounded-xl p-5 space-y-5">
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Critical Skill Gap</p>
                  <p className="text-danger font-bold">{insight.mostImportantSkillGap}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Pool Quality</p>
                  <p className="text-gold font-bold">{insight.bestCandidatePoolQuality}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Interview Focus</p>
                  <div className="flex flex-wrap gap-2">
                    {insight.suggestedInterviewFocus?.map((f, i) => (
                      <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[11px] font-semibold text-text-secondary">{f}</span>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-white/5">
                  <Button onClick={handleGenerateInsight} variant="ghost" className="w-full text-xs h-8 text-primary">Regenerate Insight</Button>
                </div>
              </div>
            </div>
          ) : !generatingInsight && (
            <p className="text-sm text-text-secondary">Click the button above to generate a deep-dive AI analysis of your current hiring data.</p>
          )}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Funnel */}
          <Card hover={false} className="p-6">
            <h4 className="text-sm font-bold text-white mb-6">Hiring Funnel</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.funnel || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFunnel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                  <Area type="monotone" dataKey="value" stroke={COLORS.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorFunnel)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Recommendations */}
          <Card hover={false} className="p-6">
            <h4 className="text-sm font-bold text-white mb-6">AI Recommendation Breakdown</h4>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.recommendations || []}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    paddingAngle={5} dataKey="value"
                  >
                    <Cell fill={COLORS.success} />
                    <Cell fill={COLORS.primary} />
                    <Cell fill={COLORS.warning} />
                    <Cell fill={COLORS.danger} />
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Missing Skills */}
          <Card hover={false} className="p-6 lg:col-span-2">
            <h4 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
              <AlertTriangle size={16} className="text-danger" /> Most Common Missing Skills
            </h4>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skills.missing} margin={{ top: 0, right: 0, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} angle={-45} textAnchor="end" />
                  <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill={COLORS.danger} radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, icon: Icon, color }) {
  return (
    <Card hover={false} className="p-4 flex flex-col justify-between h-28 bg-surface/50 border border-white/[0.04]">
      <div className="flex justify-between items-start">
        <span className="text-xs font-bold text-text-muted uppercase tracking-widest w-2/3 leading-tight">{label}</span>
        <Icon size={16} className={color} />
      </div>
      <span className="text-3xl font-black text-white">{value}</span>
    </Card>
  )
}

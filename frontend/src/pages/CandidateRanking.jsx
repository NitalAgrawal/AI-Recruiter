import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Download, Trophy, Star, Briefcase, Book, Cpu,
  ThumbsUp, ThumbsDown, CheckCircle, Search, FileText, MessageSquare, Calendar
} from 'lucide-react'
import api, { BACKEND_URL } from '../services/api'
import { Heading3, Heading4 } from '../design-system/Typography'
import Card from '../design-system/Card'
import Button from '../design-system/Button'
import CopilotChat from '../components/CopilotChat'

function ScorePill({ label, score, colorClass = "bg-primary text-black" }) {
  if (score === null || score === undefined) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-text-muted font-bold tracking-widest uppercase">{label}</span>
      <span className={`px-2 py-0.5 rounded-md text-xs font-bold w-fit ${colorClass}`}>{score}</span>
    </div>
  )
}

function RecommendationBadge({ recommendation }) {
  const config = {
    'Strong Hire': { icon: Trophy, bg: 'bg-success/20', text: 'text-success', border: 'border-success/30' },
    'Hire': { icon: ThumbsUp, bg: 'bg-primary/20', text: 'text-primary', border: 'border-primary/30' },
    'Consider': { icon: Search, bg: 'bg-warning/20', text: 'text-warning', border: 'border-warning/30' },
    'Not Recommended': { icon: ThumbsDown, bg: 'bg-danger/20', text: 'text-danger', border: 'border-danger/30' },
  }
  const c = config[recommendation] || config['Consider']
  const Icon = c.icon
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${c.bg} ${c.text} ${c.border} text-xs font-bold`}>
      <Icon size={14} /> {recommendation}
    </div>
  )
}

export default function CandidateRanking() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  
  const [job, setJob] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [pollingId, setPollingId] = useState(null)
  const [copilotOpen, setCopilotOpen] = useState(false)
  
  useEffect(() => {
    fetchData()
    return () => { if (pollingId) clearInterval(pollingId) }
  }, [jobId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [jobRes, rankRes] = await Promise.all([
        api.get(`/jobs/${jobId}`),
        api.get(`/ranking/job/${jobId}`)
      ])
      if (jobRes.data.success) setJob(jobRes.data.job)
      if (rankRes.data.success) {
        setCandidates(rankRes.data.applications)
        checkPolling(rankRes.data.applications)
      }
    } catch (err) {
      console.error('Failed to fetch ranking data', err)
    } finally {
      setLoading(false)
    }
  }

  const checkPolling = (apps) => {
    const isProcessing = apps.some(a => a.ranking?.status === 'Processing')
    if (isProcessing && !pollingId) {
      const id = setInterval(async () => {
        try {
          const res = await api.get(`/ranking/job/${jobId}`)
          if (res.data.success) {
            setCandidates(res.data.applications)
            if (!res.data.applications.some(a => a.ranking?.status === 'Processing')) {
              clearInterval(id)
              setPollingId(null)
            }
          }
        } catch (err) {
          clearInterval(id)
          setPollingId(null)
        }
      }, 3000)
      setPollingId(id)
    }
  }

  const handleGenerateRankings = async () => {
    try {
      setIsGenerating(true)
      await api.post(`/ranking/job/${jobId}`)
      fetchData() // this will trigger polling
    } catch (err) {
      console.error('Failed to start ranking', err)
      alert('Failed to start ranking generation')
    } finally {
      setIsGenerating(false)
    }
  }

  const isProcessing = candidates.some(a => a.ranking?.status === 'Processing')

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 animate-page-in">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-20 z-30 bg-background/80 backdrop-blur-xl border-b border-white/[0.04] pb-4 pt-4 -mx-8 px-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/jobs')} className="p-2 hover:bg-white/5 rounded-full transition-colors text-text-muted hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div>
            <Heading3>AI Candidate Ranking</Heading3>
            <p className="text-sm text-text-secondary mt-1">{job?.title || 'Loading Job...'}</p>
          </div>
        </div>
        <Button 
          onClick={handleGenerateRankings} 
          loading={isGenerating || isProcessing}
          leftIcon={<Cpu size={16} />} 
          className="shadow-glow-primary bg-primary hover:bg-primary-dark text-black font-bold"
        >
          {isProcessing ? 'Generating Rankings...' : 'Generate New Rankings'}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-20 text-text-muted">No candidates found for this job.</div>
      ) : (
        <div className="space-y-6">
          {candidates.map((app, index) => {
            const r = app.ranking || {}
            const isTop = index === 0 && r.status === 'Completed'
            
            return (
              <motion.div
                key={app._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  hover={false} 
                  className={`overflow-hidden relative ${isTop ? 'border-gold shadow-glow-gold' : ''}`}
                >
                  {isTop && (
                    <div className="absolute top-0 right-0 bg-gold text-black text-xs font-black px-4 py-1.5 rounded-bl-xl flex items-center gap-1.5 shadow-lg">
                      <Trophy size={14} /> #1 MATCH
                    </div>
                  )}

                  {/* Header Row */}
                  <div className="p-6 border-b border-white/[0.04] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black ${isTop ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-white/[0.04] text-white border border-white/[0.08]'}`}>
                        #{index + 1}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white mb-1">{app.candidate?.fullName}</h4>
                        <div className="flex items-center gap-3 text-sm text-text-muted font-medium">
                          {app.candidateProfile?.professionalTitle && <span className="flex items-center gap-1.5"><Briefcase size={14} /> {app.candidateProfile.professionalTitle}</span>}
                          {app.candidateProfile?.yearsOfExperience > 0 && <span className="flex items-center gap-1.5"><Clock size={14} /> {app.candidateProfile.yearsOfExperience} yrs exp</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      {r.status === 'Completed' ? (
                        <>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-text-muted font-bold tracking-widest uppercase mb-1">Overall AI Score</span>
                            <span className="text-3xl font-black text-white">{r.overallScore}</span>
                          </div>
                          {r.recommendation && <RecommendationBadge recommendation={r.recommendation} />}
                        </>
                      ) : r.status === 'Processing' ? (
                        <span className="text-sm font-bold text-primary animate-pulse">Processing...</span>
                      ) : (
                        <span className="text-sm font-bold text-text-muted">Not Ranked</span>
                      )}
                    </div>
                  </div>

                  {/* Detail Row */}
                  {r.status === 'Completed' && (
                    <div className="p-6 bg-black/20 flex flex-col lg:flex-row gap-8">
                      {/* Left: Scores Breakdown */}
                      <div className="w-full lg:w-1/3 space-y-6 border-b lg:border-b-0 lg:border-r border-white/[0.04] pb-6 lg:pb-0 lg:pr-8">
                        <div>
                          <h5 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Score Breakdown</h5>
                          <div className="flex flex-wrap gap-4">
                            <ScorePill label="Semantic" score={r.semanticScore} colorClass="bg-info text-black" />
                            <ScorePill label="Experience" score={r.experienceScore} colorClass="bg-gold text-black" />
                            <ScorePill label="Projects" score={r.projectScore} colorClass="bg-success text-black" />
                            <ScorePill label="Education" score={r.educationScore} colorClass="bg-purple-400 text-black" />
                            <ScorePill label="Platform" score={r.platformScore} colorClass="bg-primary text-black" />
                            <ScorePill label="Profile" score={r.profileScore} colorClass="bg-white text-black" />
                          </div>
                        </div>

                        {app.resumeFile && (
                          <a 
                            href={`${BACKEND_URL}${app.resumeFile}`} 
                            target="_blank" rel="noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm font-bold text-white hover:bg-white/[0.08] transition-colors w-full justify-center"
                          >
                            <FileText size={16} /> View Resume
                          </a>
                        )}
                        <Button
                          onClick={() => navigate(`/applications/${app._id}/interview`)}
                          variant="outline"
                          leftIcon={<Calendar size={16} />}
                          className="w-full justify-center border-primary/30 text-primary hover:bg-primary/10"
                        >
                          Interview Planner
                        </Button>
                      </div>

                      {/* Right: AI Insights */}
                      <div className="w-full lg:w-2/3 space-y-5">
                        {r.scoreExplanation && (
                          <div className="text-sm text-white leading-relaxed p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                            <Star size={16} className="text-gold inline mr-2 mb-0.5" />
                            {r.scoreExplanation}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h5 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5"><CheckCircle size={14} className="text-success" /> Strengths</h5>
                            <ul className="space-y-1.5">
                              {r.strengths?.map((s, i) => <li key={i} className="text-sm text-text-secondary">• {s}</li>)}
                            </ul>
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5"><ThumbsDown size={14} className="text-danger" /> Weaknesses</h5>
                            <ul className="space-y-1.5">
                              {r.weaknesses?.map((w, i) => <li key={i} className="text-sm text-text-secondary">• {w}</li>)}
                            </ul>
                          </div>
                        </div>

                        {r.recommendedInterviewTopics?.length > 0 && (
                          <div>
                            <h5 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 flex items-center gap-1.5"><Book size={14} className="text-purple-400" /> Suggested Interview Topics</h5>
                            <div className="flex flex-wrap gap-2">
                              {r.recommendedInterviewTopics.map((topic, i) => (
                                <span key={i} className="px-3 py-1.5 bg-purple-400/10 border border-purple-400/20 rounded-lg text-xs font-semibold text-purple-400">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Floating Copilot Toggle */}
      {!copilotOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setCopilotOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-black rounded-full shadow-glow-primary flex items-center justify-center hover:scale-105 transition-transform z-30"
        >
          <MessageSquare size={24} />
        </motion.button>
      )}

      {/* Copilot Chat Panel */}
      <CopilotChat 
        jobId={jobId} 
        isOpen={copilotOpen} 
        onClose={() => setCopilotOpen(false)} 
      />
    </div>
  )
}

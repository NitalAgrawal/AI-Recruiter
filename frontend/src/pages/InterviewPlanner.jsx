import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Download, FileText, Printer, CheckCircle,
  AlertTriangle, Target, MessageSquare, Plus, Minus,
  ChevronDown, ChevronUp, Check
} from 'lucide-react'
import api from '../services/api'
import { Heading3, Heading4 } from '../design-system/Typography'
import Card from '../design-system/Card'
import Button from '../design-system/Button'

export default function InterviewPlanner() {
  const { applicationId } = useParams()
  const navigate = useNavigate()
  
  const [application, setApplication] = useState(null)
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Scorecard state
  const [scorecard, setScorecard] = useState({
    technicalKnowledge: 0,
    communication: 0,
    problemSolving: 0,
    leadership: 0,
    culturalFit: 0
  })
  const [interviewerNotes, setInterviewerNotes] = useState('')
  const [finalDecision, setFinalDecision] = useState('Pending')

  // UI state
  const [expandedStages, setExpandedStages] = useState({})

  useEffect(() => {
    fetchData()
  }, [applicationId])

  const fetchData = async () => {
    try {
      setLoading(true)
      // We can fetch the application to get candidate details
      const appRes = await api.get(`/applications/${applicationId}`)
      if (appRes.data.success) {
        setApplication(appRes.data.application)
      }
      
      // Fetch plan
      const planRes = await api.get(`/interview-planner/${applicationId}`)
      if (planRes.data.success && planRes.data.plan) {
        setPlan(planRes.data.plan)
        setScorecard(planRes.data.plan.scorecard || scorecard)
        setInterviewerNotes(planRes.data.plan.interviewerNotes || '')
        setFinalDecision(planRes.data.plan.finalDecision || 'Pending')
        
        // expand first stage by default
        if (planRes.data.plan.stages?.length > 0) {
          setExpandedStages({ 0: true })
        }
      }
    } catch (err) {
      console.error('Failed to fetch interview planner data', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePlan = async () => {
    try {
      setGenerating(true)
      const res = await api.post(`/interview-planner/${applicationId}`)
      if (res.data.success) {
        setPlan(res.data.plan)
        if (res.data.plan.stages?.length > 0) setExpandedStages({ 0: true })
      }
    } catch (err) {
      console.error('Generation failed', err)
      alert('Failed to generate plan.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveScorecard = async () => {
    try {
      setSaving(true)
      await api.put(`/interview-planner/${plan._id}/scorecard`, {
        scorecard,
        notes: interviewerNotes,
        decision: finalDecision
      })
      alert('Scorecard saved successfully!')
    } catch (err) {
      console.error('Failed to save scorecard', err)
      alert('Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const toggleStage = (index) => {
    setExpandedStages(prev => ({ ...prev, [index]: !prev[index] }))
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 animate-page-in print:text-black print:bg-white">
      {/* Header (Hidden on Print) */}
      <div className="flex items-center justify-between sticky top-20 z-30 bg-background/90 backdrop-blur-xl border-b border-white/[0.04] py-4 print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full text-text-muted hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <Heading3>Interview Planner</Heading3>
            <p className="text-sm text-text-secondary mt-1">
              {application?.candidate?.fullName} - {application?.job?.title}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {plan && (
            <Button onClick={handlePrint} variant="outline" leftIcon={<Printer size={16} />}>
              Print Sheet
            </Button>
          )}
          {!plan && (
            <Button onClick={handleGeneratePlan} loading={generating} className="bg-primary text-black font-bold shadow-glow-primary">
              Generate AI Interview Plan
            </Button>
          )}
        </div>
      </div>

      {!plan && !generating && (
        <div className="text-center py-32 text-text-muted print:hidden">
          <FileText size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-lg">No interview plan generated yet.</p>
          <p className="text-sm mt-2 max-w-sm mx-auto">Click the button above to generate a highly customized interview agenda based on the candidate's semantic gaps and AI ranking.</p>
        </div>
      )}

      {generating && (
        <div className="text-center py-32 text-primary animate-pulse print:hidden">
          Generating personalized interview plan...
        </div>
      )}

      {plan && (
        <div className="space-y-8">
          {/* Printable Header (Visible only on print, or styled for both) */}
          <div className="hidden print:block mb-8 border-b-2 border-black pb-4">
            <h1 className="text-3xl font-bold">Interview Agenda & Scorecard</h1>
            <p className="text-xl mt-2">Candidate: {application?.candidate?.fullName}</p>
            <p className="text-lg text-gray-600">Role: {application?.job?.title}</p>
          </div>

          {/* Top Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 print:text-black">
            <Card hover={false} className="p-6 bg-surface/50 print:border-black print:bg-transparent print:shadow-none">
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2 print:text-gray-800">
                <Target size={14} className="text-primary print:text-black" /> Focus Areas
              </h4>
              <ul className="space-y-2">
                {plan.focusAreas?.map((area, i) => (
                  <li key={i} className="text-sm font-medium text-white print:text-black flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full print:bg-black" /> {area}
                  </li>
                ))}
              </ul>
            </Card>

            <Card hover={false} className="p-6 bg-surface/50 print:border-black print:bg-transparent print:shadow-none">
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2 print:text-gray-800">
                <AlertTriangle size={14} className="text-warning print:text-black" /> Risk Areas
              </h4>
              <ul className="space-y-2">
                {plan.riskAreas?.map((area, i) => (
                  <li key={i} className="text-sm font-medium text-white print:text-black flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-warning rounded-full print:bg-black" /> {area}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex justify-between items-center pt-4 border-t border-white/[0.05] print:border-black">
                <span className="text-sm text-text-secondary print:text-black">Total Duration:</span>
                <span className="font-bold text-white print:text-black">{plan.totalDurationMinutes} minutes</span>
              </div>
            </Card>
          </div>

          {/* Stages & Questions */}
          <div className="space-y-6 print:space-y-8">
            <h3 className="text-lg font-bold text-white print:text-black">Interview Stages</h3>
            
            {plan.stages?.map((stage, sIndex) => {
              const isExpanded = expandedStages[sIndex] || false;
              
              return (
                <Card key={sIndex} hover={false} className="overflow-hidden print:border-black print:bg-transparent print:shadow-none print:break-inside-avoid">
                  {/* Stage Header */}
                  <div 
                    onClick={() => toggleStage(sIndex)}
                    className="p-5 flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-colors print:bg-gray-100 print:cursor-auto"
                  >
                    <div>
                      <h4 className="font-bold text-white text-lg print:text-black">{stage.stageName}</h4>
                      <p className="text-sm text-text-secondary mt-1 print:text-gray-700">{stage.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-primary print:text-black bg-primary/10 print:bg-transparent px-3 py-1 rounded-lg">
                        {stage.durationMinutes} mins
                      </span>
                      <button className="text-text-muted hover:text-white print:hidden">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Stage Questions (Always expanded on print) */}
                  <AnimatePresence initial={false}>
                    {(isExpanded || window.matchMedia('print').matches) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="print:block print:opacity-100 print:h-auto"
                      >
                        <div className="p-5 space-y-6">
                          {stage.questions?.map((q, qIndex) => (
                            <div key={qIndex} className="pb-6 border-b border-white/[0.05] last:border-0 last:pb-0 print:border-gray-300">
                              <div className="flex gap-3 mb-3">
                                <span className="font-black text-primary text-xl print:text-black shrink-0">Q{qIndex + 1}.</span>
                                <h5 className="font-semibold text-white text-base leading-relaxed print:text-black">{q.question}</h5>
                              </div>
                              
                              <div className="ml-8 space-y-4">
                                {q.expectedAnswer && (
                                  <div className="bg-black/30 p-4 rounded-xl border border-white/[0.05] print:bg-transparent print:border-gray-300 print:p-2">
                                    <span className="text-xs font-bold text-success uppercase tracking-wider mb-1 block print:text-gray-800">Expected Answer</span>
                                    <p className="text-sm text-text-secondary print:text-black">{q.expectedAnswer}</p>
                                  </div>
                                )}
                                
                                <div className="flex flex-col md:flex-row gap-4 print:gap-2">
                                  {q.evaluationCriteria && (
                                    <div className="flex-1">
                                      <span className="text-xs font-bold text-info uppercase tracking-wider mb-1 block print:text-gray-800">Evaluation Criteria</span>
                                      <p className="text-sm text-text-secondary print:text-black">{q.evaluationCriteria}</p>
                                    </div>
                                  )}
                                  {q.followUpQuestion && (
                                    <div className="flex-1">
                                      <span className="text-xs font-bold text-warning uppercase tracking-wider mb-1 block print:text-gray-800">Follow-up</span>
                                      <p className="text-sm text-text-secondary italic print:text-black">{q.followUpQuestion}</p>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center justify-between pt-2">
                                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                                    q.difficulty === 'Expert' ? 'bg-danger/20 text-danger' : 
                                    q.difficulty === 'Hard' ? 'bg-warning/20 text-warning' : 
                                    q.difficulty === 'Beginner' ? 'bg-success/20 text-success' : 'bg-white/10 text-white'
                                  } print:bg-transparent print:text-black print:border print:border-black`}>
                                    {q.difficulty}
                                  </span>
                                  
                                  {/* Print-only Checkbox for manual grading */}
                                  <div className="hidden print:flex items-center gap-4">
                                    <span className="text-xs text-gray-500">Score (1-5): ____</span>
                                    <span className="text-xs text-gray-500">Notes: ___________________________</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              )
            })}
          </div>

          {/* Interactive Scorecard (Hidden on print) */}
          <div className="pt-8 print:hidden">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><CheckCircle size={20} className="text-success" /> Interview Scorecard</h3>
            <Card hover={false} className="p-8 bg-surface/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                  {Object.keys(scorecard).map(metric => (
                    <div key={metric}>
                      <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium text-white capitalize">{metric.replace(/([A-Z])/g, ' $1').trim()}</label>
                        <span className="text-sm font-bold text-primary">{scorecard[metric]} / 10</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="10" 
                        value={scorecard[metric]} 
                        onChange={(e) => setScorecard({...scorecard, [metric]: parseInt(e.target.value)})}
                        className="w-full accent-primary bg-white/10 rounded-lg h-2"
                      />
                    </div>
                  ))}
                </div>
                
                <div className="space-y-6 flex flex-col">
                  <div className="flex-1 flex flex-col">
                    <label className="text-sm font-medium text-white mb-2">Interviewer Notes</label>
                    <textarea 
                      value={interviewerNotes}
                      onChange={(e) => setInterviewerNotes(e.target.value)}
                      className="flex-1 bg-black/40 border border-white/[0.08] rounded-xl p-4 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors resize-none min-h-[120px]"
                      placeholder="Enter detailed feedback from the interview..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Final Decision</label>
                    <div className="flex flex-wrap gap-3">
                      {['Strong Hire', 'Hire', 'Hold', 'Reject'].map(dec => (
                        <button
                          key={dec}
                          onClick={() => setFinalDecision(dec)}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors border ${
                            finalDecision === dec 
                              ? (dec === 'Strong Hire' ? 'bg-success/20 border-success text-success' : 
                                 dec === 'Hire' ? 'bg-primary/20 border-primary text-primary' : 
                                 dec === 'Reject' ? 'bg-danger/20 border-danger text-danger' : 'bg-warning/20 border-warning text-warning')
                              : 'bg-transparent border-white/[0.1] text-text-muted hover:bg-white/[0.05]'
                          }`}
                        >
                          {dec}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-6 border-t border-white/[0.05]">
                <Button onClick={handleSaveScorecard} loading={saving} className="bg-success hover:bg-success-dark text-black font-bold">
                  Submit Evaluation
                </Button>
              </div>
            </Card>
          </div>

        </div>
      )}
    </div>
  )
}

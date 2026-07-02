import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Mic, Video, PhoneOff, Settings, Sparkles, AlertCircle,
  FileText, CheckCircle2, Bot, User, Maximize2
} from 'lucide-react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts'
import Card from '../design-system/Card'
import Avatar from '../design-system/Avatar'
import Button from '../design-system/Button'
import Badge, { ScoreBadge } from '../design-system/Badge'
import { Heading3, Heading4 } from '../design-system/Typography'

/* ── Data ── */
const SKILL_DATA = [
  { subject: 'React',      A: 90, fullMark: 100 },
  { subject: 'Arch',       A: 85, fullMark: 100 },
  { subject: 'Comm',       A: 95, fullMark: 100 },
  { subject: 'System',     A: 70, fullMark: 100 },
  { subject: 'Agile',      A: 80, fullMark: 100 },
]

const TRANSCRIPT = [
  { speaker: 'ai', text: 'Welcome Jordan. Could you walk me through a challenging architectural decision you made in your last React project?' },
  { speaker: 'human', text: 'Sure. We had a monolithic SPA that was taking 8 seconds to load. I decided to implement micro-frontends using Module Federation...' },
  { speaker: 'ai', text: 'That is a significant shift. How did you handle shared state and routing between the micro-apps?' },
  { speaker: 'human', text: 'We used a global event bus for loose coupling, and kept the routing at the shell application level...' },
]

export default function Interview() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [time, setTime] = useState(0)

  useEffect(() => {
    if (!isPlaying) return
    const id = setInterval(() => setTime(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [isPlaying])

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col xl:flex-row gap-6 animate-page-in">
      
      {/* ── Left: Video & Controls ── */}
      <div className="flex-[3] flex flex-col gap-6">
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-black border border-white/[0.05] shadow-2xl group flex items-center justify-center">
          {/* Mock Video BG */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
          <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1600&auto=format&fit=crop')] bg-cover bg-center" />
          
          {/* Center Info */}
          <div className="relative z-20 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-2 border-white/10 flex items-center justify-center mb-4 overflow-hidden relative shadow-2xl">
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop" alt="Jordan" className="w-full h-full object-cover" />
              {isPlaying && (
                <div className="absolute inset-0 ring-4 ring-gold/50 rounded-full animate-pulse-gold pointer-events-none" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Jordan Mitchell</h2>
            <p className="text-sm text-text-secondary">Senior React Engineer Candidate</p>
          </div>

          {/* Top Overlays */}
          <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/[0.08] text-xs font-bold text-white">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-danger animate-pulse' : 'bg-text-muted'}`} />
              {formatTime(time)}
            </div>
            <div className="px-3 py-1.5 rounded-full bg-gold/20 backdrop-blur-md border border-gold/30 text-xs font-bold text-gold flex items-center gap-1.5">
              <Sparkles size={12} /> AI Assisted
            </div>
          </div>
          <button className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/[0.08] flex items-center justify-center text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100">
            <Maximize2 size={16} />
          </button>

          {/* Bottom Controls */}
          <div className="absolute bottom-8 inset-x-0 z-20 flex justify-center gap-4">
            <button className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-lg border border-white/[0.1] flex items-center justify-center text-white hover:bg-white/10 transition-all shadow-lg hover:scale-105">
              <Mic size={20} />
            </button>
            <button className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-lg border border-white/[0.1] flex items-center justify-center text-white hover:bg-white/10 transition-all shadow-lg hover:scale-105">
              <Video size={20} />
            </button>
            <button className="w-14 h-14 rounded-full bg-danger/80 backdrop-blur-lg border border-danger flex items-center justify-center text-white hover:bg-danger transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:scale-105">
              <PhoneOff size={20} />
            </button>
            <button className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-lg border border-white/[0.1] flex items-center justify-center text-white hover:bg-white/10 transition-all shadow-lg hover:scale-105">
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* AI Insight Bar */}
        <Card padding={false} hover={false} className="shrink-0">
          <div className="p-4 flex items-center gap-4 bg-gradient-to-r from-gold/10 to-transparent border-l-2 border-gold rounded-l-md">
            <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles size={18} className="text-gold" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gold mb-1">Live AI Insight</p>
              <p className="text-sm text-white font-medium">Candidate demonstrates strong grasp of micro-frontend orchestration. Proceed to probe on CI/CD pipelines.</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Right: Sidebar ── */}
      <div className="flex-[2] flex flex-col gap-6 h-full">
        
        {/* Real-time Analysis */}
        <Card hover={false} className="shrink-0">
          <Card.Header className="mb-4">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-text-muted" />
              <Heading4>Real-time Assessment</Heading4>
            </div>
            <ScoreBadge score={92} />
          </Card.Header>
          <div className="h-48 -mx-4 -mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={SKILL_DATA}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9A9A9A', fontSize: 11, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Jordan" dataKey="A" stroke="#D4AF37" strokeWidth={2} fill="#D4AF37" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Live Transcript */}
        <Card hover={false} className="flex-1 flex flex-col overflow-hidden">
          <Card.Header className="shrink-0 mb-4 pb-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-text-muted" />
              <Heading4>Live Transcript</Heading4>
            </div>
            <span className="text-[10px] uppercase font-bold text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20">Auto-scrolling</span>
          </Card.Header>
          <div className="flex-1 overflow-y-auto pr-2 space-y-5 no-scrollbar">
            {TRANSCRIPT.map((msg, i) => {
              const isAi = msg.speaker === 'ai'
              return (
                <div key={i} className={`flex gap-3 max-w-[85%] ${isAi ? '' : 'ml-auto flex-row-reverse'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isAi ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-elevated text-text-secondary border border-border'}`}>
                    {isAi ? <Bot size={14} /> : <User size={14} />}
                  </div>
                  <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                    isAi ? 'bg-white/[0.03] text-text-secondary rounded-tl-sm border border-white/[0.05]' : 'bg-gold/10 text-white rounded-tr-sm border border-gold/20'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              )
            })}
            {isPlaying && (
              <div className="flex gap-3 items-center ml-10">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
        </Card>

      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Calendar, ArrowUpRight, TrendingUp, ChevronDown } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts'
import Card from '../design-system/Card'
import Button from '../design-system/Button'
import { Heading3 } from '../design-system/Typography'

/* ── Data ── */
const KPI_DATA = [
  { label: 'Time to Hire', value: '18 Days', trend: '-2 Days', status: 'positive' },
  { label: 'Offer Acceptance', value: '78%', trend: '+4%', status: 'positive' },
  { label: 'Cost per Hire', value: '$4.2k', trend: '-$800', status: 'positive' },
  { label: 'Candidate Quality', value: '92/100', trend: 'Top 10%', status: 'neutral' },
]

const PIPELINE_DATA = [
  { name: 'Jan', applied: 400, hired: 10 },
  { name: 'Feb', applied: 300, hired: 15 },
  { name: 'Mar', applied: 550, hired: 20 },
  { name: 'Apr', applied: 480, hired: 12 },
  { name: 'May', applied: 700, hired: 25 },
  { name: 'Jun', applied: 850, hired: 35 },
]

const SOURCE_DATA = [
  { name: 'LinkedIn', value: 45, color: '#D4AF37' },
  { name: 'Referral', value: 30, color: '#3B82F6' },
  { name: 'Direct',   value: 15, color: '#22C55E' },
  { name: 'Other',    value: 10, color: '#6B7280' },
]

const stagger = { show: { transition: { staggerChildren: 0.1 } } }
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-3 mb-1 last:mb-0">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-sm font-semibold text-text-secondary">{entry.name}:</span>
            <span className="text-sm font-bold text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function Reports() {
  const [range, setRange] = useState('Last 6 Months')

  return (
    <div className="space-y-8 animate-page-in">
      
      {/* ── Top Bar ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Heading3>Analytics & Reports</Heading3>
          <p className="text-sm text-text-secondary mt-1">Data-driven insights to optimize your hiring process.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="appearance-none bg-black/40 border border-white/[0.08] rounded-xl pl-4 pr-10 py-2 text-sm font-semibold text-white focus:outline-none focus:border-gold/50 cursor-pointer shadow-inner h-10"
            >
              {['Last 30 Days', 'Last 3 Months', 'Last 6 Months', 'Year to Date'].map(r => <option key={r} className="bg-elevated">{r}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
          <Button variant="outline" leftIcon={<Download size={16} />}>Export CSV</Button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <motion.div initial="hidden" animate="show" variants={stagger} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {KPI_DATA.map((kpi, i) => (
          <motion.div key={kpi.label} variants={fadeUp}>
            <Card hover={false} className="relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/[0.02] to-transparent rounded-bl-full pointer-events-none" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-4">{kpi.label}</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-black text-white tracking-tight">{kpi.value}</span>
                <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                  kpi.status === 'positive' ? 'bg-success/10 text-success border-success/20' : 'bg-white/5 text-text-secondary border-white/10'
                }`}>
                  {kpi.status === 'positive' && <TrendingUp size={12} />}
                  {kpi.trend}
                </span>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <Card hover={false} className="xl:col-span-2">
          <Card.Header className="mb-8">
            <div>
              <span className="section-label block mb-1">Pipeline Volume</span>
              <Heading3>Applications vs Hires</Heading3>
            </div>
            <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight size={14} />}>Details</Button>
          </Card.Header>
          <div className="h-[340px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PIPELINE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApplied" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHired" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#6B7280" tick={{ fill: '#6B7280', fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#6B7280" tick={{ fill: '#6B7280', fontSize: 12 }} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="applied" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorApplied)" activeDot={{ r: 6, fill: '#D4AF37', stroke: '#000', strokeWidth: 2 }} />
                <Area type="monotone" dataKey="hired" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorHired)" activeDot={{ r: 6, fill: '#3B82F6', stroke: '#000', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Breakdown Chart */}
        <Card hover={false} className="flex flex-col">
          <Card.Header className="mb-6 shrink-0">
            <div>
              <span className="section-label block mb-1">Source</span>
              <Heading3>Candidate Origin</Heading3>
            </div>
          </Card.Header>
          <div className="flex-1 min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={SOURCE_DATA} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value" stroke="none">
                  {SOURCE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-y-4 gap-x-2 mt-4 shrink-0">
            {SOURCE_DATA.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: entry.color }} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{entry.name}</p>
                  <p className="text-sm font-black text-white">{entry.value}%</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

    </div>
  )
}

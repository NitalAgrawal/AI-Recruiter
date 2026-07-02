import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap, ArrowRight, Star, ChevronRight,
  Users, Briefcase, BarChart3, Clock, Shield, Brain,
  Sparkles, Code, Play
} from 'lucide-react'
import Button from '../design-system/Button'
import { GoldText, Label, Heading2, Body } from '../design-system/Typography'
import Card from '../design-system/Card'
import Avatar, { AvatarGroup } from '../design-system/Avatar'
import { ScoreBadge } from '../design-system/Badge'

/* ── Data ──────────────────────────────────────────────── */
const STATS = [
  { value: '2.4M+', label: 'Candidates Screened' },
  { value: '12k+', label: 'Companies Trust Us' },
  { value: '340k+', label: 'Successful Hires' },
  { value: '4.9/5', label: 'Average Rating' },
]

const FEATURES = [
  {
    icon: Brain,
    title: 'AI-Powered Screening',
    desc: 'Our models score and rank candidates against job requirements in seconds, eliminating hours of manual review.',
    color: 'text-gold',
    bg: 'bg-gold/10',
  },
  {
    icon: Shield,
    title: 'Bias-Free Evaluation',
    desc: 'Structured AI assessments remove unconscious bias, helping you build diverse, high-performing teams.',
    color: 'text-info',
    bg: 'bg-info/10',
  },
  {
    icon: BarChart3,
    title: 'Predictive Analytics',
    desc: 'Data-driven dashboards predict performance outcomes and visualize pipeline health in real-time.',
    color: 'text-success',
    bg: 'bg-success/10',
  },
  {
    icon: Clock,
    title: 'Automated Scheduling',
    desc: 'AI manages interview scheduling, reminders, and follow-ups across your entire candidate pipeline.',
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  {
    icon: Users,
    title: 'Collaborative Hiring',
    desc: 'Shared scorecards, notes, and decision workflows keep your entire hiring team aligned.',
    color: 'text-gold',
    bg: 'bg-gold/10',
  },
  {
    icon: Code,
    title: 'ATS Integration',
    desc: 'Connect with Greenhouse, Lever, Workday, and 40+ platforms via plug-and-play integrations.',
    color: 'text-info',
    bg: 'bg-info/10',
  },
]

const STEPS = [
  { n: '01', title: 'Post Your Role', desc: 'Define the position, skills, and culture fit criteria. Our AI auto-generates screening rubrics.' },
  { n: '02', title: 'AI Screens Applicants', desc: 'Every application is analysed, scored, and ranked by your custom criteria within minutes.' },
  { n: '03', title: 'Conduct AI Interviews', desc: 'Shortlisted candidates complete AI video interviews, with real-time transcripts and scoring.' },
  { n: '04', title: 'Hire Confidently', desc: 'Review ranked candidates, team feedback, and AI insights — then make your offer.' },
]

const TESTIMONIALS = [
  { name: 'Elena Vasquez', role: 'VP of Talent, Stripe', quote: 'AI-Recruiter cut our time-to-hire from 6 weeks to 9 days. The quality of shortlisted candidates improved dramatically.', rating: 5, avatar: 'Elena Vasquez' },
  { name: 'Marcus Webb', role: 'CTO, Notion', quote: 'The AI interview analysis is uncanny. It surfaces insights about candidates that take our humans weeks to discover.', rating: 5, avatar: 'Marcus Webb' },
  { name: 'Priya Nair', role: 'Head of People, Figma', quote: 'We\'ve built our most diverse engineering team ever. AI-Recruiter\'s bias-free screening is genuinely game-changing.', rating: 5, avatar: 'Priya Nair' },
  { name: 'David Park', role: 'Talent Director, OpenAI', quote: 'Best recruitment investment we\'ve made. The analytics alone justify the cost, and the time savings are enormous.', rating: 5, avatar: 'David Park' },
]

/* ── Animation Variants ─────────────────────────────────── */
const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }
const stagger = { show: { transition: { staggerChildren: 0.1 } } }

/* ── Component ─────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-primary overflow-x-hidden selection:bg-gold/30 selection:text-white">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-12 h-20 bg-primary/60 backdrop-blur-2xl border-b border-white/[0.04]">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo(0,0)}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-gold group-hover:shadow-gold-lg transition-all duration-300">
            <Zap size={16} className="text-primary" fill="currentColor" />
          </div>
          <div>
            <span className="text-base font-black text-white tracking-tight leading-none block group-hover:text-gold transition-colors">AI-Recruiter</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-10 text-sm font-semibold text-text-secondary">
          {['Features', 'How It Works', 'Pricing', 'Testimonials'].map((t) => (
            <a key={t} href={`#${t.toLowerCase().replace(/ /g, '-')}`} className="hover:text-white transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:h-px after:w-0 after:bg-gold hover:after:w-full after:transition-all after:duration-300">{t}</a>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="hidden sm:flex">Sign In</Button>
          <Button size="sm" onClick={() => navigate('/dashboard')}>Get Started</Button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 inset-x-0 h-[600px] bg-hero-gradient pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gold/5 blur-[120px] pointer-events-none animate-glow-pulse" />

        <motion.div initial="hidden" animate="show" variants={stagger} className="relative max-w-5xl mx-auto text-center z-10">
          
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-gold/30 text-xs font-bold text-gold mb-8 shadow-[0_0_20px_rgba(212,175,55,0.1)] backdrop-blur-md">
            <Sparkles size={14} />
            Powered by GPT-4o & Claude 3.5 Sonnet
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse-gold ml-1" />
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-6xl md:text-8xl lg:text-[7.5rem] font-black leading-[0.95] tracking-tight text-white mb-8 text-balance">
            Hire 10× Faster<br />
            with <GoldText>AI Intelligence</GoldText>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
            AI-Recruiter automates candidate sourcing, screening, and interviewing — 
            so your team focuses on building relationships, not reading résumés.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button size="xl" rightIcon={<ArrowRight size={18} />} onClick={() => navigate('/dashboard')} className="shadow-gold w-full sm:w-auto">
              Start Hiring Free
            </Button>
            <Button size="xl" variant="ghost" rightIcon={<Play size={18} />} onClick={() => navigate('/interview')} className="w-full sm:w-auto bg-white/[0.03]">
              Watch Demo
            </Button>
          </motion.div>

          {/* Hero Dashboard Preview */}
          <motion.div variants={fadeUp} className="relative max-w-5xl mx-auto group perspective-1000">
            <div className="absolute inset-0 bg-gradient-to-b from-gold/10 to-transparent rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative rounded-2xl border border-white/[0.08] bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden transition-transform duration-700 hover:rotate-x-2">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05] bg-black/60">
                <div className="w-3 h-3 rounded-full bg-white/20" />
                <div className="w-3 h-3 rounded-full bg-white/20" />
                <div className="w-3 h-3 rounded-full bg-white/20" />
                <div className="ml-4 flex-1 bg-white/[0.03] rounded-md px-3 py-1.5 text-xs text-text-muted text-left font-mono border border-white/[0.02]">
                  app.ai-recruiter.io/dashboard
                </div>
              </div>
              <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-6 bg-gradient-to-b from-transparent to-black/40">
                {[
                  { l: 'Active Jobs', v: '24', t: '+12%' },
                  { l: 'Candidates', v: '1,284', t: '+8%' },
                  { l: 'Interviews Today', v: '7', t: 'AI-assisted' },
                  { l: 'Hire Rate', v: '34%', t: '+5%' },
                ].map(({ l, v, t }) => (
                  <div key={l} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-5 text-left shadow-inner">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">{l}</p>
                    <p className="text-3xl font-black text-white">{v}</p>
                    <p className="text-xs font-bold text-success mt-2">{t}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Base Glow */}
            <div className="absolute -inset-x-10 -bottom-10 h-32 bg-gold/10 blur-[80px] pointer-events-none" />
          </motion.div>

        </motion.div>
      </section>

      {/* ── Logos ── */}
      <section className="py-12 border-y border-white/[0.04] bg-black/20">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8 opacity-60">
          <p className="text-sm font-bold tracking-widest uppercase text-text-muted whitespace-nowrap">Trusted By</p>
          <div className="flex items-center gap-12 overflow-hidden w-full justify-around md:justify-end grayscale contrast-200">
            {['Acme Corp', 'GlobalBank', 'TechFlow', 'Stripe', 'Figma'].map(logo => (
              <span key={logo} className="text-xl font-black text-white">{logo}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <Label className="mb-4 block">Features</Label>
            <Heading2 className="mb-6">
              Everything you need<br />to hire <GoldText>brilliantly</GoldText>
            </Heading2>
            <Body muted className="max-w-xl mx-auto">
              A complete AI-powered recruitment stack — from intelligent sourcing to automated offer letters.
            </Body>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ delay: i * 0.1, type: 'spring' }}>
                <Card hover padding={true} className="h-full">
                  <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-6 shadow-inner border border-white/5`}>
                    <Icon size={24} className={color} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-32 px-6 bg-black/40 border-y border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <Label className="mb-4 block">How It Works</Label>
            <Heading2 className="mb-6">
              From post to hire<br />in <GoldText>4 simple steps</GoldText>
            </Heading2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute left-1/2 top-10 bottom-10 w-px bg-gradient-to-b from-transparent via-gold/20 to-transparent -translate-x-1/2" />
            
            {STEPS.map(({ n, title, desc }, i) => (
              <motion.div key={n} initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ delay: i * 0.1, type: 'spring' }}
                className={`relative ${i % 2 !== 0 ? 'md:mt-24' : ''}`}>
                <Card hover className="h-full group border-transparent hover:border-gold/20">
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 shadow-inner group-hover:bg-gold/20 transition-colors">
                      <span className="text-gold font-black text-lg">{n}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                      <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <Label className="mb-4 block">Testimonials</Label>
            <Heading2 className="mb-6">
              Loved by talent teams<br />at <GoldText>world-class companies</GoldText>
            </Heading2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TESTIMONIALS.map(({ name, role, quote, rating, avatar }, i) => (
              <motion.div key={name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card hover className="h-full">
                  <div className="flex gap-1 mb-6">
                    {Array.from({ length: rating }).map((_, j) => (
                      <Star key={j} size={16} className="text-gold" fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-base text-text-secondary leading-relaxed mb-8 font-medium">"{quote}"</p>
                  <div className="flex items-center gap-4 pt-6 border-t border-white/[0.05]">
                    <Avatar name={avatar} size="md" />
                    <div>
                      <p className="text-sm font-bold text-white">{name}</p>
                      <p className="text-xs font-bold text-text-muted uppercase tracking-wider mt-1">{role}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 px-6 mb-12">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-gold/20 p-16 text-center bg-black/60 backdrop-blur-3xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-gold/5 pointer-events-none" />
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-gold/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-gold/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10">
              <Label className="mb-6 block">Start Today</Label>
              <Heading2 className="mb-6">
                Ready to transform<br />your <GoldText>hiring process?</GoldText>
              </Heading2>
              <Body muted className="mb-10 max-w-lg mx-auto">
                Join 12,000+ companies that hire faster, smarter, and more equitably with AI-Recruiter.
              </Body>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="xl" rightIcon={<ArrowRight size={18} />} onClick={() => navigate('/dashboard')} className="shadow-gold w-full sm:w-auto">
                  Start Free Trial
                </Button>
                <Button size="xl" variant="ghost" onClick={() => navigate('/dashboard')} className="w-full sm:w-auto border-white/10 bg-white/[0.02]">
                  Talk to Sales
                </Button>
              </div>
              <p className="mt-8 text-xs font-bold uppercase tracking-widest text-text-muted">14-day free trial · No credit card required</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.04] px-6 py-12 bg-black/40">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Zap size={16} className="text-gold" fill="currentColor" />
            </div>
            <span className="text-lg font-black text-white">AI-Recruiter</span>
          </div>
          <p className="text-sm font-medium text-text-muted">© 2026 AI-Recruiter Inc. All rights reserved.</p>
          <div className="flex gap-8 text-sm font-semibold text-text-muted">
            {['Privacy', 'Terms', 'Security', 'Status'].map((t) => (
              <a key={t} href="#" className="hover:text-white transition-colors">{t}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

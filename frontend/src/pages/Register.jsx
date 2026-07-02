import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, Lock, Mail, User, Briefcase, AlertCircle } from 'lucide-react';
import Button from '../design-system/Button';
import Input from '../design-system/Input';
import { Heading2, Body, GoldText } from '../design-system/Typography';
import { clsx } from 'clsx';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Recruiter');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await register(fullName, email, password, role);
      // Redirect based on role
      if (data.user.role === 'Recruiter') navigate('/dashboard');
      else if (data.user.role === 'Candidate') navigate('/candidate-dashboard');
      else if (data.user.role === 'Admin') navigate('/admin');
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary relative overflow-hidden selection:bg-gold/30 selection:text-white px-6 py-12">
      {/* Background Glows */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-hero-gradient pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/5 blur-[100px] pointer-events-none animate-glow-pulse" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-gold mb-6 transition-transform hover:scale-105">
            <Zap size={24} className="text-primary" fill="currentColor" />
          </Link>
          <Heading2 className="text-center mb-2">Create Account</Heading2>
          <Body muted className="text-center">Join <GoldText>AI-Recruiter</GoldText> and hire smarter</Body>
        </div>

        <div className="glass-card p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 flex items-start gap-3">
              <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-white leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wider">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('Recruiter')}
                  className={clsx(
                    'p-4 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-all',
                    role === 'Recruiter' 
                      ? 'bg-gold/10 border-gold/40 text-gold shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                      : 'bg-black/40 border-white/[0.08] text-text-secondary hover:text-white hover:border-white/20'
                  )}
                >
                  <Briefcase size={18} /> Recruiter
                </button>
                <button
                  type="button"
                  onClick={() => setRole('Candidate')}
                  className={clsx(
                    'p-4 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-all',
                    role === 'Candidate'
                      ? 'bg-gold/10 border-gold/40 text-gold shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                      : 'bg-black/40 border-white/[0.08] text-text-secondary hover:text-white hover:border-white/20'
                  )}
                >
                  <User size={18} /> Candidate
                </button>
              </div>
            </div>

            <Input
              label="Full Name"
              type="text"
              placeholder="Sarah Chen"
              leftIcon={<User size={18} />}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              leftIcon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock size={18} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <div className="pt-2">
              <Button type="submit" fullWidth size="xl" loading={isLoading} rightIcon={<ArrowRight size={18} />}>
                Create Account
              </Button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-white hover:text-gold transition-colors link-underline">
              Log in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

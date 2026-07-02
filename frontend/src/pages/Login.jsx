import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';
import Button from '../design-system/Button';
import Input from '../design-system/Input';
import { Heading2, Body, GoldText } from '../design-system/Typography';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await login(email, password);
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
    <div className="min-h-screen flex items-center justify-center bg-primary relative overflow-hidden selection:bg-gold/30 selection:text-white px-6">
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
          <Heading2 className="text-center mb-2">Welcome Back</Heading2>
          <Body muted className="text-center">Log in to your <GoldText>AI-Recruiter</GoldText> account</Body>
        </div>

        <div className="glass-card p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 flex items-start gap-3">
              <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-white leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
            />
            <div className="pt-2">
              <Button type="submit" fullWidth size="xl" loading={isLoading} rightIcon={<ArrowRight size={18} />}>
                Sign In
              </Button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-text-secondary">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-white hover:text-gold transition-colors link-underline">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, GraduationCap, ArrowRight, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../lib/api.js';
import { UserProfile } from '../types.js';
import { GlassCard } from './GlassCard.js';
import { ThemeToggle } from './ThemeToggle.js';

interface AuthViewProps {
  onAuthSuccess: (user: UserProfile) => void;
}

export function AuthView({ onAuthSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  // Form inputs
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // States
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        // Mock success for forgot password
        if (!email) throw new Error('Please enter your email address.');
        setSuccessMsg('Reset password link has been sent to your email.');
        setLoading(false);
        return;
      }

      if (isLogin) {
        const user = await api.auth.login(email, password);
        onAuthSuccess(user);
      } else {
        if (!email || !name || !password) {
          throw new Error('All fields are required.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        const user = await api.auth.signup(email, name, password);
        onAuthSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    setGuestLoading(true);
    try {
      const user = await api.auth.guestLogin();
      onAuthSuccess(user);
    } catch (err: any) {
      setError('Failed to enter as Guest. Please try again.');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div id="auth-view-container" className="min-h-screen w-full flex items-center justify-center relative p-4 bg-slate-50 dark:bg-slate-950 overflow-hidden select-none transition-colors duration-200">
      
      {/* Visual glowing space dust backdrops */}
      <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-violet-500/10 dark:bg-violet-600/10 blur-[120px] pointer-events-none" />

      {/* Top action header */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left column: Branded value prop info */}
        <div className="md:col-span-6 space-y-6 text-left p-2 hidden md:block">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-4 py-1.5 rounded-full border border-indigo-500/20 text-sm font-semibold shadow-inner"
          >
            <Sparkles className="h-4 w-4 animate-spin-slow" />
            Study smarter, not harder
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Welcome to <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">StudyAI</span>
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
              Your next-generation personal learning workspace. Upload lectures, books, notes, or screenshots, and watch them transform into beautiful summaries, interactive memory flashcards, smart practice quizzes, and an AI-grounded tutor.
            </p>
          </motion.div>

          {/* Visual benefit list */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-2 gap-4 pt-4"
          >
            <div className="flex items-center gap-3 bg-white/40 dark:bg-[#0f0f12]/40 p-3 rounded-xl border border-slate-200/50 dark:border-white/5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">AI Explanations</p>
                <p className="text-xs text-slate-500">Summary & terms</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/40 dark:bg-[#0f0f12]/40 p-3 rounded-xl border border-slate-200/50 dark:border-white/5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Custom Testing</p>
                <p className="text-xs text-slate-500">Quiz & grading</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right column: Auth card panel */}
        <div className="md:col-span-6 flex justify-center w-full">
          <div className="w-full max-w-md">
            <GlassCard hoverEffect={false} delay={0.15}>
              <div className="p-8">
                
                {/* Branding on Mobile */}
                <div className="flex md:hidden flex-col items-center mb-6 text-center">
                  <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20 mb-2">
                    <GraduationCap className="h-8 w-8" />
                  </div>
                  <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    StudyAI
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Your personal AI study companion
                  </p>
                </div>

                {/* Form header */}
                <div className="text-center md:text-left mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {isForgotPassword 
                      ? 'Reset Password' 
                      : isLogin 
                        ? 'Welcome Back' 
                        : 'Create Account'
                    }
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {isForgotPassword 
                      ? 'Enter email to receive instructions' 
                      : isLogin 
                        ? 'Sign in to access your learning portal' 
                        : 'Sign up to unlock the power of StudyAI'
                    }
                  </p>
                </div>

                {/* Status panels */}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-start gap-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 p-3.5 rounded-xl border border-rose-500/20 text-sm font-medium"
                  >
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {successMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex items-start gap-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-3.5 rounded-xl border border-emerald-500/20 text-sm font-medium"
                  >
                    <Sparkles className="h-5 w-5 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </motion.div>
                )}

                {/* Main Auth Form */}
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  
                  {/* Name field (signup only) */}
                  {!isLogin && !isForgotPassword && (
                    <div className="space-y-1 text-left">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                          id="signup-name-input"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Eleanor Vance"
                          className="w-full bg-slate-100/50 dark:bg-[#0f0f12]/50 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email field */}
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        id="auth-email-input"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="eleanor@university.edu"
                        className="w-full bg-slate-100/50 dark:bg-[#0f0f12]/50 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Password fields */}
                  {!isForgotPassword && (
                    <>
                      <div className="space-y-1 text-left">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
                          {isLogin && (
                            <button 
                              type="button"
                              onClick={() => { setError(''); setIsForgotPassword(true); }}
                              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                            >
                              Forgot?
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <input
                            id="auth-password-input"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-100/50 dark:bg-[#0f0f12]/50 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* Confirm Password (signup only) */}
                      {!isLogin && (
                        <div className="space-y-1 text-left">
                          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Confirm Password</label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                              id="signup-confirm-password-input"
                              type="password"
                              required
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full bg-slate-100/50 dark:bg-[#0f0f12]/50 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Submit Button */}
                  <motion.button
                    id="auth-submit-btn"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl py-3.5 font-bold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer border border-indigo-500/10"
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {isForgotPassword 
                          ? 'Send Instructions' 
                          : isLogin 
                            ? 'Login to Dashboard' 
                            : 'Create Account'
                        }
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Alternate link switcher */}
                <div className="mt-5 text-center">
                  {isForgotPassword ? (
                    <button
                      onClick={() => { setError(''); setIsForgotPassword(false); }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Back to Login
                    </button>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {isLogin ? "Don't have an account? " : 'Already have an account? '}
                      <button
                        onClick={() => { 
                          setError(''); 
                          setIsLogin(!isLogin); 
                        }}
                        className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        {isLogin ? 'Sign Up' : 'Login'}
                      </button>
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-white/5" />
                  </div>
                  <div className="relative flex justify-center text-xs font-semibold uppercase">
                    <span className="bg-white dark:bg-[#0a0a0c] px-3 text-slate-400">Or continue with</span>
                  </div>
                </div>

                {/* Guest access option */}
                <motion.button
                  id="guest-login-btn"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleGuestLogin}
                  disabled={guestLoading}
                  type="button"
                  className="w-full bg-slate-100/80 dark:bg-[#0f0f12]/80 hover:bg-slate-200/80 dark:hover:bg-white/5 border border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300 rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors duration-200"
                >
                  {guestLoading ? (
                    <div className="h-5 w-5 border-2 border-slate-400/30 border-t-slate-600 dark:border-t-slate-200 rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
                      Explore as Guest
                    </>
                  )}
                </motion.button>

                <p className="text-[10px] text-center text-slate-400 mt-4 leading-normal px-2">
                  Guest accounts have instant, full playground access, but files and quiz records are temporary and local to the session.
                </p>

              </div>
            </GlassCard>
          </div>
        </div>

      </div>
    </div>
  );
}

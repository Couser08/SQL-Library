import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Key, Mail, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import dbShieldImage from '../assets/database_shield.png';

export const AuthScreen: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        setMessage('Verification email sent! Please check your inbox.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert('Password reset link can be requested via your Supabase console dashboard or email SMTP service.');
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] dark:bg-[#0f0f12] p-6 text-text-primary">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md w-full bg-white dark:bg-[#1c1c1e] rounded-3xl border border-border-secondary p-8 shadow-2xl text-center"
        >
          <div className="w-16 h-16 bg-system-red/10 text-system-red rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold tracking-tight mb-2">Configuration Required</h2>
          <p className="text-text-secondary text-sm mb-6 leading-relaxed">
            Please configure your Supabase credentials in the <code className="px-1.5 py-0.5 rounded bg-bg-secondary font-semibold font-mono">.env</code> file in the project root:
          </p>
          <div className="text-left bg-bg-secondary p-4 rounded-xl border border-border-secondary font-mono text-xs text-text-secondary space-y-1 select-all mb-6">
            <p>VITE_SUPABASE_URL=https://your-project.supabase.co</p>
            <p>VITE_SUPABASE_ANON_KEY=your-anon-key</p>
          </div>
          <p className="text-xs text-text-tertiary">
            After configuring the file, restart the development server to apply changes.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#f3f4f6]/60 dark:bg-[#0b0c0e] p-4 md:p-8 transition-colors duration-300">
      {/* Decorative background glows */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-system-blue/10 dark:bg-system-blue/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Main card container */}
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-3xl w-full bg-white dark:bg-[#18191d] rounded-[24px] border border-border-secondary shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]"
      >
        {/* Left Column - 3D AI Generated Graphic */}
        <div className="hidden md:flex md:w-1/2 relative flex-col items-center justify-center p-10 bg-gradient-to-br from-system-blue/10 via-purple-500/5 to-transparent dark:from-system-blue/20 dark:via-[#1c1d22] dark:to-transparent border-r border-border-secondary overflow-hidden select-none">
          {/* Subtle moving light particles */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-system-blue/15 dark:bg-system-blue/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl" />

          {/* Floating AI generated database shield image */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-full max-w-[240px] flex items-center justify-center relative z-10"
          >
            <img 
              src={dbShieldImage} 
              alt="Database Security Graphic" 
              className="w-full h-auto object-contain drop-shadow-2xl"
              draggable="false"
            />
          </motion.div>
        </div>

        {/* Right Column - Authentication Form */}
        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-white dark:bg-[#18191d]">
          {/* Logo Icon */}
          <div className="w-10 h-10 bg-system-blue/10 text-system-blue rounded-xl flex items-center justify-center mb-5 border border-system-blue/15">
            <Shield size={20} className="stroke-[2.5]" />
          </div>

          {/* Titles */}
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            {isSignUp ? 'Create account' : 'Welcome back'}
          </h1>
          <p className="text-text-secondary text-xs mt-1">
            {isSignUp ? 'Create a personal admin account' : 'Sign in to manage your databases'}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={15} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-4 py-2 bg-[#f9fafb] dark:bg-[#1f2026] border border-border-secondary focus:border-system-blue dark:focus:border-system-blue rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-system-blue dark:focus:ring-system-blue transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">Password</label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={15} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2 bg-[#f9fafb] dark:bg-[#1f2026] border border-border-secondary focus:border-system-blue dark:focus:border-system-blue rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-system-blue dark:focus:ring-system-blue transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Checkbox and Forgot Password (only in sign-in mode) */}
            {!isSignUp && (
              <div className="flex items-center justify-between text-[11px] font-medium mt-1">
                <label className="flex items-center gap-1.5 text-text-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-border-secondary text-system-blue focus:ring-system-blue w-3.5 h-3.5"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-system-blue hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Status Messages */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 text-system-red text-[11px] rounded-xl font-medium"
                >
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {message && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 text-system-green text-[11px] rounded-xl font-medium"
                >
                  <CheckCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 bg-system-blue hover:bg-system-blue/95 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>
        </div>
      </motion.div>

      {/* Under-card switch navigation link */}
      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
            setMessage(null);
          }}
          className="text-xs text-text-secondary hover:text-text-primary font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          {isSignUp ? (
            <>
              Already have an account? <span className="text-system-blue hover:underline">Sign In</span>
            </>
          ) : (
            <>
              Don't have an account? <span className="text-system-blue hover:underline">Create account</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

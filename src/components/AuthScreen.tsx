import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Key, Mail, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-secondary p-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md w-full glassmorphism rounded-2xl border border-border-secondary p-8 shadow-2xl text-center"
        >
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 text-system-red rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-semibold mb-2">Configuration Required</h2>
          <p className="text-text-secondary text-sm mb-6 leading-relaxed">
            Please configure your Supabase credentials in the <code className="px-1.5 py-0.5 rounded bg-bg-tertiary">.env</code> file in the project root:
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
    <div className="min-h-screen flex items-center justify-center bg-bg-secondary p-6">
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full glassmorphism rounded-2xl border border-border-secondary p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-system-blue/10 text-system-blue rounded-xl flex items-center justify-center mb-4">
            <Shield size={24} className="stroke-[2]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">SQL Database Manager</h1>
          <p className="text-text-secondary text-sm mt-1">
            {isSignUp ? 'Create a personal admin account' : 'Sign in to manage your databases'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-bg-primary/50 border border-border-secondary rounded-xl text-sm focus:outline-none focus:border-system-blue focus:ring-1 focus:ring-system-blue transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-bg-primary/50 border border-border-secondary rounded-xl text-sm focus:outline-none focus:border-system-blue focus:ring-1 focus:ring-system-blue transition-all"
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 text-system-red text-xs rounded-xl"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {message && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2.5 p-3.5 bg-green-500/10 border border-green-500/20 text-system-green text-xs rounded-xl"
              >
                <CheckCircle size={16} className="shrink-0 mt-0.5" />
                <span>{message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-system-blue hover:bg-system-blue/90 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-border-secondary text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setMessage(null);
            }}
            className="text-xs text-system-blue hover:underline font-medium inline-flex items-center gap-1.5 cursor-pointer"
          >
            {isSignUp ? (
              <>Already have an account? Sign In</>
            ) : (
              <>
                <UserPlus size={14} />
                Create account
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

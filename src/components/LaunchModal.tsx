import React from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, Database, Terminal, Shield, Sparkles } from 'lucide-react';

interface LaunchModalProps {
  onClose: () => void;
}

export const LaunchModal: React.FC<LaunchModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="w-full max-w-xl bg-bg-primary rounded-2xl border border-border-secondary shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Hero Banner Header */}
        <div className="relative p-8 bg-gradient-to-br from-system-blue/10 via-system-blue/5 to-transparent border-b border-border-secondary text-center overflow-hidden">
          {/* Subtle decorative shapes */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-system-blue/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-system-blue/5 rounded-full blur-xl" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>

          <div className="w-14 h-14 bg-system-blue text-white rounded-2xl flex items-center justify-center mx-auto shadow-md mb-4">
            <Database size={28} className="stroke-[2.5]" />
          </div>

          <h2 className="text-xl font-extrabold tracking-tight text-text-primary flex items-center justify-center gap-1.5">
            Welcome to SQL Manager
            <Sparkles size={16} className="text-system-orange animate-pulse" />
          </h2>
          <p className="text-xs text-text-secondary mt-1.5 max-w-sm mx-auto">
            An intuitive database explorer and interactive playground built to simplify your PostgreSQL & Supabase workflows.
          </p>
        </div>

        {/* Feature List Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-wider">
              Why use SQL Manager?
            </h3>

            <div className="grid gap-4">
              {/* Feature 1 */}
              <div className="flex gap-3.5 p-3.5 hover:bg-bg-secondary/40 rounded-xl border border-transparent hover:border-border-secondary/40 transition-all">
                <div className="shrink-0 w-8 h-8 bg-system-blue/10 text-system-blue rounded-lg flex items-center justify-center">
                  <Database size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Zero-Config Schema Viewer</h4>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                    Instantly browse your database tables, explore complex relationships, and isolate different schema environments using database contexts.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex gap-3.5 p-3.5 hover:bg-bg-secondary/40 rounded-xl border border-transparent hover:border-border-secondary/40 transition-all">
                <div className="shrink-0 w-8 h-8 bg-system-green/10 text-system-green rounded-lg flex items-center justify-center">
                  <CheckCircle size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Airtable-style Data Grid</h4>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                    Modify row values inline without SQL scripts. Instantly double-click cells to update values, filter columns, sort entries, or add and delete records.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex gap-3.5 p-3.5 hover:bg-bg-secondary/40 rounded-xl border border-transparent hover:border-border-secondary/40 transition-all">
                <div className="shrink-0 w-8 h-8 bg-system-orange/10 text-system-orange rounded-lg flex items-center justify-center">
                  <Terminal size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Advanced Monaco SQL Editor</h4>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                    Write complex SQL statements with autocomplete suggestions, format queries, view historical runs, and roll back transaction previews safely.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex gap-3.5 p-3.5 hover:bg-bg-secondary/40 rounded-xl border border-transparent hover:border-border-secondary/40 transition-all">
                <div className="shrink-0 w-8 h-8 bg-purple-500/10 text-purple-500 rounded-lg flex items-center justify-center">
                  <Shield size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Safe Import & Export Tools</h4>
                  <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                    Restore database environments using smart topological SQL parsing that bypasses key constraints, or backup schemas in seconds with clean export files.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-secondary bg-bg-secondary/40 flex items-center justify-between">
          <div className="text-[10px] text-text-tertiary">
            v1.2.0 stable release
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 text-white bg-system-blue hover:bg-system-blue/90 text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
          >
            Get Started
          </button>
        </div>
      </motion.div>
    </div>
  );
};

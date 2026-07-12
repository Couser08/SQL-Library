import React from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Server, Database, Terminal, Shield, ArrowUpRight } from 'lucide-react';

interface PatchNotesModalProps {
  onClose: () => void;
}

interface Patch {
  version: string;
  title: string;
  date: string;
  badge: {
    text: string;
    type: 'new' | 'improvement' | 'major';
  };
  changes: string[];
  icon: React.ReactNode;
}

export const PatchNotesModal: React.FC<PatchNotesModalProps> = ({ onClose }) => {
  const patches: Patch[] = [
    {
      version: 'v1.2.0',
      title: 'Multi-Schema Isolation & DB Exporter',
      date: 'Latest Update',
      badge: { text: 'New', type: 'new' },
      icon: <Server size={14} className="text-system-blue" />,
      changes: [
        'Added dynamic multi-schema switching support (isolate contexts like public, analytics, production).',
        'Implemented full DB SQL exporter - dump tables, definitions, and insert values into a single .sql backup file.',
        'Visual indicators added in sidebar for active databases and quick schema refresh action hooks.'
      ]
    },
    {
      version: 'v1.1.5',
      title: 'Interactive Grid & Row Operations',
      date: 'June 2026',
      badge: { text: 'Improvement', type: 'improvement' },
      icon: <Database size={14} className="text-system-green" />,
      changes: [
        'Airtable-style inline editing: double click to modify values directly in Table Viewer cells.',
        'Integrated live filters and column sorting parameters for localized data lookups.',
        'Create and insert custom table rows directly via visual form overlay, including row-deletion hooks.'
      ]
    },
    {
      version: 'v1.1.0',
      title: 'SQL History & Schema Imports',
      date: 'May 2026',
      badge: { text: 'Improvement', type: 'improvement' },
      icon: <Terminal size={14} className="text-system-orange" />,
      changes: [
        'Built full SQL Execution History logger showing execution timestamp, status, and rows affected.',
        'Integrated smart SQL file import translator that parses statements and runs creations topologically.',
        'Added Monaco Code Editor styling and SQL autocomplete snippet utilities.'
      ]
    },
    {
      version: 'v1.0.0',
      title: 'SQL Manager Sandbox Launch',
      date: 'April 2026',
      badge: { text: 'Major', type: 'major' },
      icon: <Shield size={14} className="text-purple-500" />,
      changes: [
        'Initial sandbox launch of SQL Manager featuring Supabase integration and real-time schema loading.',
        'Developed schema explorer tree view displaying tables, data types, and primary/foreign key connections.'
      ]
    }
  ];

  const getBadgeStyle = (type: 'new' | 'improvement' | 'major') => {
    switch (type) {
      case 'new':
        return 'bg-system-blue/10 text-system-blue border-system-blue/20';
      case 'improvement':
        return 'bg-system-green/10 text-system-green border-system-green/20';
      case 'major':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="w-full max-w-xl bg-bg-primary rounded-2xl border border-border-secondary shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-secondary bg-bg-secondary/40">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-system-orange/10 text-system-orange rounded-lg flex items-center justify-center">
              <Sparkles size={15} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary">What's New in SQL Manager</h2>
              <p className="text-[10px] text-text-secondary mt-0.5">Explore the latest features and patches</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content - Timeline of Updates */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border-secondary">
            {patches.map((patch, idx) => (
              <div key={patch.version} className="relative flex gap-4 pl-9">
                {/* Timeline node icon container */}
                <div className={`absolute left-0 top-1 w-9 h-9 rounded-full bg-bg-primary border border-border-secondary flex items-center justify-center z-10 shadow-xs ${idx === 0 ? 'ring-4 ring-system-blue/10' : ''}`}>
                  {patch.icon}
                </div>

                {/* Patch Card */}
                <div className="flex-1 bg-bg-secondary/20 hover:bg-bg-secondary/40 border border-border-secondary rounded-xl p-4 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-text-primary bg-bg-tertiary/60 px-1.5 py-0.5 rounded">
                        {patch.version}
                      </span>
                      <h3 className="text-xs font-bold text-text-primary">{patch.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${getBadgeStyle(patch.badge.type)}`}>
                        {patch.badge.text}
                      </span>
                      <span className="text-[10px] text-text-tertiary">{patch.date}</span>
                    </div>
                  </div>

                  <ul className="space-y-1.5">
                    {patch.changes.map((change, i) => (
                      <li key={i} className="text-[11px] text-text-secondary leading-relaxed flex items-start gap-1.5">
                        <span className="text-text-tertiary select-none mt-1 font-bold">•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-secondary bg-bg-secondary/40 flex items-center justify-between">
          <div className="text-[10px] text-text-tertiary flex items-center gap-1">
            <span>Documentation</span>
            <ArrowUpRight size={11} />
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-white bg-system-blue hover:bg-system-blue/90 text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
          >
            Got it, thanks!
          </button>
        </div>
      </motion.div>
    </div>
  );
};

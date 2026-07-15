import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Check, CheckCircle2 } from 'lucide-react';

interface UpdateModalProps {
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ onClose }) => {
  const newFeatures = [
    {
      title: 'Individual Table Deletions',
      desc: 'Hover over any table in the sidebar list to reveal a red trash icon and drop that specific table cascade.'
    },
    {
      title: 'Bulk Database Reset',
      desc: 'Added a quick "Delete All" action link next to the Tables header in the sidebar to drop all tables at once.'
    },
    {
      title: 'Smart Boolean Insert Casting',
      desc: 'A new two-pass translator discovers boolean column definitions and dynamically converts integer 1/0 inserts to true/false booleans.'
    },
    {
      title: 'SQL Parser Parentheses Fix',
      desc: 'Cleans up trailing parentheses syntax errors and handles fractional timestamp/date defaults during MySQL to Postgres translation.'
    },
    {
      title: 'Light Mode Login Redesign',
      desc: 'A redesigned authentication card featuring a split-screen high-contrast light theme with 3D database graphics.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg bg-bg-primary border border-border-primary/80 dark:border-border-secondary shadow-2xl rounded-2xl overflow-hidden"
      >
        {/* Header decoration */}
        <div className="p-6 bg-gradient-to-br from-system-blue/15 via-purple-500/5 to-transparent border-b border-border-secondary text-center select-none">
          <div className="w-12 h-12 bg-system-blue/15 text-system-blue rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Sparkles size={22} className="animate-pulse" />
          </div>
          <h2 className="text-base font-bold tracking-tight text-text-primary">Software Update Successful</h2>
          <p className="text-xs text-text-secondary mt-1">Version 1.4.0 is now live with stability fixes</p>
        </div>

        {/* Feature List */}
        <div className="p-6 max-h-[320px] overflow-y-auto space-y-4">
          {newFeatures.map((feat, idx) => (
            <div key={idx} className="flex gap-3 text-xs">
              <div className="mt-0.5 text-system-green shrink-0">
                <CheckCircle2 size={16} />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-text-primary">{feat.title}</h4>
                <p className="text-text-secondary leading-relaxed">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action footer */}
        <div className="p-4 bg-bg-secondary/40 border-t border-border-secondary flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-system-blue hover:bg-system-blue/90 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 border-none"
          >
            <Check size={14} />
            <span>Got it, Thanks!</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

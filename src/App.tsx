import React, { useEffect, useState } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useDatabaseStore } from './store/useDatabaseStore';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { TableGrid } from './components/TableGrid';
import { SQLEditor } from './components/SQLEditor';
import { ImportModal } from './components/ImportModal';
import { LaunchModal } from './components/LaunchModal';
import { PatchNotesModal } from './components/PatchNotesModal';
import { exportDatabaseToSql, downloadFile } from './lib/sqlExporter';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Database, Terminal, Download, RefreshCw } from 'lucide-react';


const App: React.FC = () => {
  const { user, loading: authLoading, initialize } = useAuthStore();
  const { tables, schema, fetchSchema, executeSql, loadingSchema } = useDatabaseStore();
  
  // Navigation tabs: 'grid' | 'editor'
  const [activeTab, setActiveTab] = useState<'grid' | 'editor'>('grid');
  
  // Import modal state
  const [isImportOpen, setIsImportOpen] = useState(false);
  
  // Launch and Patch Notes states
  const [isLaunchOpen, setIsLaunchOpen] = useState(false);
  const [isPatchNotesOpen, setIsPatchNotesOpen] = useState(false);
  
  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Export state
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Auto-open modals on application launch / version update
  useEffect(() => {
    if (user) {
      const hasSeenLaunch = localStorage.getItem('sql_manager_has_seen_launch');
      if (!hasSeenLaunch) {
        setIsLaunchOpen(true);
      } else {
        const lastSeenPatch = localStorage.getItem('sql_manager_last_seen_patch_version');
        const CURRENT_VERSION = '1.2.0';
        if (lastSeenPatch !== CURRENT_VERSION) {
          setIsPatchNotesOpen(true);
        }
      }
    }
  }, [user]);

  const handleCloseLaunch = () => {
    localStorage.setItem('sql_manager_has_seen_launch', 'true');
    setIsLaunchOpen(false);
    
    // Check if we should immediately trigger patch notes if it hasn't been seen
    const lastSeenPatch = localStorage.getItem('sql_manager_last_seen_patch_version');
    const CURRENT_VERSION = '1.2.0';
    if (lastSeenPatch !== CURRENT_VERSION) {
      setIsPatchNotesOpen(true);
    }
  };

  const handleClosePatchNotes = () => {
    localStorage.setItem('sql_manager_last_seen_patch_version', '1.2.0');
    setIsPatchNotesOpen(false);
  };

  useEffect(() => {
    if (user) {
      fetchSchema();
    }
  }, [user?.id, fetchSchema]);


  // Dark mode effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleExport = async () => {
    if (tables.length === 0) return;
    setExporting(true);
    try {
      const sqlDump = await exportDatabaseToSql(tables, schema, executeSql);
      downloadFile(sqlDump, `database_export_${Date.now()}.sql`, 'text/plain');
    } catch (e) {
      console.error('Export failed:', e);
      alert('Export failed.');
    } finally {
      setExporting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-secondary">
        <div className="w-6 h-6 border-2 border-system-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-primary text-text-primary">
      {/* Sidebar navigation */}
      <Sidebar 
        onOpenImport={() => setIsImportOpen(true)} 
        onOpenLaunchTour={() => setIsLaunchOpen(true)}
        onOpenPatchNotes={() => setIsPatchNotesOpen(true)}
      />

      {/* Main app space */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Navigation & Controls header */}
        <header className="h-14 border-b border-border-secondary px-6 flex items-center justify-between shrink-0 bg-bg-primary z-10">
          {/* Tab Selector */}
          <div className="flex items-center bg-bg-secondary p-0.5 rounded-lg border border-border-secondary">
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-4 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'grid'
                  ? 'bg-bg-primary text-text-primary shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Database size={13} />
              <span>Table Viewer</span>
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'editor'
                  ? 'bg-bg-primary text-text-primary shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Terminal size={13} />
              <span>SQL Editor</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Refresh Schema button */}
            <button
              onClick={() => fetchSchema()}
              disabled={loadingSchema}
              title="Refresh schema"
              className="p-2 text-text-secondary hover:bg-bg-secondary rounded-lg border border-border-secondary disabled:opacity-40 cursor-pointer transition-all"
            >
              <RefreshCw size={14} className={loadingSchema ? 'animate-spin' : ''} />
            </button>

            {/* Export database button */}
            <button
              onClick={handleExport}
              disabled={exporting || tables.length === 0}
              title="Export full database as .sql"
              className="px-3.5 py-1.5 bg-bg-secondary hover:bg-bg-tertiary border border-border-secondary text-text-primary text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-40"
            >
              <Download size={14} className="text-system-blue" />
              <span>{exporting ? 'Exporting...' : 'Export DB'}</span>
            </button>

            {/* Dark mode switcher */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-text-secondary hover:bg-bg-secondary rounded-lg border border-border-secondary cursor-pointer transition-colors"
            >
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </header>

        {/* Tab view display */}
        <div className="flex-1 flex min-h-0 relative">
          <AnimatePresence mode="wait">
            {activeTab === 'grid' ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex"
              >
                <TableGrid />
              </motion.div>
            ) : (
              <motion.div
                key="editor"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex"
              >
                <SQLEditor />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Import database modal overlay */}
      <AnimatePresence>
        {isImportOpen && (
          <ImportModal onClose={() => setIsImportOpen(false)} />
        )}
        {isLaunchOpen && (
          <LaunchModal onClose={handleCloseLaunch} />
        )}
        {isPatchNotesOpen && (
          <PatchNotesModal onClose={handleClosePatchNotes} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;

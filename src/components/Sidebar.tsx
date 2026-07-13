import React, { useState, useEffect } from 'react';
import { useDatabaseStore } from '../store/useDatabaseStore';
import { useAuthStore } from '../store/useAuthStore';
import { Database, Search, Upload, LogOut, RefreshCw, Plus, Check, X, Server, Info, Sparkles, Trash2 } from 'lucide-react';

interface SidebarProps {
  onOpenImport: () => void;
  onOpenLaunchTour: () => void;
  onOpenPatchNotes: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenImport, onOpenLaunchTour, onOpenPatchNotes }) => {
  const { 
    tables, 
    selectedTable, 
    setSelectedTable, 
    loadingSchema, 
    fetchSchema,
    schemas,
    activeSchema,
    createSchema,
    setActiveSchema,
    fetchSchemas,
    executeSql
  } = useDatabaseStore();
  
  const { user, signOut } = useAuthStore();
  const [search, setSearch] = useState('');
  
  // Database creation states
  const [isCreatingDb, setIsCreatingDb] = useState(false);
  const [newDbName, setNewDbName] = useState('');
  const [createDbError, setCreateDbError] = useState(false);

  // Fetch schemas list on sidebar mount
  useEffect(() => {
    fetchSchemas();
  }, [fetchSchemas]);

  const handleCreateDbSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateDbError(false);
    if (!newDbName.trim()) return;

    const success = await createSchema(newDbName.trim().toLowerCase());
    if (success) {
      setIsCreatingDb(false);
      setNewDbName('');
    } else {
      setCreateDbError(true);
    }
  };

  const handleDeleteTable = async (tableName: string) => {
    if (!window.confirm(`Are you sure you want to drop table "${tableName}"? This will delete all its data.`)) {
      return;
    }
    try {
      const res = await executeSql(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);
      if (res.success) {
        if (selectedTable === tableName) {
          setSelectedTable(null);
        }
        await fetchSchema();
      } else {
        alert(`Failed to drop table "${tableName}": ${res.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`An error occurred: ${err.message || err}`);
    }
  };

  const handleDeleteAllTables = async () => {
    if (tables.length === 0) return;
    if (!window.confirm(`WARNING: Are you sure you want to drop ALL ${tables.length} tables in this database? This will completely clear your schema and data!`)) {
      return;
    }
    try {
      const dropQuery = tables.map(t => `DROP TABLE IF EXISTS "${t}" CASCADE;`).join('\n');
      const res = await executeSql(dropQuery);
      if (res.success) {
        setSelectedTable(null);
        await fetchSchema();
      } else {
        alert(`Failed to drop all tables: ${res.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`An error occurred: ${err.message || err}`);
    }
  };

  const filteredTables = tables.filter(t => t.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-64 h-screen border-r border-border-secondary bg-bg-secondary/40 flex flex-col shrink-0 select-none">
      {/* App Branding */}
      <div className="p-5 flex items-center justify-between border-b border-border-secondary">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-system-blue text-white rounded-lg flex items-center justify-center shadow-sm">
            <Database size={16} className="stroke-[2.5]" />
          </div>
          <span className="font-bold text-sm tracking-tight text-text-primary">SQL Manager</span>
        </div>
        <button
          onClick={() => {
            fetchSchemas();
            fetchSchema();
          }}
          disabled={loadingSchema}
          title="Refresh schema"
          className="p-1.5 text-text-secondary hover:bg-bg-tertiary disabled:opacity-40 rounded-lg cursor-pointer transition-all"
        >
          <RefreshCw size={14} className={loadingSchema ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Database Selector (Schemas) */}
      <div className="px-4 py-3 border-b border-border-secondary bg-bg-secondary/20 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1">
            <Server size={11} />
            <span>Databases</span>
          </label>
          <button 
            onClick={() => {
              setIsCreatingDb(!isCreatingDb);
              setNewDbName('');
              setCreateDbError(false);
            }}
            title="Create database schema" 
            className="p-0.5 text-system-blue hover:bg-bg-tertiary rounded transition-colors cursor-pointer"
          >
            {isCreatingDb ? <X size={13} /> : <Plus size={13} />}
          </button>
        </div>

        {isCreatingDb ? (
          <form onSubmit={handleCreateDbSubmit} className="space-y-1">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                required
                placeholder="db_name..."
                value={newDbName}
                onChange={(e) => setNewDbName(e.target.value)}
                className={`w-full px-2 py-1 bg-bg-primary border rounded text-xs focus:outline-none focus:ring-1 transition-all ${
                  createDbError 
                    ? 'border-system-red focus:border-system-red focus:ring-system-red' 
                    : 'border-border-secondary focus:border-system-blue focus:ring-system-blue'
                }`}
              />
              <button type="submit" className="p-1 text-system-green hover:bg-bg-tertiary rounded cursor-pointer" title="Create">
                <Check size={14} />
              </button>
            </div>
            {createDbError && (
              <span className="text-[9px] text-system-red block">Use only letters, numbers, and underscores.</span>
            )}
          </form>
        ) : (
          <select
            value={activeSchema}
            onChange={(e) => setActiveSchema(e.target.value)}
            className="w-full px-2 py-1.5 bg-bg-primary border border-border-secondary rounded-lg text-xs focus:outline-none focus:border-system-blue font-semibold"
          >
            {schemas.map(sch => (
              <option key={sch} value={sch}>
                {sch === 'public' ? 'public (default)' : sch}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Table Search */}
      <div className="px-4 py-2.5 border-b border-border-secondary bg-bg-primary/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={14} />
          <input
            type="text"
            placeholder="Search tables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-bg-primary border border-border-secondary rounded-lg text-xs focus:outline-none focus:border-system-blue focus:ring-1 focus:ring-system-blue transition-all"
          />
        </div>
      </div>

      {/* Tables List */}
      <div className="flex-1 overflow-y-auto py-2.5 px-3.5 space-y-1">
        <div className="text-[10px] font-bold text-text-tertiary px-3 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Tables ({tables.length})</span>
          {tables.length > 0 && (
            <button 
              onClick={handleDeleteAllTables}
              title="Drop all tables" 
              className="text-system-red hover:bg-system-red/10 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-colors cursor-pointer"
            >
              Delete All
            </button>
          )}
        </div>
        {loadingSchema && tables.length === 0 ? (
          <div className="text-center py-4 text-xs text-text-secondary">Loading tables...</div>
        ) : filteredTables.length === 0 ? (
          <div className="text-center py-4 text-xs text-text-secondary">No tables found</div>
        ) : (
          filteredTables.map((tableName) => {
            const isSelected = selectedTable === tableName;
            return (
              <div
                key={tableName}
                className={`group w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-system-blue text-white shadow-sm'
                    : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                }`}
              >
                <button
                  onClick={() => setSelectedTable(tableName)}
                  className="flex-1 flex items-center gap-2 truncate text-left cursor-pointer border-none bg-transparent font-medium text-inherit"
                >
                  <Database size={13} className={isSelected ? 'text-white' : 'text-text-tertiary'} />
                  <span className="truncate font-mono">{tableName}</span>
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTable(tableName);
                  }}
                  title={`Drop table ${tableName}`}
                  className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-opacity ${
                    isSelected ? 'text-white' : 'text-system-red opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-t border-border-secondary bg-bg-secondary/20 flex flex-col gap-2">
        <button
          onClick={onOpenImport}
          className="w-full py-2 bg-bg-primary border border-border-secondary hover:border-system-blue hover:bg-system-blue/5 text-xs text-text-primary font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <Upload size={14} className="text-system-blue" />
          <span>Import SQL Dump</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenPatchNotes}
            className="relative py-2 bg-bg-primary border border-border-secondary hover:border-system-orange hover:bg-system-orange/5 text-xs text-text-primary font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <Sparkles size={13} className="text-system-orange" />
            <span>What's New</span>
            {localStorage.getItem('sql_manager_last_seen_patch_version') !== '1.2.0' && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-system-blue rounded-full animate-pulse border border-bg-primary" />
            )}
          </button>

          <button
            onClick={onOpenLaunchTour}
            className="py-2 bg-bg-primary border border-border-secondary hover:border-system-blue hover:bg-system-blue/5 text-xs text-text-primary font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <Info size={13} className="text-system-blue" />
            <span>About App</span>
          </button>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-border-secondary bg-bg-secondary/60 flex items-center justify-between">
        <div className="flex flex-col min-w-0 pr-2">
          <span className="text-[10px] font-semibold text-text-tertiary uppercase">Signed In As</span>
          <span className="text-xs font-semibold text-text-primary truncate" title={user?.email}>
            {user?.email}
          </span>
        </div>
        <button
          onClick={() => signOut()}
          title="Sign Out"
          className="p-1.5 text-text-secondary hover:bg-bg-tertiary hover:text-system-red rounded-lg cursor-pointer transition-colors"
        >
          <LogOut size={15} />
        </button>
      </div>
    </div>
  );
};

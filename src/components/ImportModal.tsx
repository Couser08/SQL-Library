import React, { useState, useRef } from 'react';
import { useDatabaseStore } from '../store/useDatabaseStore';
import { translateSqlFile } from '../lib/sqlTranslator';
import type { TranslationResult } from '../lib/sqlTranslator';
import { motion } from 'framer-motion';
import { Upload, X, AlertTriangle, CheckCircle, ShieldAlert, FileText } from 'lucide-react';


interface ImportModalProps {
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ onClose }) => {
  const { tables: existingTables, executeSql, fetchSchema } = useDatabaseStore();
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<TranslationResult | null>(null);
  
  // Conflict resolution state: Record<tableName, 'replace' | 'skip'>
  const [conflicts, setConflicts] = useState<Record<string, 'replace' | 'skip'>>({});
  
  // Importing state
  const [importing, setImporting] = useState(false);
  const [importStep, setImportStep] = useState<string>('');
  const [importReport, setImportReport] = useState<{
    tablesCreated: string[];
    rowsInserted: Record<string, number>;
    errors: { query: string; error: string }[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setParsing(true);
    setParsedData(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const result = translateSqlFile(text);
      setParsedData(result);
      
      // Initialize conflicts
      const detectedConflicts: Record<string, 'replace' | 'skip'> = {};
      for (const table of result.tables) {
        if (existingTables.includes(table.name)) {
          detectedConflicts[table.name] = 'skip'; // default to skip for safety
        }
      }
      setConflicts(detectedConflicts);
      setParsing(false);
    };
    reader.readAsText(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.endsWith('.sql')) {
      const event = { target: { files: [droppedFile] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(event);
    }
  };

  const startImport = async () => {
    if (!parsedData) return;
    setImporting(true);
    
    const tablesCreated: string[] = [];
    const rowsInserted: Record<string, number> = {};
    const errors: { query: string; error: string }[] = [];

    // Process tables in topological order
    for (const tableName of parsedData.importOrder) {
      const table = parsedData.tables.find(t => t.name === tableName);
      if (!table) continue;

      const conflictAction = conflicts[tableName];
      
      // Skip action
      if (conflictAction === 'skip') {
        continue;
      }

      setImportStep(`Importing table ${tableName}...`);

      // Replace action: Drop existing table first
      if (conflictAction === 'replace') {
        const dropRes = await executeSql(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);
        if (!dropRes.success) {
          errors.push({ query: `DROP TABLE "${tableName}"`, error: dropRes.error || 'Unknown error' });
        }
      }

      // Create table
      if (table.createQuery) {
        const createRes = await executeSql(table.createQuery);
        if (createRes.success) {
          tablesCreated.push(tableName);
        } else {
          errors.push({ query: table.createQuery, error: createRes.error || 'Unknown error' });
          // If table creation fails, skip its inserts
          continue;
        }
      } else if (conflictAction !== 'replace' && existingTables.includes(tableName)) {
        // Table exists and we didn't recreate it, so it's ready for inserts
      } else {
        errors.push({ query: `CREATE TABLE "${tableName}"`, error: 'No create query found and table does not exist.' });
        continue;
      }

      // Insert data
      let insertedCount = 0;
      for (const insert of table.insertQueries) {
        const insertRes = await executeSql(insert);
        if (insertRes.success) {
          insertedCount += insertRes.rowsAffected || 0;
        } else {
          errors.push({ query: insert.substring(0, 100) + '...', error: insertRes.error || 'Unknown error' });
        }
      }
      rowsInserted[tableName] = insertedCount;
    }

    setImportReport({
      tablesCreated,
      rowsInserted,
      errors
    });
    setImporting(false);
    await fetchSchema();
  };

  const conflictCount = Object.keys(conflicts).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="w-full max-w-2xl bg-bg-primary rounded-2xl border border-border-secondary shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-secondary bg-bg-secondary/40">
          <div className="flex items-center gap-2.5">
            <Upload size={18} className="text-system-blue" />
            <h2 className="text-base font-bold text-text-primary">Import SQL Dump</h2>
          </div>
          <button onClick={onClose} className="p-1 text-text-secondary hover:bg-bg-tertiary rounded-lg transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {!file && (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border-primary/60 hover:border-system-blue rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer bg-bg-secondary/10 hover:bg-system-blue/5 transition-all group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".sql"
                className="hidden"
              />
              <div className="w-12 h-12 bg-system-blue/10 text-system-blue rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload size={22} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-text-primary">Click or drag a file to upload</p>
                <p className="text-xs text-text-secondary mt-1">Supports MySQL Dump (.sql) files</p>
              </div>
            </div>
          )}

          {parsing && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-8 h-8 border-2 border-system-blue border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-text-secondary">Analyzing database structure and constraints...</p>
            </div>
          )}

          {parsedData && !importing && !importReport && (
            <div className="space-y-4">
              {/* File Info */}
              <div className="flex items-center gap-3 p-3 bg-bg-secondary rounded-xl border border-border-secondary">
                <FileText size={18} className="text-text-secondary" />
                <div className="text-xs flex-1">
                  <p className="font-semibold text-text-primary">{file?.name}</p>
                  <p className="text-text-secondary mt-0.5">
                    Detected {parsedData.tables.length} tables and {parsedData.skippedStatements.length} non-import statements (comments, engine configuration, etc.).
                  </p>
                </div>
              </div>

              {/* Conflict Warning */}
              {conflictCount > 0 && (
                <div className="p-4 bg-system-orange/10 border border-system-orange/20 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-system-orange font-semibold text-xs">
                    <AlertTriangle size={16} />
                    <span>Table Name Conflicts Detected ({conflictCount})</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Some tables in the dump already exist in the database. Choose whether to replace (delete existing and load new) or skip.
                  </p>
                  
                  <div className="divide-y divide-border-secondary/40 border-t border-border-secondary/40 max-h-48 overflow-y-auto pt-2">
                    {Object.keys(conflicts).map((tableName) => (
                      <div key={tableName} className="flex items-center justify-between py-2 text-xs">
                        <span className="font-mono text-text-primary font-medium">{tableName}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setConflicts(prev => ({ ...prev, [tableName]: 'skip' }))}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium border cursor-pointer transition-colors ${
                              conflicts[tableName] === 'skip'
                                ? 'bg-bg-tertiary border-border-primary text-text-primary font-semibold'
                                : 'border-border-secondary text-text-secondary hover:bg-bg-secondary'
                            }`}
                          >
                            Skip
                          </button>
                          <button
                            onClick={() => setConflicts(prev => ({ ...prev, [tableName]: 'replace' }))}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium border cursor-pointer transition-colors ${
                              conflicts[tableName] === 'replace'
                                ? 'bg-system-red/10 border-system-red/25 text-system-red font-semibold'
                                : 'border-border-secondary text-text-secondary hover:bg-bg-secondary'
                            }`}
                          >
                            Replace
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Schema Details */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Import Plan (Dependency Order)</h3>
                <div className="border border-border-secondary rounded-xl overflow-hidden divide-y divide-border-secondary bg-bg-primary">
                  {parsedData.importOrder.map((tableName, index) => {
                    const table = parsedData.tables.find(t => t.name === tableName);
                    const conflict = conflicts[tableName];
                    return (
                      <div key={tableName} className="flex items-center justify-between px-4 py-2.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-text-tertiary font-mono">{index + 1}.</span>
                          <span className="font-mono text-text-primary font-medium">{tableName}</span>
                          {table?.dependencies.length ? (
                            <span className="text-[10px] text-text-secondary bg-bg-secondary px-1.5 py-0.5 rounded-full">
                              depends on: {table.dependencies.join(', ')}
                            </span>
                          ) : null}
                        </div>
                        <div>
                          {conflict === 'skip' ? (
                            <span className="text-[10px] font-semibold text-text-secondary uppercase">Skipping</span>
                          ) : conflict === 'replace' ? (
                            <span className="text-[10px] font-semibold text-system-red uppercase">Recreating</span>
                          ) : (
                            <span className="text-[10px] font-semibold text-system-green uppercase">Creating</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {importing && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-8 h-8 border-2 border-system-blue border-t-transparent rounded-full animate-spin"></div>
              <div className="text-center">
                <p className="text-sm font-semibold text-text-primary">Running Import...</p>
                <p className="text-xs text-text-secondary mt-1">{importStep}</p>
              </div>
            </div>
          )}

          {importReport && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center p-4 bg-system-green/10 border border-system-green/20 rounded-xl gap-2 text-center">
                <CheckCircle size={32} className="text-system-green" />
                <h3 className="text-sm font-bold text-text-primary">Import Completed</h3>
                <p className="text-xs text-text-secondary">
                  Successfully processed {importReport.tablesCreated.length} tables and resolved schema constraints.
                </p>
              </div>

              {/* Table Report */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Tables Summary</h4>
                <div className="border border-border-secondary rounded-xl overflow-hidden divide-y divide-border-secondary bg-bg-primary">
                  {parsedData?.importOrder.map((tableName) => {
                    const created = importReport.tablesCreated.includes(tableName);
                    const rows = importReport.rowsInserted[tableName] || 0;
                    const action = conflicts[tableName];
                    
                    if (action === 'skip') {
                      return (
                        <div key={tableName} className="flex items-center justify-between px-4 py-2.5 text-xs text-text-secondary">
                          <span className="font-mono">{tableName}</span>
                          <span className="text-[10px] font-medium uppercase">Skipped</span>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={tableName} className="flex items-center justify-between px-4 py-2.5 text-xs">
                        <span className="font-mono text-text-primary font-medium">{tableName}</span>
                        <div className="flex items-center gap-3">
                          {created ? (
                            <span className="text-[10px] font-semibold text-system-green uppercase">Success</span>
                          ) : (
                            <span className="text-[10px] font-semibold text-system-red uppercase">Failed</span>
                          )}
                          <span className="text-text-secondary">{rows} rows inserted</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Errors */}
              {importReport.errors.length > 0 && (
                <div className="p-4 bg-system-red/10 border border-system-red/20 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-system-red font-semibold text-xs">
                    <ShieldAlert size={16} />
                    <span>Failed Statements ({importReport.errors.length})</span>
                  </div>
                  <div className="divide-y divide-border-secondary/40 max-h-40 overflow-y-auto text-[11px] font-mono space-y-2">
                    {importReport.errors.map((err, i) => (
                      <div key={i} className="pt-2">
                        <p className="text-text-primary font-medium">{err.query}</p>
                        <p className="text-system-red mt-0.5">{err.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-secondary bg-bg-secondary/40 flex items-center justify-between">
          <div className="text-xs text-text-secondary">
            {parsedData && !importing && !importReport
              ? `${parsedData.tables.length} tables ready to process`
              : null}
          </div>
          <div className="flex items-center gap-2">
            {!importReport ? (
              <>
                <button
                  onClick={onClose}
                  disabled={importing}
                  className="px-4 py-1.5 text-text-secondary bg-bg-secondary hover:bg-bg-tertiary border border-border-secondary text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                {parsedData && (
                  <button
                    onClick={startImport}
                    disabled={importing}
                    className="px-4 py-1.5 text-white bg-system-blue hover:bg-system-blue/90 text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-sm"
                  >
                    Import Data
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-white bg-system-blue hover:bg-system-blue/90 text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-sm"
              >
                Close Report
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

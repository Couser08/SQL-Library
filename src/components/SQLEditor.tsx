import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import type { Monaco } from '@monaco-editor/react';
import { useDatabaseStore } from '../store/useDatabaseStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, AlertTriangle, Clock, Download } from 'lucide-react';
import { translateSqlFile } from '../lib/sqlTranslator';



export const SQLEditor: React.FC = () => {
  const {
    schema,
    executeSql,
    queryHistory,
    fetchSchema
  } = useDatabaseStore();

  const [query, setQuery] = useState('SELECT * FROM "user_details" LIMIT 10;');
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rowsAffected, setRowsAffected] = useState<number | null>(null);
  const [executing, setExecuting] = useState(false);
  const [editorRef, setEditorRef] = useState<any>(null);

  // Destructive query modal state
  const [showDestructiveModal, setShowDestructiveModal] = useState(false);
  const [destructiveWarningText, setDestructiveWarningText] = useState('');

  // Configure autocomplete in Monaco
  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    setEditorRef(editor);

    monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        const suggestions: any[] = [];

        // Add SQL Keywords
        const keywords = ['SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'DROP', 'TRUNCATE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'ON', 'LIMIT', 'OFFSET', 'ORDER', 'BY', 'ASC', 'DESC', 'GROUP', 'HAVING'];
        keywords.forEach(kw => {
          suggestions.push({
            label: kw,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: kw,
            range
          });
        });

        // Add Schema Tables & Columns
        Object.entries(schema).forEach(([tableName, tbl]) => {
          suggestions.push({
            label: tableName,
            kind: monaco.languages.CompletionItemKind.Class,
            insertText: `"${tableName}"`,
            detail: 'Table',
            range
          });

          tbl.columns.forEach(col => {
            suggestions.push({
              label: `${tableName}.${col.name}`,
              kind: monaco.languages.CompletionItemKind.Field,
              insertText: `"${col.name}"`,
              detail: `Column (${col.type})`,
              range
            });
          });
        });

        return { suggestions };
      }
    });
  };

  const checkDestructiveQuery = (sql: string): string | null => {
    const uppercaseSql = sql.toUpperCase().trim();
    
    if (uppercaseSql.includes('UPDATE') && !uppercaseSql.includes('WHERE')) {
      return 'You are executing an UPDATE statement without a WHERE clause. This will modify all rows in the table.';
    }
    if (uppercaseSql.includes('DELETE') && !uppercaseSql.includes('WHERE')) {
      return 'You are executing a DELETE statement without a WHERE clause. This will delete all rows in the table.';
    }
    if (uppercaseSql.includes('DROP')) {
      return 'You are executing a DROP statement. This will permanently delete database structures.';
    }
    if (uppercaseSql.includes('TRUNCATE')) {
      return 'You are executing a TRUNCATE statement. This will empty all rows in the table.';
    }
    return null;
  };

  const getQueryToExecute = (): string => {
    if (editorRef) {
      const selection = editorRef.getSelection();
      const selectedText = editorRef.getModel().getValueInRange(selection);
      if (selectedText.trim()) {
        return selectedText;
      }
    }
    return query;
  };

  const handleExecuteClick = () => {
    const sqlToRun = getQueryToExecute();
    const warning = checkDestructiveQuery(sqlToRun);
    if (warning) {
      setDestructiveWarningText(warning);
      setShowDestructiveModal(true);
    } else {
      runQuery(sqlToRun);
    }
  };

  const runQuery = async (sqlToRun: string) => {
    setExecuting(true);
    setError(null);
    setResults(null);
    setRowsAffected(null);

    let queryToExecute = sqlToRun;
    const isCreateOrInsert = /^\s*(CREATE\s+TABLE|INSERT\s+INTO)/i.test(sqlToRun);
    
    if (isCreateOrInsert) {
      try {
        const transResult = translateSqlFile(sqlToRun);
        if (transResult.tables && transResult.tables.length > 0) {
          const queries = transResult.tables.map(t => {
            let q = t.createQuery;
            if (t.insertQueries && t.insertQueries.length > 0) {
              q += '\n' + t.insertQueries.join('\n');
            }
            return q;
          });
          if (queries.length > 0) {
            queryToExecute = queries.join('\n');
          }
        }
      } catch (err) {
        console.warn('SQL editor DDL translation failed, using raw query:', err);
      }
    } else {
      queryToExecute = sqlToRun.replace(/`/g, '"');
    }

    const res = await executeSql(queryToExecute);
    if (res.success) {
      setResults(res.data || []);
      setRowsAffected(res.rowsAffected ?? null);
      
      const uppercaseSql = sqlToRun.toUpperCase().trim();
      const isSchemaModifying = uppercaseSql.startsWith('CREATE') || uppercaseSql.startsWith('DROP') || uppercaseSql.startsWith('ALTER') || uppercaseSql.startsWith('TRUNCATE');
      if (isSchemaModifying) {
        await fetchSchema();
      }
    } else {
      setError(res.error || 'Execution failed.');
    }
    setExecuting(false);
  };

  const exportCSV = () => {
    if (!results || results.length === 0) return;
    const headers = Object.keys(results[0]);
    const csvRows = [
      headers.join(','),
      ...results.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `query_result_${Date.now()}.csv`);
    a.click();
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-bg-primary overflow-hidden font-sans">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-h-0 p-5 space-y-4 border-r border-border-secondary">
        
        {/* macOS Style Window Wrapper */}
        <div className="flex-1 flex flex-col border border-border-primary/80 dark:border-border-secondary rounded-xl overflow-hidden shadow-md bg-bg-secondary/20">
          
          {/* macOS Title Bar */}
          <div className="h-10 px-4 bg-bg-secondary flex items-center justify-between border-b border-border-secondary select-none shrink-0">
            {/* Window Controls */}
            <div className="flex items-center gap-1.5 w-1/3">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]"></div>
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]"></div>
              <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]"></div>
            </div>

            {/* Window Title */}
            <div className="text-[11px] font-semibold text-text-secondary font-sans truncate text-center w-1/3">
              sql_editor.sql
            </div>

            {/* Run Button and Controls */}
            <div className="w-1/3 flex justify-end">
              <button
                onClick={handleExecuteClick}
                disabled={executing}
                className="px-3 py-1 bg-system-blue hover:bg-system-blue/90 disabled:opacity-50 text-white text-[11px] font-semibold rounded-md shadow-sm flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Play size={10} className="fill-white" />
                <span>Execute</span>
              </button>
            </div>
          </div>

          {/* Monaco Editor Workspace */}
          <div className="flex-1 min-h-[200px] relative bg-[#1e1e1e]">
            <Editor
              height="100%"
              defaultLanguage="sql"
              theme="vs-dark"
              value={query}
              onChange={(val) => setQuery(val || '')}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: '"SF Mono", "JetBrains Mono", "Fira Code", Menlo, Monaco, Courier New, monospace',
                automaticLayout: true,
                padding: { top: 8 }
              }}
            />
          </div>
        </div>

        {/* Results Panel */}
        <div className="flex-1 flex flex-col min-h-0 border border-border-secondary rounded-xl overflow-hidden bg-bg-secondary/10">
          <div className="px-4 py-2 bg-bg-secondary/30 flex items-center justify-between border-b border-border-secondary">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Results</span>
            {results && results.length > 0 && (
              <button
                onClick={exportCSV}
                className="flex items-center gap-1 text-[10px] font-semibold text-system-blue hover:underline cursor-pointer"
              >
                <Download size={12} />
                <span>Export CSV</span>
              </button>
            )}
          </div>
          <div className="flex-1 overflow-auto p-4 font-mono text-xs">
            {executing ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
                <div className="w-5 h-5 border-2 border-system-blue border-t-transparent rounded-full animate-spin"></div>
                <span className="text-text-secondary text-xs">Executing query...</span>
              </div>
            ) : error ? (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-system-red rounded-xl whitespace-pre-wrap">
                {error}
              </div>
            ) : results ? (
              results.length === 0 ? (
                <div className="text-text-secondary py-8 text-center text-xs">
                  Query executed successfully. {rowsAffected !== null ? `${rowsAffected} rows affected.` : 'No result set returned.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border-secondary bg-bg-secondary/40 font-bold">
                        {Object.keys(results[0]).map((h) => (
                          <th key={h} className="p-2 border-r border-border-secondary text-text-primary">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-secondary">
                      {results.slice(0, 21).map((row, i) => (
                        <tr key={i} className="hover:bg-bg-secondary/20">
                          {Object.entries(row).map(([k, v]) => (
                            <td key={k} className="p-2 border-r border-border-secondary max-w-[200px] truncate" title={String(v)}>
                              {v === null ? <span className="text-text-tertiary">NULL</span> : String(v)}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {results.length > 21 && (
                        <tr className="bg-bg-secondary/10 hover:bg-bg-secondary/15 font-sans">
                          <td colSpan={Object.keys(results[0]).length} className="p-3 text-center text-text-secondary text-[11px]">
                            Showing 21 of {results.length} rows — 
                            <span className="inline-flex items-center px-1.5 py-0.5 ml-1 rounded-md bg-bg-tertiary text-text-primary font-mono font-bold text-[10px]">
                              {results.length - 21}+ rows
                            </span> remaining.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )

            ) : (
              <div className="text-text-tertiary h-full flex items-center justify-center text-xs">
                Run a command or select text and execute to view results.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Log Pane */}
      <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-border-secondary p-5 flex flex-col min-h-0 bg-bg-secondary/15 shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={15} className="text-text-secondary" />
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Query History</h3>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2.5">
          {queryHistory.length === 0 ? (
            <div className="text-center text-xs text-text-tertiary py-10">No queries run yet.</div>
          ) : (
            queryHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => setQuery(item.query)}
                className="w-full text-left p-3 bg-bg-primary hover:bg-bg-tertiary border border-border-secondary/60 rounded-xl text-xs space-y-1.5 transition-all block cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[9px] text-text-tertiary">
                  <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  {item.success ? (
                    <span className="text-system-green font-semibold">Success</span>
                  ) : (
                    <span className="text-system-red font-semibold">Failed</span>
                  )}
                </div>
                <p className="font-mono text-[11px] truncate text-text-primary group-hover:text-system-blue transition-colors">
                  {item.query}
                </p>
                {item.rowsAffected !== undefined && (
                  <span className="text-[10px] text-text-secondary block">
                    {item.rowsAffected} rows affected
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Destructive Warning Confirmation Modal */}
      <AnimatePresence>
        {showDestructiveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-bg-primary border border-border-secondary shadow-2xl rounded-2xl p-6"
            >
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 bg-system-red/10 text-system-red rounded-xl flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div className="text-xs">
                  <h4 className="text-sm font-bold text-text-primary">Confirm Destructive Action</h4>
                  <p className="text-text-secondary mt-1.5 leading-relaxed">{destructiveWarningText}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowDestructiveModal(false)}
                  className="px-4 py-1.5 text-text-secondary bg-bg-secondary hover:bg-bg-tertiary border border-border-secondary text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDestructiveModal(false);
                    runQuery(getQueryToExecute());
                  }}
                  className="px-4 py-1.5 text-white bg-system-red hover:bg-system-red/90 text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-sm"
                >
                  Execute Anyway
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useDatabaseStore } from '../store/useDatabaseStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Plus, Trash2, Edit2, Check, X, Filter, ChevronLeft, ChevronRight, AlertCircle, Eye, EyeOff } from 'lucide-react';


export const TableGrid: React.FC = () => {
  const {
    selectedTable,
    schema,
    gridRows,
    gridTotalRows,
    gridPage,
    gridLimit,
    gridFilters,
    gridSort,
    loadingData,
    updateRow,
    deleteRow,
    insertRow,
    setGridPage,
    setGridFilters,
    setGridSort,
    executeSql
  } = useDatabaseStore();


  const activeSchema = selectedTable ? schema[selectedTable] : null;

  // Editing state
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Record<string, any>>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  // New row insertion state
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});
  const [showNewRowPassword, setShowNewRowPassword] = useState<Record<string, boolean>>({});

  // Password visibility grid state: Record<"rowIndex-columnName", boolean>
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});


  // Filter UI state
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);

  // Foreign Key dropdown options cache
  // Record<referencedTableName, Array<{ value: any, label: string }>>
  const [fkOptions, setFkOptions] = useState<Record<string, { value: any; label: string }[]>>({});

  // Load Foreign Key display values
  useEffect(() => {
    if (!activeSchema) return;
    
    const loadFkOptions = async () => {
      const newFkOptions: Record<string, { value: any; label: string }[]> = {};
      
      for (const fk of activeSchema.foreignKeys) {
        // Fetch target table rows to resolve labels
        const query = `SELECT * FROM "${fk.referencedTable}" LIMIT 200;`;
        const res = await executeSql(query);
        
        if (res.success && res.data) {
          // Find a good label column (e.g. name, title, email, username, label, or fallback to PK)
          const sampleRow = res.data[0];
          let labelCol = fk.referencedColumn;
          
          if (sampleRow) {
            const candidates = ['name', 'title', 'username', 'email', 'label', 'description'];
            const found = candidates.find(c => c in sampleRow);
            if (found) labelCol = found;
          }

          newFkOptions[fk.referencedTable] = res.data.map((row: any) => ({
            value: row[fk.referencedColumn],
            label: `${row[labelCol]} (${row[fk.referencedColumn]})`
          }));
        }
      }
      setFkOptions(newFkOptions);
    };

    loadFkOptions();
    setEditingRowIndex(null);
    setIsAddingRow(false);
  }, [selectedTable, activeSchema]);

  if (!selectedTable || !activeSchema) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-bg-primary">
        <AlertCircle size={40} className="text-text-tertiary mb-3" />
        <h3 className="text-sm font-semibold text-text-primary">No Table Selected</h3>
        <p className="text-xs text-text-secondary mt-1">Select a table from the sidebar to browse and manage data.</p>
      </div>
    );
  }

  const columns = activeSchema.columns;
  const primaryKeys = activeSchema.primaryKeys;

  // Inline Validation
  const validateData = (data: Record<string, any>, isNew = false): boolean => {
    for (const col of columns) {
      const val = data[col.name];
      
      // Not Null Check
      if (!col.isNullable && (val === undefined || val === null || val === '')) {
        // Skip check if it's an auto-increment column on insertion
        const isAutoId = isNew && primaryKeys.includes(col.name) && col.defaultValue?.includes('nextval');
        if (!isAutoId) {
          setValidationError(`Column "${col.name}" cannot be empty.`);
          return false;
        }
      }

      // Type Check
      if (val !== undefined && val !== null && val !== '') {
        if (col.type.includes('int') || col.type.includes('decimal') || col.type.includes('numeric') || col.type.includes('real')) {
          if (isNaN(Number(val))) {
            setValidationError(`Column "${col.name}" must be a number.`);
            return false;
          }
        }
      }
    }
    setValidationError(null);
    return true;
  };

  // Row operations
  const getPkValues = (row: Record<string, any>) => {
    const pkVals: Record<string, any> = {};
    for (const pk of primaryKeys) {
      pkVals[pk] = row[pk];
    }
    return pkVals;
  };

  const handleStartEdit = (index: number, row: Record<string, any>) => {
    setEditingRowIndex(index);
    setEditingData({ ...row });
    setValidationError(null);
  };

  const handleSaveEdit = async (index: number) => {
    if (!validateData(editingData)) return;

    const originalRow = gridRows[index];
    const pkVals = getPkValues(originalRow);
    
    // Filter down to only changed fields
    const updatedValues: Record<string, any> = {};
    for (const col of columns) {
      if (editingData[col.name] !== originalRow[col.name]) {
        updatedValues[col.name] = editingData[col.name];
      }
    }

    const success = await updateRow(selectedTable, pkVals, updatedValues);
    if (success) {
      setEditingRowIndex(null);
    } else {
      setValidationError('Update failed. Ensure foreign key integrity.');
    }
  };

  const handleDelete = async (row: Record<string, any>) => {
    if (confirm('Are you sure you want to delete this row? This action is destructive and immediate.')) {
      const pkVals = getPkValues(row);
      await deleteRow(selectedTable, pkVals);
    }
  };

  const handleAddRowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateData(newRowData, true)) return;

    const success = await insertRow(selectedTable, newRowData);
    if (success) {
      setIsAddingRow(false);
      setNewRowData({});
      setValidationError(null);
    } else {
      setValidationError('Insertion failed. Check constraint violations.');
    }
  };

  const toggleSort = (colName: string) => {
    if (gridSort && gridSort.column === colName) {
      if (gridSort.direction === 'ASC') {
        setGridSort({ column: colName, direction: 'DESC' });
      } else {
        setGridSort(null);
      }
    } else {
      setGridSort({ column: colName, direction: 'ASC' });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-bg-primary select-text">
      {/* Top Action Bar */}
      <div className="px-6 py-3 border-b border-border-secondary flex items-center justify-between bg-bg-secondary/20">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-text-primary font-mono">{selectedTable}</h2>
          <span className="text-[10px] text-text-secondary bg-bg-tertiary px-2 py-0.5 rounded-full">
            {gridTotalRows} rows
          </span>
        </div>
        <button
          onClick={() => {
            setIsAddingRow(true);
            setValidationError(null);
            setNewRowData({});
          }}
          className="px-3 py-1.5 bg-system-blue hover:bg-system-blue/90 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Plus size={14} />
          <span>Add Row</span>
        </button>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-auto relative">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-bg-secondary/95 backdrop-blur-xs z-20 border-b border-border-secondary shadow-[0_1px_0_0_rgba(0,0,0,0.08)]">
            <tr>
              <th className="p-3 w-14 text-center text-[10px] font-bold text-text-tertiary uppercase select-none bg-bg-secondary/50">Actions</th>
              {columns.map((col) => {
                const isPk = primaryKeys.includes(col.name);
                const isFk = activeSchema.foreignKeys.some(f => f.columnName === col.name);
                const isSorted = gridSort?.column === col.name;

                return (
                  <th key={col.name} className="p-3 border-r border-border-secondary/60 text-[10px] font-bold text-text-secondary uppercase select-none min-w-[160px] bg-bg-secondary/50">
                    <div className="flex items-center justify-between">
                      <button onClick={() => toggleSort(col.name)} className="flex items-center gap-1 hover:text-text-primary transition-colors cursor-pointer font-mono truncate mr-2">
                        <span className="truncate">{col.name}</span>
                        <span className="text-[8px] font-semibold text-text-tertiary bg-bg-secondary/70 border border-border-secondary px-1 py-0.5 rounded ml-1 lowercase font-sans shrink-0">
                          {col.type.split('(')[0]}
                        </span>
                        {isPk && <span className="text-[9px] text-system-blue font-sans ml-0.5 shrink-0" title="Primary Key">🔑</span>}
                        {isFk && <span className="text-[9px] text-system-orange font-sans ml-0.5 shrink-0" title="Foreign Key">🔗</span>}
                        {isSorted && (
                          gridSort.direction === 'ASC' 
                            ? <ChevronUp size={11} className="text-system-blue shrink-0" /> 
                            : <ChevronDown size={11} className="text-system-blue shrink-0" />
                        )}
                      </button>

                      {/* Filter Button */}
                      <button
                        onClick={() => setActiveFilterColumn(activeFilterColumn === col.name ? null : col.name)}
                        className={`p-1 rounded hover:bg-bg-tertiary transition-colors cursor-pointer ${gridFilters[col.name]?.value ? 'text-system-blue' : 'text-text-tertiary'}`}
                      >
                        <Filter size={11} />
                      </button>
                    </div>

                    {/* Popover Filter UI */}
                    <AnimatePresence>
                      {activeFilterColumn === col.name && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute mt-2 p-3 bg-bg-primary border border-border-secondary shadow-lg rounded-xl z-30 w-52 font-normal text-xs text-text-primary normal-case space-y-2 left-auto right-auto"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold">Filter {col.name}</span>
                            <button onClick={() => setActiveFilterColumn(null)} className="text-text-tertiary hover:text-text-primary">
                              <X size={13} />
                            </button>
                          </div>
                          
                          {/* Operator */}
                          <select
                            value={gridFilters[col.name]?.operator || 'contains'}
                            onChange={(e) => setGridFilters({
                              ...gridFilters,
                              [col.name]: {
                                type: col.type.includes('int') || col.type.includes('dec') ? 'number' : col.type.includes('date') || col.type.includes('time') ? 'date' : 'text',
                                operator: e.target.value,
                                value: gridFilters[col.name]?.value || ''
                              }
                            })}
                            className="w-full p-1.5 border border-border-secondary rounded-lg bg-bg-secondary"
                          >
                            {col.type.includes('int') || col.type.includes('dec') ? (
                              <>
                                <option value="equals">Equals</option>
                                <option value="gt">Greater Than</option>
                                <option value="lt">Less Than</option>
                              </>
                            ) : col.type.includes('date') || col.type.includes('time') ? (
                              <>
                                <option value="equals">Equals</option>
                                <option value="after">After</option>
                                <option value="before">Before</option>
                              </>
                            ) : (
                              <>
                                <option value="contains">Contains</option>
                                <option value="equals">Equals</option>
                              </>
                            )}
                          </select>

                          {/* Value */}
                          <input
                            type={col.type.includes('date') || col.type.includes('time') ? 'date' : 'text'}
                            value={gridFilters[col.name]?.value || ''}
                            onChange={(e) => setGridFilters({
                              ...gridFilters,
                              [col.name]: {
                                type: col.type.includes('int') || col.type.includes('dec') ? 'number' : col.type.includes('date') || col.type.includes('time') ? 'date' : 'text',
                                operator: gridFilters[col.name]?.operator || 'equals',
                                value: e.target.value
                              }
                            })}
                            className="w-full px-2 py-1 bg-bg-secondary border border-border-secondary rounded-lg text-xs"
                            placeholder="Value..."
                          />

                          <div className="flex justify-between gap-2 pt-1">
                            <button
                              onClick={() => {
                                const newFilters = { ...gridFilters };
                                delete newFilters[col.name];
                                setGridFilters(newFilters);
                                setActiveFilterColumn(null);
                              }}
                              className="px-2 py-1 text-[10px] text-system-red bg-red-500/10 border border-red-500/20 rounded-md"
                            >
                              Clear
                            </button>
                            <button
                              onClick={() => setActiveFilterColumn(null)}
                              className="px-2.5 py-1 text-[10px] text-white bg-system-blue rounded-md font-semibold"
                            >
                              Apply
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-secondary">
            {loadingData ? (
              <tr>
                <td colSpan={columns.length + 1} className="p-8 text-center text-xs text-text-secondary">
                  <div className="w-6 h-6 border-2 border-system-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Loading data...
                </td>
              </tr>
            ) : gridRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="p-8 text-center text-xs text-text-secondary">
                  No records found matching current query.
                </td>
              </tr>
            ) : (
              gridRows.map((row, idx) => {
                const isEditing = editingRowIndex === idx;

                return (
                  <tr key={idx} className="hover:bg-bg-secondary/25 odd:bg-bg-secondary/5 transition-colors text-xs font-mono">
                    <td className="p-2 border-r border-border-secondary/60 text-center space-x-1 shrink-0 flex items-center justify-center bg-bg-secondary/10">
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSaveEdit(idx)} className="p-1 text-system-green hover:bg-green-500/10 rounded cursor-pointer transition-colors" title="Save changes">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditingRowIndex(null)} className="p-1 text-system-red hover:bg-red-500/10 rounded cursor-pointer transition-colors" title="Cancel edit">
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleStartEdit(idx, row)} className="p-1 text-text-secondary hover:text-system-blue rounded cursor-pointer transition-colors">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDelete(row)} className="p-1 text-text-secondary hover:text-system-red rounded cursor-pointer transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </td>

                    {columns.map((col) => {
                      const fkRelation = activeSchema.foreignKeys.find(f => f.columnName === col.name);
                      
                      return (
                        <td key={col.name} className="p-3 border-r border-border-secondary/30 max-w-[250px] min-w-[160px] truncate text-text-secondary">
                          {isEditing ? (
                            fkRelation ? (
                              // Searchable Foreign Key Dropdown
                              <select
                                value={editingData[col.name] ?? ''}
                                onChange={(e) => setEditingData({ ...editingData, [col.name]: e.target.value || null })}
                                className="w-full px-2 py-1 border border-border-primary dark:border-border-secondary rounded bg-bg-primary text-xs focus:outline-none focus:border-system-blue focus:ring-1 focus:ring-system-blue"
                              >
                                <option value="">NULL</option>
                                {(fkOptions[fkRelation.referencedTable] || []).map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              // Normal Input
                              <input
                                type={col.type.includes('int') || col.type.includes('dec') ? 'number' : col.type.includes('date') || col.type.includes('time') ? 'date' : 'text'}
                                value={editingData[col.name] ?? ''}
                                onChange={(e) => setEditingData({ ...editingData, [col.name]: e.target.value === '' ? null : e.target.value })}
                                className="w-full px-2 py-1 border border-border-primary dark:border-border-secondary rounded bg-bg-primary text-xs font-mono focus:outline-none focus:border-system-blue focus:ring-1 focus:ring-system-blue"
                              />
                            )
                          ) : (
                            fkRelation ? (
                              // Display Label as a pill instead of ID
                              row[col.name] === null ? (
                                <span className="text-text-tertiary italic">NULL</span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-system-blue/10 text-system-blue font-sans text-[10px] font-bold border border-system-blue/15 shadow-xs">
                                  {fkOptions[fkRelation.referencedTable]?.find(opt => opt.value === row[col.name])?.label || String(row[col.name])}
                                </span>
                              )
                            ) : (
                              col.name.toLowerCase().includes('password') && row[col.name] !== null && row[col.name] !== undefined ? (
                                <div className="flex items-center justify-between gap-1.5 w-full">
                                  <span className="font-mono text-text-secondary select-all">
                                    {revealedPasswords[`${idx}-${col.name}`] 
                                      ? String(row[col.name]) 
                                      : '••••••••'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setRevealedPasswords(prev => ({
                                      ...prev,
                                      [`${idx}-${col.name}`]: !prev[`${idx}-${col.name}`]
                                    }))}
                                    className="p-0.5 text-text-tertiary hover:text-text-secondary cursor-pointer transition-colors"
                                    title={revealedPasswords[`${idx}-${col.name}`] ? 'Hide value' : 'Show value'}
                                  >
                                    {revealedPasswords[`${idx}-${col.name}`] ? <EyeOff size={11} /> : <Eye size={11} />}
                                  </button>
                                </div>
                              ) : row[col.name] === null || row[col.name] === undefined ? (
                                <span className="text-text-tertiary italic">NULL</span>
                              ) : (
                                String(row[col.name])
                              )
                            )
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="bg-system-red/10 border-t border-system-red/20 px-6 py-2 flex items-center gap-2 text-system-red text-xs">
          <AlertCircle size={14} className="shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Slide-over Form to Add Row */}
      <AnimatePresence>
        {isAddingRow && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-xs">
            <motion.form
              onSubmit={handleAddRowSubmit}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="w-full max-w-md bg-bg-primary h-full shadow-2xl border-l border-border-secondary flex flex-col"
            >
              {/* Form Header */}
              <div className="p-5 border-b border-border-secondary flex items-center justify-between bg-bg-secondary/40">
                <h3 className="text-sm font-bold text-text-primary">Add Row to {selectedTable}</h3>
                <button type="button" onClick={() => setIsAddingRow(false)} className="p-1 rounded hover:bg-bg-tertiary text-text-secondary cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {columns.map((col) => {
                  const fkRelation = activeSchema.foreignKeys.find(f => f.columnName === col.name);
                  const isPk = primaryKeys.includes(col.name);
                  const isAutoIncrement = col.defaultValue?.includes('nextval');

                  if (isAutoIncrement && isPk) {
                    return (
                      <div key={col.name} className="text-xs">
                        <label className="block text-text-secondary font-semibold uppercase tracking-wider mb-1">{col.name}</label>
                        <input
                          disabled
                          type="text"
                          placeholder="Generated Automatically (Identity)"
                          className="w-full px-3 py-2 bg-bg-secondary border border-border-secondary rounded-lg opacity-60 text-xs font-mono"
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={col.name} className="text-xs">
                      <label className="block text-text-secondary font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <span>{col.name}</span>
                        {!col.isNullable && <span className="text-system-red">*</span>}
                        {isPk && <span className="text-[10px] text-system-blue">(Primary Key)</span>}
                      </label>

                      {fkRelation ? (
                        <select
                          value={newRowData[col.name] ?? ''}
                          onChange={(e) => setNewRowData({ ...newRowData, [col.name]: e.target.value || null })}
                          className="w-full px-3 py-2 bg-bg-secondary border border-border-secondary rounded-lg text-xs"
                        >
                          <option value="">Select referenced row...</option>
                          {(fkOptions[fkRelation.referencedTable] || []).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : col.name.toLowerCase().includes('password') ? (
                        <div className="relative">
                          <input
                            type={showNewRowPassword[col.name] ? 'text' : 'password'}
                            value={newRowData[col.name] ?? ''}
                            onChange={(e) => setNewRowData({ ...newRowData, [col.name]: e.target.value === '' ? null : e.target.value })}
                            className="w-full pl-3 pr-10 py-2 bg-bg-secondary border border-border-secondary rounded-lg text-xs font-mono"
                            required={!col.isNullable}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewRowPassword(prev => ({
                              ...prev,
                              [col.name]: !prev[col.name]
                            }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary cursor-pointer"
                          >
                            {showNewRowPassword[col.name] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      ) : (
                        <input
                          type={col.type.includes('int') || col.type.includes('dec') ? 'number' : col.type.includes('date') || col.type.includes('time') ? 'date' : 'text'}
                          value={newRowData[col.name] ?? ''}
                          onChange={(e) => setNewRowData({ ...newRowData, [col.name]: e.target.value === '' ? null : e.target.value })}
                          className="w-full px-3 py-2 bg-bg-secondary border border-border-secondary rounded-lg text-xs font-mono"
                          required={!col.isNullable}
                        />
                      )}

                    </div>
                  );
                })}
              </div>

              {/* Form Footer */}
              <div className="p-4 border-t border-border-secondary bg-bg-secondary/40 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingRow(false)}
                  className="px-4 py-2 bg-bg-secondary hover:bg-bg-tertiary border border-border-secondary text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-system-blue hover:bg-system-blue/90 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-sm"
                >
                  Save Row
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Pagination Footer */}
      <div className="px-6 py-3 border-t border-border-secondary flex items-center justify-between bg-bg-secondary/20 select-none">
        <div className="text-[10px] text-text-secondary">
          Showing {Math.min(gridRows.length, 1)} to {gridRows.length} of {gridTotalRows} rows
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setGridPage(gridPage - 1)}
            disabled={gridPage === 1 || loadingData}
            className="p-1 rounded border border-border-secondary bg-bg-primary text-text-secondary disabled:opacity-40 hover:bg-bg-secondary cursor-pointer transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs px-2 text-text-secondary">Page {gridPage} of {Math.max(1, Math.ceil(gridTotalRows / gridLimit))}</span>
          <button
            onClick={() => setGridPage(gridPage + 1)}
            disabled={gridPage * gridLimit >= gridTotalRows || loadingData}
            className="p-1 rounded border border-border-secondary bg-bg-primary text-text-secondary disabled:opacity-40 hover:bg-bg-secondary cursor-pointer transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export interface ColumnMetadata {
  name: string;
  type: string;
  isNullable: boolean;
  defaultValue: string | null;
  maxLength: number | null;
}

export interface ForeignKeyMetadata {
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
}

export interface TableSchema {
  name: string;
  columns: ColumnMetadata[];
  primaryKeys: string[];
  foreignKeys: ForeignKeyMetadata[];
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  query: string;
  success: boolean;
  rowsAffected?: number;
  error?: string;
}

interface DatabaseState {
  tables: string[];
  schema: Record<string, TableSchema>;
  selectedTable: string | null;
  gridRows: Record<string, any>[];
  gridTotalRows: number;
  gridPage: number;
  gridLimit: number;
  gridFilters: Record<string, { type: 'text' | 'number' | 'date'; operator: string; value: string }>;
  gridSort: { column: string; direction: 'ASC' | 'DESC' } | null;
  loadingSchema: boolean;
  loadingData: boolean;
  executingSql: boolean;
  queryHistory: HistoryItem[];

  // Database Schema Isolation States
  schemas: string[];
  activeSchema: string;
  loadingSchemas: boolean;
  
  // Transaction Preview State
  pendingTransactionQuery: string | null;
  pendingTransactionResults: any[] | null;
  pendingTransactionRowsAffected: number | null;

  fetchSchemas: () => Promise<void>;
  createSchema: (schemaName: string) => Promise<boolean>;
  setActiveSchema: (schemaName: string) => void;
  fetchSchema: () => Promise<void>;
  setSelectedTable: (tableName: string | null) => void;
  fetchTableData: (tableName?: string) => Promise<void>;
  updateRow: (tableName: string, primaryKeyValues: Record<string, any>, updatedValues: Record<string, any>) => Promise<boolean>;
  deleteRow: (tableName: string, primaryKeyValues: Record<string, any>) => Promise<boolean>;
  insertRow: (tableName: string, rowValues: Record<string, any>) => Promise<boolean>;
  executeSql: (query: string) => Promise<{ success: boolean; data?: any[]; rowsAffected?: number; error?: string }>;
  setGridPage: (page: number) => void;
  setGridFilters: (filters: Record<string, any>) => void;
  setGridSort: (sort: { column: string; direction: 'ASC' | 'DESC' } | null) => void;
  addHistoryItem: (query: string, success: boolean, rowsAffected?: number, error?: string) => void;
  
  // Transaction Commands
  setPendingTransaction: (query: string | null, results: any[] | null, rowsAffected: number | null) => void;
}


export const useDatabaseStore = create<DatabaseState>((set, get) => ({
  tables: [],
  schema: {},
  selectedTable: null,
  gridRows: [],
  gridTotalRows: 0,
  gridPage: 1,
  gridLimit: 25,
  gridFilters: {},
  gridSort: null,
  loadingSchema: false,
  loadingData: false,
  executingSql: false,
  queryHistory: [],

  // Schema state defaults
  schemas: ['public'],
  activeSchema: 'public',
  loadingSchemas: false,

  pendingTransactionQuery: null,
  pendingTransactionResults: null,
  pendingTransactionRowsAffected: null,

  fetchSchemas: async () => {
    set({ loadingSchemas: true });
    try {
      const res = await get().executeSql(`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'pg_temp_1', 'pg_toast_temp_1', 'auth', 'graphql', 'realtime', 'extensions', 'storage', 'vault')
        ORDER BY schema_name;
      `);
      if (res.success && res.data) {
        const schemaNames = res.data.map((r: any) => r.schema_name);
        set({ schemas: schemaNames, loadingSchemas: false });
      } else {
        set({ schemas: ['public'], loadingSchemas: false });
      }
    } catch {
      set({ schemas: ['public'], loadingSchemas: false });
    }
  },

  createSchema: async (schemaName) => {
    // Validate schema name
    if (!/^[a-zA-Z0-9_]+$/.test(schemaName)) {
      return false;
    }
    const res = await get().executeSql(`CREATE SCHEMA "${schemaName}";`);
    if (res.success) {
      await get().fetchSchemas();
      get().setActiveSchema(schemaName);
      return true;
    }
    return false;
  },

  setActiveSchema: (schemaName) => {
    set({ activeSchema: schemaName, selectedTable: null, gridRows: [], gridTotalRows: 0, gridPage: 1, gridFilters: {}, gridSort: null });
    get().fetchSchema();
  },

  fetchSchema: async () => {
    set({ loadingSchema: true });
    try {
      const currentSchema = get().activeSchema;

      // 1. Fetch tables list in active schema
      const tablesRes = await get().executeSql(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '${currentSchema}' 
          AND table_type = 'BASE TABLE'
          AND table_name NOT IN ('spatial_ref_sys', 'geography_columns', 'geometry_columns')
        ORDER BY table_name;
      `);

      if (!tablesRes.success || !tablesRes.data) {
        set({ tables: [], schema: {}, loadingSchema: false });
        return;
      }

      const tableNames = tablesRes.data.map((r: any) => r.table_name);

      // 2. Fetch all columns details in active schema
      const columnsRes = await get().executeSql(`
        SELECT 
          table_name,
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = '${currentSchema}'
        ORDER BY table_name, ordinal_position;
      `);

      // 3. Fetch primary keys in active schema
      const pkRes = await get().executeSql(`
        SELECT
            tc.table_name,
            kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = '${currentSchema}';
      `);

      // 4. Fetch foreign keys in active schema
      const fkRes = await get().executeSql(`
        SELECT
            kcu.table_name AS foreign_table,
            kcu.column_name AS foreign_column,
            ccu.table_name AS referenced_table,
            ccu.column_name AS referenced_column
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = '${currentSchema}';
      `);


      const columnsMap = (columnsRes.data || []).reduce((acc: any, col: any) => {
        if (!acc[col.table_name]) acc[col.table_name] = [];
        acc[col.table_name].push({
          name: col.column_name,
          type: col.data_type,
          isNullable: col.is_nullable === 'YES',
          defaultValue: col.column_default,
          maxLength: col.character_maximum_length,
        });
        return acc;
      }, {});

      const pkMap = (pkRes.data || []).reduce((acc: any, pk: any) => {
        if (!acc[pk.table_name]) acc[pk.table_name] = [];
        acc[pk.table_name].push(pk.column_name);
        return acc;
      }, {});

      const fkMap = (fkRes.data || []).reduce((acc: any, fk: any) => {
        if (!acc[fk.foreign_table]) acc[fk.foreign_table] = [];
        acc[fk.foreign_table].push({
          columnName: fk.foreign_column,
          referencedTable: fk.referenced_table,
          referencedColumn: fk.referenced_column,
        });
        return acc;
      }, {});

      const schemaObj: Record<string, TableSchema> = {};
      for (const t of tableNames) {
        schemaObj[t] = {
          name: t,
          columns: columnsMap[t] || [],
          primaryKeys: pkMap[t] || [],
          foreignKeys: fkMap[t] || [],
        };
      }

      set({ tables: tableNames, schema: schemaObj, loadingSchema: false });
    } catch (e: any) {
      console.error('Error fetching schema:', e);
      set({ loadingSchema: false });
    }
  },

  setSelectedTable: (tableName) => {
    set({
      selectedTable: tableName,
      gridPage: 1,
      gridFilters: {},
      gridSort: null,
      gridRows: [],
      gridTotalRows: 0,
    });
    if (tableName) {
      get().fetchTableData(tableName);
    }
  },

  fetchTableData: async (tableName) => {
    const activeTable = tableName || get().selectedTable;
    if (!activeTable) return;

    set({ loadingData: true });
    try {
      const { gridPage, gridLimit, gridFilters, gridSort } = get();
      
      // Build filters clauses
      const filterClauses: string[] = [];
      for (const [col, f] of Object.entries(gridFilters)) {
        if (!f.value) continue;
        if (f.type === 'text') {
          if (f.operator === 'contains') {
            filterClauses.push(`"${col}"::text ILIKE '%${f.value}%'`);
          } else if (f.operator === 'equals') {
            filterClauses.push(`"${col}"::text = '${f.value}'`);
          }
        } else if (f.type === 'number') {
          if (f.operator === 'equals') {
            filterClauses.push(`"${col}" = ${f.value}`);
          } else if (f.operator === 'gt') {
            filterClauses.push(`"${col}" > ${f.value}`);
          } else if (f.operator === 'lt') {
            filterClauses.push(`"${col}" < ${f.value}`);
          }
        } else if (f.type === 'date') {
          if (f.operator === 'equals') {
            filterClauses.push(`"${col}"::date = '${f.value}'::date`);
          } else if (f.operator === 'after') {
            filterClauses.push(`"${col}" >= '${f.value}'::timestamp`);
          } else if (f.operator === 'before') {
            filterClauses.push(`"${col}" <= '${f.value}'::timestamp`);
          }
        }
      }

      const whereStr = filterClauses.length > 0 ? `WHERE ${filterClauses.join(' AND ')}` : '';
      
      // Build sorting clause
      let orderStr = '';
      if (gridSort) {
        orderStr = `ORDER BY "${gridSort.column}" ${gridSort.direction}`;
      } else {
        const pk = get().schema[activeTable]?.primaryKeys[0];
        if (pk) {
          orderStr = `ORDER BY "${pk}" ASC`;
        }
      }

      const offset = (gridPage - 1) * gridLimit;

      const dataQuery = `SELECT * FROM "${activeTable}" ${whereStr} ${orderStr} LIMIT ${gridLimit} OFFSET ${offset};`;
      const countQuery = `SELECT COUNT(*) as total FROM "${activeTable}" ${whereStr};`;

      const [dataRes, countRes] = await Promise.all([
        get().executeSql(dataQuery),
        get().executeSql(countQuery)
      ]);

      if (dataRes.success && dataRes.data) {
        const totalCount = countRes.success && countRes.data && countRes.data[0]
          ? parseInt(countRes.data[0].total)
          : dataRes.data.length;
        set({ gridRows: dataRes.data, gridTotalRows: totalCount, loadingData: false });
      } else {
        set({ gridRows: [], gridTotalRows: 0, loadingData: false });
      }
    } catch (e) {
      console.error('Error fetching table data:', e);
      set({ loadingData: false });
    }
  },

  updateRow: async (tableName, primaryKeyValues, updatedValues) => {
    if (Object.keys(updatedValues).length === 0) return true;
    
    // Build set clauses
    const setParts = Object.entries(updatedValues).map(([col, val]) => {
      if (val === null) return `"${col}" = NULL`;
      if (typeof val === 'number' || typeof val === 'boolean') return `"${col}" = ${val}`;
      return `"${col}" = '${String(val).replace(/'/g, "''")}'`;
    });

    // Build where clauses
    const whereParts = Object.entries(primaryKeyValues).map(([col, val]) => {
      if (typeof val === 'number') return `"${col}" = ${val}`;
      return `"${col}" = '${String(val).replace(/'/g, "''")}'`;
    });

    if (whereParts.length === 0) {
      console.error('Cannot update row without primary key values');
      return false;
    }

    const query = `UPDATE "${tableName}" SET ${setParts.join(', ')} WHERE ${whereParts.join(' AND ')};`;
    const res = await get().executeSql(query);
    
    if (res.success) {
      await get().fetchTableData();
      return true;
    }
    return false;
  },

  deleteRow: async (tableName, primaryKeyValues) => {
    const whereParts = Object.entries(primaryKeyValues).map(([col, val]) => {
      if (typeof val === 'number') return `"${col}" = ${val}`;
      return `"${col}" = '${String(val).replace(/'/g, "''")}'`;
    });

    if (whereParts.length === 0) {
      console.error('Cannot delete row without primary key values');
      return false;
    }

    const query = `DELETE FROM "${tableName}" WHERE ${whereParts.join(' AND ')};`;
    const res = await get().executeSql(query);

    if (res.success) {
      await get().fetchTableData();
      return true;
    }
    return false;
  },

  insertRow: async (tableName, rowValues) => {
    const cols = Object.keys(rowValues);
    const vals = Object.values(rowValues).map((val) => {
      if (val === null || val === undefined || val === '') return 'NULL';
      if (typeof val === 'number' || typeof val === 'boolean') return `${val}`;
      return `'${String(val).replace(/'/g, "''")}'`;
    });

    const query = `INSERT INTO "${tableName}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${vals.join(', ')});`;
    const res = await get().executeSql(query);

    if (res.success) {
      await get().fetchTableData();
      return true;
    }
    return false;
  },

  executeSql: async (query) => {
    set({ executingSql: true });
    try {
      const { data, error } = await supabase.rpc('exec_sql', { 
        query_text: query,
        active_schema: get().activeSchema
      });


      if (error) {
        get().addHistoryItem(query, false, undefined, error.message);
        set({ executingSql: false });
        return { success: false, error: error.message };
      }

      const res = data as any;
      if (res.error) {
        get().addHistoryItem(query, false, undefined, res.error);
        set({ executingSql: false });
        return { success: false, error: res.error };
      }

      get().addHistoryItem(query, true, res.rows_affected);
      set({ executingSql: false });
      return { success: true, data: res.data, rowsAffected: res.rows_affected };
    } catch (e: any) {
      get().addHistoryItem(query, false, undefined, e.message || String(e));
      set({ executingSql: false });
      return { success: false, error: e.message || String(e) };
    }
  },

  setGridPage: (page) => {
    set({ gridPage: page });
    get().fetchTableData();
  },

  setGridFilters: (filters) => {
    set({ gridFilters: filters, gridPage: 1 });
    get().fetchTableData();
  },

  setGridSort: (sort) => {
    set({ gridSort: sort, gridPage: 1 });
    get().fetchTableData();
  },

  addHistoryItem: (query, success, rowsAffected, error) => {
    const item: HistoryItem = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      query,
      success,
      rowsAffected,
      error,
    };
    set((state) => ({
      queryHistory: [item, ...state.queryHistory].slice(0, 100), // Keep last 100 queries
    }));
  },

  setPendingTransaction: (query, results, rowsAffected) => {
    set({
      pendingTransactionQuery: query,
      pendingTransactionResults: results,
      pendingTransactionRowsAffected: rowsAffected
    });
  }
}));

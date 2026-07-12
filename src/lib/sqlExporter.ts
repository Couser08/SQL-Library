import type { TableSchema } from '../store/useDatabaseStore';


/**
 * Reconstructs the DDL and DML to generate a .sql database dump file.
 */
export async function exportDatabaseToSql(
  tables: string[],
  schema: Record<string, TableSchema>,
  executeSql: (query: string) => Promise<{ success: boolean; data?: any[] }>
): Promise<string> {
  let dump = `-- Database export generated on ${new Date().toISOString()}\n`;
  dump += `-- SQL Database Manager Client Dump\n\n`;
  dump += `SET statement_timeout = 0;\n`;
  dump += `SET client_encoding = 'UTF8';\n\n`;

  for (const tableName of tables) {
    const tbl = schema[tableName];
    if (!tbl) continue;

    dump += `--\n`;
    dump += `-- Table structure for table "${tableName}"\n`;
    dump += `--\n\n`;
    
    // We can generate clean CREATE TABLE commands from our metadata
    const colLines = tbl.columns.map((col) => {
      let line = `  "${col.name}" ${col.type}`;
      if (col.maxLength) {
        line += `(${col.maxLength})`;
      }
      if (!col.isNullable) {
        line += ` NOT NULL`;
      }
      if (col.defaultValue) {
        // Simple clean-up of defaults
        line += ` DEFAULT ${col.defaultValue}`;
      }
      return line;
    });

    // Add Primary Key constraint
    if (tbl.primaryKeys.length > 0) {
      colLines.push(`  PRIMARY KEY (${tbl.primaryKeys.map(k => `"${k}"`).join(', ')})`);
    }

    // Add Foreign Key constraints
    tbl.foreignKeys.forEach((fk, idx) => {
      colLines.push(
        `  CONSTRAINT "fk_${tableName}_ref_${fk.referencedTable}_${idx}" ` +
        `FOREIGN KEY ("${fk.columnName}") REFERENCES "${fk.referencedTable}" ("${fk.referencedColumn}") ON DELETE CASCADE`
      );
    });

    dump += `CREATE TABLE "${tableName}" (\n${colLines.join(',\n')}\n);\n\n`;

    // Fetch data for the table
    dump += `--\n`;
    dump += `-- Data for table "${tableName}"\n`;
    dump += `--\n\n`;

    const dataRes = await executeSql(`SELECT * FROM "${tableName}";`);
    if (dataRes.success && dataRes.data && dataRes.data.length > 0) {
      const cols = Object.keys(dataRes.data[0]);
      const chunks = [];

      for (const row of dataRes.data) {
        const vals = cols.map((c) => {
          const val = row[c];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'number' || typeof val === 'boolean') return `${val}`;
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        chunks.push(`(${vals.join(', ')})`);
      }

      // Output values in batch insert
      dump += `INSERT INTO "${tableName}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES\n`;
      dump += chunks.join(',\n') + ';\n\n';
    } else {
      dump += `-- No rows found for table "${tableName}"\n\n`;
    }

    dump += `\n`;
  }

  return dump;
}

/**
 * Utility to download string content as a file.
 */
export function downloadFile(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  a.click();
  window.URL.revokeObjectURL(url);
}

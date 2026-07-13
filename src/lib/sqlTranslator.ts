/**
 * SQL Parser & Translator Utility
 * Translates MySQL dump files (.sql) into compatible PostgreSQL statements for Supabase,
 * and handles topological sorting based on Foreign Key dependencies.
 */

export interface ParsedTable {
  name: string;
  createQuery: string;
  insertQueries: string[];
  dependencies: string[];
}

export interface TranslationResult {
  tables: ParsedTable[];
  skippedStatements: { query: string; reason: string }[];
  importOrder: string[];
}

/**
 * Splits SQL text into individual statements, ignoring semicolons inside strings or comments.
 */
export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1];

    // Handle block comments
    if (inBlockComment) {
      if (char === '*' && nextChar === '/') {
        inBlockComment = false;
        i++; // skip /
      }
      continue;
    }
    if (!inSingleQuote && !inDoubleQuote && !inBacktick && !inLineComment) {
      if (char === '/' && nextChar === '*') {
        inBlockComment = true;
        i++; // skip *
        continue;
      }
    }

    // Handle line comments
    if (inLineComment) {
      if (char === '\n' || char === '\r') {
        inLineComment = false;
      }
      continue;
    }
    if (!inSingleQuote && !inDoubleQuote && !inBacktick && !inBlockComment) {
      if ((char === '-' && nextChar === '-') || char === '#') {
        inLineComment = true;
        continue;
      }
    }

    // Handle quotes
    if (char === "'" && !inDoubleQuote && !inBacktick) {
      // Check for escape character
      if (i > 0 && sql[i - 1] === '\\') {
        // Escaped quote
      } else {
        inSingleQuote = !inSingleQuote;
      }
    } else if (char === '"' && !inSingleQuote && !inBacktick) {
      if (i > 0 && sql[i - 1] === '\\') {
        // Escaped quote
      } else {
        inDoubleQuote = !inDoubleQuote;
      }
    } else if (char === '`' && !inSingleQuote && !inDoubleQuote) {
      inBacktick = !inBacktick;
    }

    if (char === ';' && !inSingleQuote && !inDoubleQuote && !inBacktick) {
      const stmt = current.trim();
      if (stmt) {
        statements.push(stmt);
      }
      current = '';
    } else {
      current += char;
    }
  }

  const lastStmt = current.trim();
  if (lastStmt) {
    statements.push(lastStmt);
  }

  return statements;
}

/**
 * Extracts the table name from a SQL statement.
 */
function extractTableName(statement: string): string | null {
  const match = statement.match(/(?:CREATE\s+TABLE|INSERT\s+INTO)\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`|")?([a-zA-Z0-9_]+)(?:`|")?/i);
  return match ? match[1] : null;
}

/**
 * Translates a MySQL CREATE TABLE statement to PostgreSQL syntax.
 */
export function translateCreateTable(statement: string): { query: string; name: string; dependencies: string[] } | null {
  const name = extractTableName(statement);
  if (!name) return null;

  // Find inner definitions (inside the outer parenthesis)
  const firstParen = statement.indexOf('(');
  const lastParen = statement.lastIndexOf(')');
  if (firstParen === -1 || lastParen === -1) return null;

  const body = statement.substring(firstParen + 1, lastParen);
  
  // Split columns/constraints by commas, taking quotes into account
  const lines: string[] = [];
  let currentLine = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let depth = 0;

  for (let i = 0; i < body.length; i++) {
    const char = body[i];
    if (char === '(') depth++;
    if (char === ')') depth--;

    if (char === "'" && !inDoubleQuote && !inBacktick) {
      if (i === 0 || body[i - 1] !== '\\') inSingleQuote = !inSingleQuote;
    } else if (char === '"' && !inSingleQuote && !inBacktick) {
      if (i === 0 || body[i - 1] !== '\\') inDoubleQuote = !inDoubleQuote;
    } else if (char === '`' && !inSingleQuote && !inDoubleQuote) {
      inBacktick = !inBacktick;
    }

    if (char === ',' && depth === 0 && !inSingleQuote && !inDoubleQuote && !inBacktick) {
      lines.push(currentLine.trim());
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  const translatedLines: string[] = [];
  const dependencies: string[] = [];

  for (const line of lines) {
    let cleanLine = line;

    // Replace all backticks with double quotes
    cleanLine = cleanLine.replace(/`/g, '"');

    // Skip MySQL key index lines (non-constraint)
    if (/^\s*KEY\s+/i.test(cleanLine) || /^\s*INDEX\s+/i.test(cleanLine)) {
      continue;
    }

    // Handle UNIQUE KEY -> UNIQUE
    if (/^\s*UNIQUE\s+KEY\s+/i.test(cleanLine)) {
      cleanLine = cleanLine.replace(/^\s*UNIQUE\s+KEY\s+("[a-zA-Z0-9_]+")\s*/i, 'UNIQUE ');
    }

    // Remove UNSIGNED keyword (Postgres does not support unsigned types)
    cleanLine = cleanLine.replace(/\bUNSIGNED\b/ig, '');

    // Remove MySQL's ON UPDATE current_timestamp() (Postgres does not support inline ON UPDATE column constraints)
    cleanLine = cleanLine.replace(/\bON\s+UPDATE\s+[a-zA-Z0-9_]+(?:\(\))?\b/ig, '');

    // Replace current_timestamp() with CURRENT_TIMESTAMP (without parentheses for Postgres compatibility)
    cleanLine = cleanLine.replace(/\bcurrent_timestamp\(\)/ig, 'CURRENT_TIMESTAMP');

    // Replace inline enum(...) with text (Postgres doesn't support inline enum definitions in CREATE TABLE)
    cleanLine = cleanLine.replace(/\benum\s*\([^)]+\)/ig, 'text');

    // Map column types
    // Order matters (longer match first or specific replacements)
    cleanLine = cleanLine
      .replace(/\bint\(\d+\)/ig, 'integer')
      .replace(/\bint\b/ig, 'integer')
      .replace(/\btinyint\(1\)/ig, 'boolean')
      .replace(/\btinyint\(\d+\)/ig, 'smallint')
      .replace(/\btinyint\b/ig, 'smallint')
      .replace(/\bsmallint\(\d+\)/ig, 'smallint')
      .replace(/\bmediumint\(\d+\)/ig, 'integer')
      .replace(/\bmediumint\b/ig, 'integer')
      .replace(/\bbigint\(\d+\)/ig, 'bigint')
      .replace(/\bdouble\b/ig, 'double precision')
      .replace(/\bfloat\b/ig, 'real')
      .replace(/\bdatetime\b/ig, 'timestamp')
      .replace(/\blongtext\b/ig, 'text')
      .replace(/\bmediumtext\b/ig, 'text')
      .replace(/\btinytext\b/ig, 'text');

    // Convert boolean defaults (1 -> true, 0 -> false)
    cleanLine = cleanLine.replace(/\bboolean\s+DEFAULT\s+1\b/ig, 'boolean DEFAULT true');
    cleanLine = cleanLine.replace(/\bboolean\s+DEFAULT\s+0\b/ig, 'boolean DEFAULT false');

    // Handle AUTO_INCREMENT -> GENERATED BY DEFAULT AS IDENTITY
    if (/\bauto_increment\b/i.test(cleanLine)) {
      cleanLine = cleanLine.replace(/\bauto_increment\b/i, '');
      // Ensure the column type is changed to integer or bigint
      cleanLine = cleanLine.replace(/\binteger\b/i, 'integer GENERATED BY DEFAULT AS IDENTITY');
      cleanLine = cleanLine.replace(/\bbigint\b/i, 'bigint GENERATED BY DEFAULT AS IDENTITY');
    }

    // Strip COLLATE and CHARACTER SET
    cleanLine = cleanLine.replace(/\bCOLLATE\s+[a-zA-Z0-9_]+\b/ig, '');
    cleanLine = cleanLine.replace(/\bCHARACTER\s+SET\s+[a-zA-Z0-9_]+\b/ig, '');
    cleanLine = cleanLine.replace(/\bDEFAULT\s+CHARSET=[a-zA-Z0-9_]+\b/ig, '');

    // Extract dependencies from FOREIGN KEY constraints
    // e.g. CONSTRAINT "fk_1" FOREIGN KEY ("user_id") REFERENCES "users" ("id")
    const fkMatch = cleanLine.match(/FOREIGN\s+KEY\s*\([^)]+\)\s*REFERENCES\s*"([a-zA-Z0-9_]+)"\s*\([^)]+\)/i);
    if (fkMatch) {
      const refTable = fkMatch[1];
      if (refTable !== name && !dependencies.includes(refTable)) {
        dependencies.push(refTable);
      }
    }

    // Clean up double spaces
    cleanLine = cleanLine.replace(/\s+/g, ' ').trim();
    if (cleanLine) {
      translatedLines.push(cleanLine);
    }
  }

  // Construct PostgreSQL Create Table statement
  const pgQuery = `CREATE TABLE "${name}" (\n  ${translatedLines.join(',\n  ')}\n);`;

  return { query: pgQuery, name, dependencies };
}

/**
 * Translates a MySQL INSERT INTO statement to PostgreSQL syntax.
 */
export function translateInsert(statement: string): string {
  // Replace backticks with double quotes
  let pgQuery = statement.replace(/`/g, '"');
  
  // Convert MySQL escapes (\' to '')
  pgQuery = pgQuery.replace(/\\'/g, "''");
  
  // Convert zero dates to NULL or epoch
  pgQuery = pgQuery.replace(/'0000-00-00 00:00:00'/g, 'NULL');
  pgQuery = pgQuery.replace(/'0000-00-00'/g, 'NULL');

  return pgQuery;
}

/**
 * Performs a topological sort on a dependency graph of tables.
 * Returns table names in safe insertion order (parents first).
 */
export function sortTablesTopologically(tables: string[], dependencies: Record<string, string[]>): string[] {
  const result: string[] = [];
  const visited: Record<string, boolean> = {};
  const temp: Record<string, boolean> = {};

  function visit(node: string) {
    if (temp[node]) {
      // Cycle detected, but we skip it to prevent crashing. Let the user's database handle it.
      return;
    }
    if (visited[node]) return;

    temp[node] = true;

    const deps = dependencies[node] || [];
    for (const dep of deps) {
      if (tables.includes(dep)) {
        visit(dep);
      }
    }

    temp[node] = false;
    visited[node] = true;
    result.push(node);
  }

  for (const table of tables) {
    if (!visited[table]) {
      visit(table);
    }
  }

  return result;
}

/**
 * Parses and processes a full SQL file.
 */
export function translateSqlFile(sqlContent: string): TranslationResult {
  const rawStatements = splitSqlStatements(sqlContent);
  const tablesMap: Record<string, ParsedTable> = {};
  const skippedStatements: { query: string; reason: string }[] = [];

  for (const raw of rawStatements) {
    const cleanRaw = raw.trim();
    if (!cleanRaw) continue;

    const isCreate = /^\s*CREATE\s+TABLE/i.test(cleanRaw);
    const isInsert = /^\s*INSERT\s+INTO/i.test(cleanRaw);

    if (isCreate) {
      const translated = translateCreateTable(cleanRaw);
      if (translated) {
        if (tablesMap[translated.name]) {
          tablesMap[translated.name].createQuery = translated.query;
          tablesMap[translated.name].dependencies = Array.from(new Set([
            ...tablesMap[translated.name].dependencies,
            ...translated.dependencies
          ]));
        } else {
          tablesMap[translated.name] = {
            name: translated.name,
            createQuery: translated.query,
            insertQueries: [],
            dependencies: translated.dependencies
          };
        }
      } else {
        skippedStatements.push({ query: cleanRaw.substring(0, 100) + '...', reason: 'Failed to parse CREATE TABLE statement structure.' });
      }
    } else if (isInsert) {
      const tableName = extractTableName(cleanRaw);
      if (tableName) {
        const translated = translateInsert(cleanRaw);
        if (tablesMap[tableName]) {
          tablesMap[tableName].insertQueries.push(translated);
        } else {
          tablesMap[tableName] = {
            name: tableName,
            createQuery: '',
            insertQueries: [translated],
            dependencies: []
          };
        }
      } else {
        skippedStatements.push({ query: cleanRaw.substring(0, 100) + '...', reason: 'Failed to extract table name from INSERT statement.' });
      }
    } else {
      // Check why it was skipped
      const firstWord = cleanRaw.split(/\s+/)[0]?.toUpperCase() || 'UNKNOWN';
      skippedStatements.push({
        query: cleanRaw.substring(0, 80) + (cleanRaw.length > 80 ? '...' : ''),
        reason: `Statement type '${firstWord}' is not CREATE TABLE or INSERT INTO.`
      });
    }
  }

  const tableList = Object.keys(tablesMap);
  const dependenciesMap: Record<string, string[]> = {};
  for (const t of tableList) {
    dependenciesMap[t] = tablesMap[t].dependencies;
  }

  const importOrder = sortTablesTopologically(tableList, dependenciesMap);

  return {
    tables: Object.values(tablesMap),
    skippedStatements,
    importOrder
  };
}

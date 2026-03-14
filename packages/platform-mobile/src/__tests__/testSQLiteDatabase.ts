type SQLiteBindValue = string | number | null;

interface TableStore {
  rows: Map<string, Record<string, SQLiteBindValue>>;
}

function unquoteIdentifier(value: string): string {
  return value.trim().replace(/^"/, '').replace(/"$/, '');
}

function compareValues(a: SQLiteBindValue, b: SQLiteBindValue): number {
  if (a === b) {
    return 0;
  }

  if (a === null) {
    return 1;
  }

  if (b === null) {
    return -1;
  }

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  return String(a).localeCompare(String(b));
}

export class InMemorySQLiteDatabase {
  private readonly tables = new Map<string, TableStore>();

  async execAsync(sql: string): Promise<void> {
    const statements = sql
      .split(';')
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0);

    for (const statement of statements) {
      if (statement === 'BEGIN' || statement === 'COMMIT' || statement === 'ROLLBACK') {
        continue;
      }

      const createTableMatch = /^CREATE TABLE IF NOT EXISTS "([^"]+)"/i.exec(statement);
      if (createTableMatch) {
        const tableName = createTableMatch[1];
        this.ensureTable(tableName);
        continue;
      }

      if (/^CREATE INDEX IF NOT EXISTS/i.test(statement)) {
        continue;
      }

      throw new Error(`Unsupported execAsync SQL in test database: ${statement}`);
    }
  }

  async runAsync(sql: string, ...params: SQLiteBindValue[]): Promise<void> {
    const statement = sql.trim();

    const insertMatch =
      /^INSERT INTO "([^"]+)" \(([^)]+)\) VALUES \(([^)]+)\)(?: ON CONFLICT\(id\) DO UPDATE SET (.+))?$/i.exec(
        statement,
      );

    if (insertMatch) {
      const [, tableName, columnList, , onConflictClause] = insertMatch;
      const columns = columnList.split(',').map((column) => unquoteIdentifier(column));

      if (columns.length !== params.length) {
        throw new Error(`Insert parameters did not match columns for ${tableName}`);
      }

      const row: Record<string, SQLiteBindValue> = {};
      columns.forEach((column, index) => {
        row[column] = params[index] ?? null;
      });

      const rowId = row.id;
      if (typeof rowId !== 'string') {
        throw new Error(`Row id must be a string for table ${tableName}`);
      }

      const table = this.ensureTable(tableName);
      const existing = table.rows.get(rowId);

      if (existing && !onConflictClause) {
        throw new Error(`UNIQUE constraint failed: ${tableName}.id`);
      }

      table.rows.set(rowId, { ...(existing ?? {}), ...row });
      return;
    }

    const deleteSingleMatch = /^DELETE FROM "([^"]+)" WHERE "id" = \?$/i.exec(statement);
    if (deleteSingleMatch) {
      const [, tableName] = deleteSingleMatch;
      const rowId = params[0];
      if (typeof rowId === 'string') {
        this.ensureTable(tableName).rows.delete(rowId);
      }
      return;
    }

    const deleteManyMatch = /^DELETE FROM "([^"]+)" WHERE "id" IN \(([^)]+)\)$/i.exec(statement);
    if (deleteManyMatch) {
      const [, tableName] = deleteManyMatch;
      const table = this.ensureTable(tableName);

      for (const rowId of params) {
        if (typeof rowId === 'string') {
          table.rows.delete(rowId);
        }
      }

      return;
    }

    throw new Error(`Unsupported runAsync SQL in test database: ${statement}`);
  }

  async getAllAsync<TRow>(sql: string, ...params: SQLiteBindValue[]): Promise<TRow[]> {
    const statement = sql.trim();

    const countMatch = /^SELECT COUNT\(\*\) as count FROM "([^"]+)"$/i.exec(statement);
    if (countMatch) {
      const [, tableName] = countMatch;
      const count = this.ensureTable(tableName).rows.size;
      return [{ count } as TRow];
    }

    const selectMatch =
      /^SELECT "data" FROM "([^"]+)"(?: WHERE "([^"]+)" = \?)?(?: ORDER BY "([^"]+)" (ASC|DESC))?(?: LIMIT 1)?$/i.exec(
        statement,
      );

    if (selectMatch) {
      const [, tableName, whereColumn, orderByColumn, orderDirection] = selectMatch;
      const hasLimitOne = /LIMIT 1$/i.test(statement);
      const table = this.ensureTable(tableName);
      let rows = Array.from(table.rows.values());

      if (whereColumn) {
        const expectedValue = params[0] ?? null;
        rows = rows.filter((row) => row[whereColumn] === expectedValue);
      }

      if (orderByColumn) {
        rows.sort((a, b) => {
          const result = compareValues(a[orderByColumn] ?? null, b[orderByColumn] ?? null);
          return orderDirection === 'DESC' ? -result : result;
        });
      }

      if (hasLimitOne) {
        rows = rows.slice(0, 1);
      }

      return rows.map((row) => ({ data: String(row.data ?? '{}') } as TRow));
    }

    throw new Error(`Unsupported getAllAsync SQL in test database: ${statement}`);
  }

  async getFirstAsync<TRow>(sql: string, ...params: SQLiteBindValue[]): Promise<TRow | null> {
    const rows = await this.getAllAsync<TRow>(sql, ...params);
    return rows[0] ?? null;
  }

  async closeAsync(): Promise<void> {
    this.tables.clear();
  }

  private ensureTable(tableName: string): TableStore {
    let table = this.tables.get(tableName);

    if (!table) {
      table = { rows: new Map() };
      this.tables.set(tableName, table);
    }

    return table;
  }
}

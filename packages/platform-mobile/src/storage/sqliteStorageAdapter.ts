import type {
  Exercise,
  ExerciseEntry,
  StorageAdapter,
  StorageOrderDirection,
  StorageTable,
  SyncQueueItem,
  SyncState,
  UserSettings,
} from '@lift-tracker/shared';

type SQLiteBindValue = string | number | null;

interface SQLiteDatabaseLike {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: SQLiteBindValue[]): Promise<unknown>;
  getAllAsync<TRow>(sql: string, ...params: SQLiteBindValue[]): Promise<TRow[]>;
  getFirstAsync<TRow>(sql: string, ...params: SQLiteBindValue[]): Promise<TRow | null>;
  closeAsync?(): Promise<void>;
}

interface DataRow {
  data: string;
}

interface CountRow {
  count: number | string;
}

interface TableSchema<TRecord extends { id: string }> {
  tableName: string;
  keyToColumn: Partial<Record<keyof TRecord, string>> & Record<string, string>;
  booleanKeys: ReadonlySet<string>;
  jsonKeys: ReadonlySet<string>;
}

const EXERCISES_SCHEMA: TableSchema<Exercise> = {
  tableName: 'exercises',
  keyToColumn: {
    id: 'id',
    name: 'name',
    category: 'category',
    isCustom: 'isCustom',
    userId: 'userId',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt',
  },
  booleanKeys: new Set(['isCustom']),
  jsonKeys: new Set(),
};

const ENTRIES_SCHEMA: TableSchema<ExerciseEntry> = {
  tableName: 'entries',
  keyToColumn: {
    id: 'id',
    exerciseId: 'exerciseId',
    sets: 'sets',
    notes: 'notes',
    performedAt: 'performedAt',
    estimated1RM_kg: 'estimated1RM_kg',
    userId: 'userId',
    updatedAt: 'updatedAt',
    deletedAt: 'deletedAt',
  },
  booleanKeys: new Set(),
  jsonKeys: new Set(['sets']),
};

const SETTINGS_SCHEMA: TableSchema<UserSettings> = {
  tableName: 'settings',
  keyToColumn: {
    id: 'id',
    primaryUnit: 'primaryUnit',
    ageBracket: 'ageBracket',
    barbellWeightKg: 'barbellWeightKg',
    hasCompletedOnboarding: 'hasCompletedOnboarding',
    userId: 'userId',
    updatedAt: 'updatedAt',
  },
  booleanKeys: new Set(['hasCompletedOnboarding']),
  jsonKeys: new Set(),
};

const SYNC_QUEUE_SCHEMA: TableSchema<SyncQueueItem> = {
  tableName: 'syncQueue',
  keyToColumn: {
    id: 'id',
    table: 'tableName',
    recordId: 'recordId',
    op: 'op',
    payload: 'payload',
    updatedAt: 'updatedAt',
  },
  booleanKeys: new Set(),
  jsonKeys: new Set(['payload']),
};

const SYNC_STATE_SCHEMA: TableSchema<SyncState> = {
  tableName: 'syncState',
  keyToColumn: {
    id: 'id',
    lastSyncedAt: 'lastSyncedAt',
    userId: 'userId',
    migrationComplete: 'migrationComplete',
  },
  booleanKeys: new Set(['migrationComplete']),
  jsonKeys: new Set(),
};

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function encodeColumnValue(schema: TableSchema<{ id: string }>, key: string, value: unknown): SQLiteBindValue {
  if (value === undefined) {
    return null;
  }

  if (schema.booleanKeys.has(key)) {
    if (value === null) {
      return null;
    }

    return value ? 1 : 0;
  }

  if (schema.jsonKeys.has(key)) {
    return JSON.stringify(value);
  }

  if (typeof value === 'string' || typeof value === 'number' || value === null) {
    return value;
  }

  return JSON.stringify(value);
}

function buildRow<TRecord extends { id: string }>(
  schema: TableSchema<TRecord>,
  record: TRecord,
): Record<string, SQLiteBindValue> {
  const rawRecord = record as Record<string, unknown>;
  const row: Record<string, SQLiteBindValue> = {
    id: record.id,
    data: JSON.stringify(record),
  };

  for (const [key, column] of Object.entries(schema.keyToColumn)) {
    if (key === 'id') {
      continue;
    }

    row[column] = encodeColumnValue(schema as TableSchema<{ id: string }>, key, rawRecord[key]);
  }

  return row;
}

function decodeRecord<TRecord extends { id: string }>(row: DataRow): TRecord {
  return JSON.parse(row.data) as TRecord;
}

function compareValues(a: unknown, b: unknown): number {
  if (a === b) {
    return 0;
  }

  if (a === null || a === undefined) {
    return 1;
  }

  if (b === null || b === undefined) {
    return -1;
  }

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  return String(a).localeCompare(String(b));
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }

  if (a === null || a === undefined || b === null || b === undefined) {
    return false;
  }

  if (typeof a === 'object' || typeof b === 'object') {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  return false;
}

async function openExpoSqliteDatabase(databaseName: string): Promise<SQLiteDatabaseLike> {
  const sqliteModule = await import('expo-sqlite');
  return sqliteModule.openDatabaseAsync(databaseName) as unknown as SQLiteDatabaseLike;
}

async function initializeSchema(database: SQLiteDatabaseLike): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS "exercises" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "name" TEXT,
      "category" TEXT,
      "isCustom" INTEGER,
      "userId" TEXT,
      "updatedAt" TEXT,
      "deletedAt" TEXT,
      "data" TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "entries" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "exerciseId" TEXT,
      "sets" TEXT,
      "notes" TEXT,
      "performedAt" TEXT,
      "estimated1RM_kg" REAL,
      "userId" TEXT,
      "updatedAt" TEXT,
      "deletedAt" TEXT,
      "data" TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "settings" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "primaryUnit" TEXT,
      "ageBracket" TEXT,
      "barbellWeightKg" REAL,
      "hasCompletedOnboarding" INTEGER,
      "userId" TEXT,
      "updatedAt" TEXT,
      "data" TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "syncQueue" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "tableName" TEXT,
      "recordId" TEXT,
      "op" TEXT,
      "payload" TEXT,
      "updatedAt" TEXT,
      "data" TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "syncState" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "lastSyncedAt" TEXT,
      "userId" TEXT,
      "migrationComplete" INTEGER,
      "data" TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "idx_entries_exerciseId" ON "entries" ("exerciseId");
    CREATE INDEX IF NOT EXISTS "idx_syncQueue_updatedAt" ON "syncQueue" ("updatedAt");
  `);
}

async function upsertRecord<TRecord extends { id: string }>(
  database: SQLiteDatabaseLike,
  schema: TableSchema<TRecord>,
  record: TRecord,
): Promise<void> {
  const row = buildRow(schema, record);
  const columns = Object.keys(row);
  const quotedColumns = columns.map(quoteIdentifier).join(', ');
  const placeholders = columns.map(() => '?').join(', ');
  const values = columns.map((column) => row[column]);
  const assignments = columns
    .filter((column) => column !== 'id')
    .map((column) => `${quoteIdentifier(column)} = excluded.${quoteIdentifier(column)}`)
    .join(', ');

  const sql = `INSERT INTO ${quoteIdentifier(schema.tableName)} (${quotedColumns}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${assignments}`;
  await database.runAsync(sql, ...values);
}

async function addRecord<TRecord extends { id: string }>(
  database: SQLiteDatabaseLike,
  schema: TableSchema<TRecord>,
  record: TRecord,
): Promise<void> {
  const row = buildRow(schema, record);
  const columns = Object.keys(row);
  const quotedColumns = columns.map(quoteIdentifier).join(', ');
  const placeholders = columns.map(() => '?').join(', ');
  const values = columns.map((column) => row[column]);
  const sql = `INSERT INTO ${quoteIdentifier(schema.tableName)} (${quotedColumns}) VALUES (${placeholders})`;

  await database.runAsync(sql, ...values);
}

async function getAllRecords<TRecord extends { id: string }>(
  database: SQLiteDatabaseLike,
  schema: TableSchema<TRecord>,
): Promise<TRecord[]> {
  const rows = await database.getAllAsync<DataRow>(
    `SELECT "data" FROM ${quoteIdentifier(schema.tableName)}`,
  );
  return rows.map(decodeRecord<TRecord>);
}

async function getOrderedRecords<TRecord extends { id: string }>(
  database: SQLiteDatabaseLike,
  schema: TableSchema<TRecord>,
  key: string,
  direction: StorageOrderDirection,
): Promise<TRecord[]> {
  const column = schema.keyToColumn[key];

  if (!column) {
    const records = await getAllRecords(database, schema);
    const directionFactor = direction === 'desc' ? -1 : 1;

    records.sort((a, b) => {
      const aValue = (a as Record<string, unknown>)[key];
      const bValue = (b as Record<string, unknown>)[key];
      return compareValues(aValue, bValue) * directionFactor;
    });

    return records;
  }

  const rows = await database.getAllAsync<DataRow>(
    `SELECT "data" FROM ${quoteIdentifier(schema.tableName)} ORDER BY ${quoteIdentifier(column)} ${direction === 'desc' ? 'DESC' : 'ASC'}`,
  );

  return rows.map(decodeRecord<TRecord>);
}

function createStorageTableAdapter<TRecord extends { id: string }>(
  schema: TableSchema<TRecord>,
  withDatabase: <TValue>(operation: (database: SQLiteDatabaseLike) => Promise<TValue>) => Promise<TValue>,
): StorageTable<TRecord> {
  return {
    get: (id) =>
      withDatabase(async (database) => {
        const row = await database.getFirstAsync<DataRow>(
          `SELECT "data" FROM ${quoteIdentifier(schema.tableName)} WHERE "id" = ? LIMIT 1`,
          id,
        );

        return row ? decodeRecord<TRecord>(row) : undefined;
      }),

    put: (record) =>
      withDatabase(async (database) => {
        await upsertRecord(database, schema, record);
      }),

    add: (record) =>
      withDatabase(async (database) => {
        await addRecord(database, schema, record);
      }),

    delete: (id) =>
      withDatabase(async (database) => {
        await database.runAsync(
          `DELETE FROM ${quoteIdentifier(schema.tableName)} WHERE "id" = ?`,
          id,
        );
      }),

    toArray: () =>
      withDatabase(async (database) => {
        return getAllRecords(database, schema);
      }),

    count: () =>
      withDatabase(async (database) => {
        const row = await database.getFirstAsync<CountRow>(
          `SELECT COUNT(*) as count FROM ${quoteIdentifier(schema.tableName)}`,
        );

        return Number(row?.count ?? 0);
      }),

    bulkPut: (records) =>
      withDatabase(async (database) => {
        if (records.length === 0) {
          return;
        }

        await database.execAsync('BEGIN');

        try {
          for (const record of records) {
            await upsertRecord(database, schema, record);
          }

          await database.execAsync('COMMIT');
        } catch (error) {
          await database.execAsync('ROLLBACK');
          throw error;
        }
      }),

    bulkDelete: (ids) =>
      withDatabase(async (database) => {
        if (ids.length === 0) {
          return;
        }

        const placeholders = ids.map(() => '?').join(', ');
        await database.runAsync(
          `DELETE FROM ${quoteIdentifier(schema.tableName)} WHERE "id" IN (${placeholders})`,
          ...ids,
        );
      }),

    whereEqualsMany: (key, value) =>
      withDatabase(async (database) => {
        const keyName = String(key);
        const column = schema.keyToColumn[keyName];

        if (!column) {
          const records = await getAllRecords(database, schema);
          return records.filter((record) => valuesEqual((record as Record<string, unknown>)[keyName], value));
        }

        const encodedValue = encodeColumnValue(
          schema as TableSchema<{ id: string }>,
          keyName,
          value,
        );

        const rows = await database.getAllAsync<DataRow>(
          `SELECT "data" FROM ${quoteIdentifier(schema.tableName)} WHERE ${quoteIdentifier(column)} = ?`,
          encodedValue,
        );

        return rows.map(decodeRecord<TRecord>);
      }),

    whereEqualsFirst: (key, value) =>
      withDatabase(async (database) => {
        const keyName = String(key);
        const column = schema.keyToColumn[keyName];

        if (!column) {
          const records = await getAllRecords(database, schema);
          return records.find((record) => valuesEqual((record as Record<string, unknown>)[keyName], value));
        }

        const encodedValue = encodeColumnValue(
          schema as TableSchema<{ id: string }>,
          keyName,
          value,
        );

        const row = await database.getFirstAsync<DataRow>(
          `SELECT "data" FROM ${quoteIdentifier(schema.tableName)} WHERE ${quoteIdentifier(column)} = ? LIMIT 1`,
          encodedValue,
        );

        return row ? decodeRecord<TRecord>(row) : undefined;
      }),

    orderBy: (key, direction = 'asc') =>
      withDatabase(async (database) => {
        return getOrderedRecords(database, schema, String(key), direction);
      }),
  };
}

export interface SqliteStorageAdapter extends StorageAdapter {
  close(): Promise<void>;
}

export interface SqliteStorageAdapterOptions {
  databaseName?: string;
  openDatabase?: (databaseName: string) => Promise<SQLiteDatabaseLike>;
}

export function createSqliteStorageAdapter(
  options: SqliteStorageAdapterOptions = {},
): SqliteStorageAdapter {
  const databaseName = options.databaseName ?? 'LiftTrackerMobileDB';
  const openDatabase = options.openDatabase ?? openExpoSqliteDatabase;
  const databasePromise = (async () => {
    const database = await openDatabase(databaseName);
    await initializeSchema(database);
    return database;
  })();

  const withDatabase = async <TValue>(
    operation: (database: SQLiteDatabaseLike) => Promise<TValue>,
  ): Promise<TValue> => {
    const database = await databasePromise;
    return operation(database);
  };

  return {
    exercises: createStorageTableAdapter(EXERCISES_SCHEMA, withDatabase),
    entries: createStorageTableAdapter(ENTRIES_SCHEMA, withDatabase),
    settings: createStorageTableAdapter(SETTINGS_SCHEMA, withDatabase),
    syncQueue: createStorageTableAdapter(SYNC_QUEUE_SCHEMA, withDatabase),
    syncState: createStorageTableAdapter(SYNC_STATE_SCHEMA, withDatabase),
    close: async () => {
      const database = await databasePromise;
      await database.closeAsync?.();
    },
  };
}

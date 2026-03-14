import Dexie, {
  type Collection,
  type IndexableType,
  type Table,
} from 'dexie';
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

function toDexieCollection<TRecord>(
  table: Table<TRecord, string>,
  key: keyof TRecord,
): Collection<TRecord, string, TRecord> {
  return table.orderBy(String(key));
}

function createStorageTableAdapter<TRecord extends { id: string }>(
  table: Table<TRecord, string>,
): StorageTable<TRecord> {
  return {
    get: (id) => table.get(id),
    put: async (record) => {
      await table.put(record);
    },
    add: async (record) => {
      await table.add(record);
    },
    delete: async (id) => {
      await table.delete(id);
    },
    toArray: () => table.toArray(),
    count: () => table.count(),
    bulkPut: async (records) => {
      if (records.length === 0) {
        return;
      }

      await table.bulkPut(records);
    },
    bulkDelete: async (ids) => {
      if (ids.length === 0) {
        return;
      }

      await table.bulkDelete(ids);
    },
    whereEqualsMany: (key, value) =>
      table
        .where(String(key))
        .equals(value as IndexableType)
        .toArray(),
    whereEqualsFirst: (key, value) =>
      table
        .where(String(key))
        .equals(value as IndexableType)
        .first(),
    orderBy: (key, direction: StorageOrderDirection = 'asc') => {
      const collection = toDexieCollection(table, key);
      return direction === 'desc' ? collection.reverse().toArray() : collection.toArray();
    },
  };
}

export class LiftTrackerDexieDatabase extends Dexie {
  exercises!: Table<Exercise, string>;
  entries!: Table<ExerciseEntry, string>;
  settings!: Table<UserSettings, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  syncState!: Table<SyncState, string>;

  constructor(databaseName = 'LiftTrackerDB') {
    super(databaseName);
    this.version(1).stores({
      exercises: 'id, name, category, isCustom',
      entries: 'id, exerciseId, performedAt',
      settings: 'id',
    });

    this.version(2)
      .stores({
        exercises: 'id, name, category, isCustom, userId, updatedAt',
        entries: 'id, exerciseId, performedAt, userId, updatedAt',
        settings: 'id, userId',
        syncQueue: 'id, table, recordId, updatedAt',
        syncState: 'id',
      })
      .upgrade((tx) => {
        const now = new Date().toISOString();

        return Promise.all([
          tx
            .table('exercises')
            .toCollection()
            .modify((item) => {
              item.updatedAt = item.updatedAt ?? now;
              item.userId = item.userId ?? null;
              item.deletedAt = item.deletedAt ?? null;
            }),
          tx
            .table('entries')
            .toCollection()
            .modify((item) => {
              item.updatedAt = item.updatedAt ?? now;
              item.userId = item.userId ?? null;
              item.deletedAt = item.deletedAt ?? null;
            }),
          tx
            .table('settings')
            .toCollection()
            .modify((item) => {
              item.updatedAt = item.updatedAt ?? now;
              item.userId = item.userId ?? null;
            }),
        ]);
      });
  }
}

export interface DexieStorageAdapter extends StorageAdapter {
  close(): void;
  deleteDatabase(): Promise<void>;
}

export interface DexieStorageAdapterOptions {
  databaseName?: string;
}

export function createDexieStorageAdapter(
  options: DexieStorageAdapterOptions = {},
): DexieStorageAdapter {
  const database = new LiftTrackerDexieDatabase(options.databaseName);

  return {
    exercises: createStorageTableAdapter(database.exercises),
    entries: createStorageTableAdapter(database.entries),
    settings: createStorageTableAdapter(database.settings),
    syncQueue: createStorageTableAdapter(database.syncQueue),
    syncState: createStorageTableAdapter(database.syncState),
    close: () => {
      database.close();
    },
    deleteDatabase: async () => {
      database.close();
      await database.delete();
    },
  };
}

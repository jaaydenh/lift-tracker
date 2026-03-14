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

function createMemoryTable<TRecord extends { id: string }>(): StorageTable<TRecord> {
  const records = new Map<string, TRecord>();

  return {
    get: async (id) => records.get(id),

    put: async (record) => {
      records.set(record.id, record);
    },

    add: async (record) => {
      if (records.has(record.id)) {
        throw new Error(`Record with id "${record.id}" already exists.`);
      }

      records.set(record.id, record);
    },

    delete: async (id) => {
      records.delete(id);
    },

    toArray: async () => {
      return [...records.values()];
    },

    count: async () => records.size,

    bulkPut: async (nextRecords) => {
      for (const record of nextRecords) {
        records.set(record.id, record);
      }
    },

    bulkDelete: async (ids) => {
      for (const id of ids) {
        records.delete(id);
      }
    },

    whereEqualsMany: async (key, value) => {
      return [...records.values()].filter((record) => valuesEqual(record[key], value));
    },

    whereEqualsFirst: async (key, value) => {
      return [...records.values()].find((record) => valuesEqual(record[key], value));
    },

    orderBy: async (key, direction: StorageOrderDirection = 'asc') => {
      const directionFactor = direction === 'desc' ? -1 : 1;
      const sorted = [...records.values()];
      sorted.sort((a, b) => compareValues(a[key], b[key]) * directionFactor);
      return sorted;
    },
  };
}

export function createInMemoryStorageAdapter(): StorageAdapter {
  return {
    exercises: createMemoryTable<Exercise>(),
    entries: createMemoryTable<ExerciseEntry>(),
    settings: createMemoryTable<UserSettings>(),
    syncQueue: createMemoryTable<SyncQueueItem>(),
    syncState: createMemoryTable<SyncState>(),
  };
}

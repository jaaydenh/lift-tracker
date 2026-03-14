import { describe, expect, it } from 'vitest';
import { runStorageAdapterContractSuite } from '@lift-tracker/shared/adapters/testing';
import { createSqliteStorageAdapter } from '../storage/sqliteStorageAdapter';
import { InMemorySQLiteDatabase } from './testSQLiteDatabase';

function createTestStorageAdapter() {
  return createSqliteStorageAdapter({
    databaseName: 'LiftTrackerMobile_TestDB',
    openDatabase: async () => new InMemorySQLiteDatabase(),
  });
}

runStorageAdapterContractSuite('platform-mobile: SQLite storage adapter', {
  createStorageAdapter: createTestStorageAdapter,
  cleanupStorageAdapter: async (storageAdapter) => {
    await (storageAdapter as ReturnType<typeof createSqliteStorageAdapter>).close();
  },
});

describe('platform-mobile: SQLite storage adapter JSON handling', () => {
  it('round-trips entry sets and sync queue payload values', async () => {
    const storage = createTestStorageAdapter();

    const entry = {
      id: 'entry-json',
      exerciseId: 'exercise-json',
      sets: [
        {
          id: 'set-1',
          weightKg: 100,
          reps: 5,
          isWarmup: false,
          completedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      notes: 'Felt strong',
      performedAt: '2026-01-01',
      estimated1RM_kg: 110,
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const queueItem = {
      id: 'queue-json',
      table: 'entries' as const,
      recordId: entry.id,
      op: 'upsert' as const,
      payload: { nested: { value: 123 }, list: [1, 2, 3] },
      updatedAt: '2026-01-02T00:00:00.000Z',
    };

    await storage.entries.put(entry);
    await storage.syncQueue.put(queueItem);

    await expect(storage.entries.get(entry.id)).resolves.toEqual(entry);
    await expect(storage.syncQueue.get(queueItem.id)).resolves.toEqual(queueItem);

    await storage.close();
  });

  it('supports equality and ordering semantics expected by shared sync code', async () => {
    const storage = createTestStorageAdapter();

    await storage.entries.bulkPut([
      {
        id: 'entry-1',
        exerciseId: 'exercise-a',
        sets: [],
        performedAt: '2026-01-01',
        estimated1RM_kg: 90,
      },
      {
        id: 'entry-2',
        exerciseId: 'exercise-b',
        sets: [],
        performedAt: '2026-01-03',
        estimated1RM_kg: 100,
      },
      {
        id: 'entry-3',
        exerciseId: 'exercise-a',
        sets: [],
        performedAt: '2026-01-02',
        estimated1RM_kg: 95,
      },
    ]);

    const exerciseAEntries = await storage.entries.whereEqualsMany('exerciseId', 'exercise-a');
    const firstExerciseAEntry = await storage.entries.whereEqualsFirst('exerciseId', 'exercise-a');
    const orderedDesc = await storage.entries.orderBy('performedAt', 'desc');

    expect(exerciseAEntries.map((entry) => entry.id).sort()).toEqual(['entry-1', 'entry-3']);
    expect(firstExerciseAEntry?.exerciseId).toBe('exercise-a');
    expect(orderedDesc.map((entry) => entry.id)).toEqual(['entry-2', 'entry-3', 'entry-1']);

    await storage.close();
  });
});

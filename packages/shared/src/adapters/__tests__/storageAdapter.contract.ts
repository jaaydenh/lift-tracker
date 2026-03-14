import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type {
  Exercise,
  ExerciseEntry,
  StorageAdapter,
  UserSettings,
} from '../../index';

interface StorageContractOptions {
  createStorageAdapter: () => StorageAdapter;
  cleanupStorageAdapter?: (storageAdapter: StorageAdapter) => Promise<void> | void;
}

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'exercise-1',
    name: 'Back Squat',
    category: 'barbell',
    isCustom: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeEntry(overrides: Partial<ExerciseEntry> = {}): ExerciseEntry {
  return {
    id: 'entry-1',
    exerciseId: 'exercise-1',
    sets: [],
    performedAt: '2026-01-01',
    estimated1RM_kg: null,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeSettings(overrides: Partial<UserSettings> = {}): UserSettings {
  return {
    id: 'user',
    primaryUnit: 'kg',
    ageBracket: 'young',
    barbellWeightKg: 20,
    hasCompletedOnboarding: false,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function runStorageAdapterContractSuite(
  suiteName: string,
  options: StorageContractOptions,
): void {
  describe(suiteName, () => {
    let storage: StorageAdapter;

    beforeEach(() => {
      storage = options.createStorageAdapter();
    });


    afterEach(async () => {
      await options.cleanupStorageAdapter?.(storage);
    });
    it('persists records with put then reads them with get', async () => {
      const exercise = makeExercise();

      await storage.exercises.put(exercise);

      await expect(storage.exercises.get(exercise.id)).resolves.toEqual(exercise);
    });


    it('supports add for new records', async () => {
      const exercise = makeExercise({ id: 'exercise-add' });

      await storage.exercises.add(exercise);

      await expect(storage.exercises.get('exercise-add')).resolves.toEqual(exercise);
    });
    it('overwrites existing records with put', async () => {
      await storage.exercises.put(makeExercise({ id: 'exercise-overwrite', name: 'Old Name' }));
      await storage.exercises.put(makeExercise({ id: 'exercise-overwrite', name: 'New Name' }));

      await expect(storage.exercises.get('exercise-overwrite')).resolves.toEqual(
        makeExercise({ id: 'exercise-overwrite', name: 'New Name' }),
      );
    });

    it('returns all records from toArray', async () => {
      await storage.settings.put(makeSettings({ id: 'settings-a' }));
      await storage.settings.put(makeSettings({ id: 'settings-b' }));

      const settings = await storage.settings.toArray();
      expect(settings).toHaveLength(2);
      expect(settings.map((setting) => setting.id).sort()).toEqual(['settings-a', 'settings-b']);
    });

    it('supports bulkPut and bulkDelete', async () => {
      await storage.entries.bulkPut([
        makeEntry({ id: 'entry-a' }),
        makeEntry({ id: 'entry-b' }),
        makeEntry({ id: 'entry-c' }),
      ]);

      await storage.entries.bulkDelete(['entry-a', 'entry-c']);

      await expect(storage.entries.toArray()).resolves.toEqual([makeEntry({ id: 'entry-b' })]);
    });

    it('supports indexed equality reads for many and first', async () => {
      await storage.entries.bulkPut([
        makeEntry({ id: 'entry-1', exerciseId: 'exercise-a' }),
        makeEntry({ id: 'entry-2', exerciseId: 'exercise-a' }),
        makeEntry({ id: 'entry-3', exerciseId: 'exercise-b' }),
      ]);

      const many = await storage.entries.whereEqualsMany('exerciseId', 'exercise-a');
      const first = await storage.entries.whereEqualsFirst('exerciseId', 'exercise-a');

      expect(many.map((entry) => entry.id).sort()).toEqual(['entry-1', 'entry-2']);
      expect(first?.exerciseId).toBe('exercise-a');
    });

    it('reads queue items ordered by updatedAt', async () => {
      await storage.syncQueue.bulkPut([
        {
          id: 'queue-1',
          table: 'entries',
          op: 'upsert',
          recordId: 'entry-1',
          payload: {},
          updatedAt: '2026-01-03T00:00:00.000Z',
        },
        {
          id: 'queue-2',
          table: 'entries',
          op: 'upsert',
          recordId: 'entry-2',
          payload: {},
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'queue-3',
          table: 'entries',
          op: 'upsert',
          recordId: 'entry-3',
          payload: {},
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ]);

      const queueItems = await storage.syncQueue.orderBy('updatedAt');

      expect(queueItems.map((item) => item.id)).toEqual(['queue-2', 'queue-3', 'queue-1']);
    });
  });
}

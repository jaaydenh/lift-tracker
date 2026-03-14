import { create } from 'zustand';
import type { Exercise, ExerciseEntry } from '@lift-tracker/shared';
import { getStorageAdapter } from '../lib/adapterRuntime';
import { enqueueSync } from '../sync/queue';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

function sortByPerformedAtDesc(a: ExerciseEntry, b: ExerciseEntry): number {
  return new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime();
}

interface ExerciseStore {
  entries: ExerciseEntry[];
  exercises: Exercise[];
  isLoaded: boolean;
  loadData: () => Promise<void>;
  addEntry: (entry: ExerciseEntry) => Promise<void>;
  updateEntry: (entry: ExerciseEntry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  addCustomExercise: (exercise: Exercise) => Promise<void>;
  getEntriesForExercise: (exerciseId: string) => ExerciseEntry[];
  getLatestEntry: (exerciseId: string) => ExerciseEntry | null;
  getDaysSinceLastEntry: (exerciseId: string) => number | null;
  getRecentExerciseIds: (limit?: number) => string[];
}

export const useExerciseStore = create<ExerciseStore>((set, get) => ({
  entries: [],
  exercises: [],
  isLoaded: false,

  loadData: async () => {
    const storage = getStorageAdapter();
    const [entries, exercises] = await Promise.all([
      storage.entries.toArray(),
      storage.exercises.toArray(),
    ]);

    set({ entries, exercises, isLoaded: true });
  },

  addEntry: async (entry) => {
    const storage = getStorageAdapter();
    const now = new Date().toISOString();
    const nextEntry: ExerciseEntry = {
      ...entry,
      updatedAt: now,
    };

    set((state) => ({ entries: [nextEntry, ...state.entries] }));
    await storage.entries.put(nextEntry);
    await enqueueSync('entries', 'upsert', nextEntry.id, nextEntry, storage);
  },

  updateEntry: async (entry) => {
    const storage = getStorageAdapter();
    const now = new Date().toISOString();
    const nextEntry: ExerciseEntry = {
      ...entry,
      updatedAt: now,
    };

    set((state) => ({
      entries: state.entries.map((existingEntry) =>
        existingEntry.id === nextEntry.id ? nextEntry : existingEntry,
      ),
    }));
    await storage.entries.put(nextEntry);
    await enqueueSync('entries', 'upsert', nextEntry.id, nextEntry, storage);
  },

  deleteEntry: async (id) => {
    const storage = getStorageAdapter();
    set((state) => ({ entries: state.entries.filter((entry) => entry.id !== id) }));
    await storage.entries.delete(id);
    await enqueueSync('entries', 'delete', id, { id }, storage);
  },

  addCustomExercise: async (exercise) => {
    const storage = getStorageAdapter();
    const now = new Date().toISOString();
    const nextExercise: Exercise = {
      ...exercise,
      updatedAt: now,
    };

    set((state) => ({ exercises: [...state.exercises, nextExercise] }));
    await storage.exercises.put(nextExercise);
    await enqueueSync('exercises', 'upsert', nextExercise.id, nextExercise, storage);
  },

  getEntriesForExercise: (exerciseId) => {
    return get()
      .entries
      .filter((entry) => entry.exerciseId === exerciseId)
      .sort(sortByPerformedAtDesc);
  },

  getLatestEntry: (exerciseId) => {
    return get().getEntriesForExercise(exerciseId)[0] ?? null;
  },

  getDaysSinceLastEntry: (exerciseId) => {
    const latestEntry = get().getLatestEntry(exerciseId);

    if (!latestEntry) {
      return null;
    }

    const daysSince = Math.floor((Date.now() - new Date(latestEntry.performedAt).getTime()) / DAY_IN_MS);
    return Math.max(0, daysSince);
  },

  getRecentExerciseIds: (limit = 5) => {
    const uniqueIds = new Set<string>();
    const recentIds: string[] = [];
    const sortedEntries = [...get().entries].sort(sortByPerformedAtDesc);

    for (const entry of sortedEntries) {
      if (uniqueIds.has(entry.exerciseId)) {
        continue;
      }

      uniqueIds.add(entry.exerciseId);
      recentIds.push(entry.exerciseId);

      if (recentIds.length >= limit) {
        break;
      }
    }

    return recentIds;
  },
}));

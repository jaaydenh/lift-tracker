import { create } from 'zustand';
import { db } from '../db/database';
import type { Exercise, ExerciseEntry } from '../shared/models/types';

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
    const [entries, exercises] = await Promise.all([
      db.entries.toArray(),
      db.exercises.toArray(),
    ]);

    set({ entries, exercises, isLoaded: true });
  },

  addEntry: async (entry) => {
    set((state) => ({ entries: [entry, ...state.entries] }));
    await db.entries.put(entry);
  },

  updateEntry: async (entry) => {
    set((state) => ({
      entries: state.entries.map((existingEntry) =>
        existingEntry.id === entry.id ? entry : existingEntry,
      ),
    }));
    await db.entries.put(entry);
  },

  deleteEntry: async (id) => {
    set((state) => ({ entries: state.entries.filter((entry) => entry.id !== id) }));
    await db.entries.delete(id);
  },

  addCustomExercise: async (exercise) => {
    set((state) => ({ exercises: [...state.exercises, exercise] }));
    await db.exercises.put(exercise);
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

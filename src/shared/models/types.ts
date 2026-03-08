export type ExerciseCategory = 'barbell' | 'dumbbell' | 'bodyweight' | 'machine' | 'cable' | 'other';
export type AgeBracket = 'young' | 'middle' | 'older';
export type DetrainingPhase = 'fresh' | 'maintain' | 'declining' | 'decaying';
export type WeightUnit = 'kg' | 'lbs';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  isCustom: boolean;
  userId?: string | null;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface ExerciseSet {
  id: string;
  weightKg: number | null;   // null for bodyweight
  reps: number;
  isWarmup: boolean;
  completedAt: string;        // ISO timestamp
}

export interface ExerciseEntry {
  id: string;
  exerciseId: string;
  sets: ExerciseSet[];
  notes?: string;
  performedAt: string;        // ISO date
  estimated1RM_kg: number | null;
  userId?: string | null;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface UserSettings {
  id: string;  // singleton 'user'
  primaryUnit: WeightUnit;
  ageBracket: AgeBracket;
  barbellWeightKg: number;
  hasCompletedOnboarding: boolean;
  userId?: string | null;
  updatedAt?: string;
}

export interface SyncQueueItem {
  id: string;
  table: 'entries' | 'exercises' | 'settings';
  recordId: string;
  op: 'upsert' | 'delete';
  payload: unknown;
  updatedAt: string;
}

export interface SyncState {
  id: string; // singleton 'sync'
  lastSyncedAt: string | null;
  userId: string | null;
  migrationComplete: boolean;
}

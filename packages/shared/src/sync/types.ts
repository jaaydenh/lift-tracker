import type { Exercise, ExerciseEntry, UserSettings } from '../models/types';

export type SyncTableName = 'entries' | 'exercises' | 'settings';

export interface SyncLocalRecordMap {
  entries: ExerciseEntry;
  exercises: Exercise;
  settings: UserSettings;
}

export const SYNC_TABLES: SyncTableName[] = ['entries', 'exercises', 'settings'];

const LOCAL_TO_REMOTE: Record<SyncTableName, Record<string, string>> = {
  entries: {
    id: 'id',
    exerciseId: 'exercise_id',
    sets: 'sets',
    notes: 'notes',
    performedAt: 'performed_at',
    estimated1RM_kg: 'estimated_1rm_kg',
    userId: 'user_id',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  },
  exercises: {
    id: 'id',
    name: 'name',
    category: 'category',
    isCustom: 'is_custom',
    userId: 'user_id',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  },
  settings: {
    id: 'id',
    primaryUnit: 'primary_unit',
    ageBracket: 'age_bracket',
    barbellWeightKg: 'barbell_weight_kg',
    hasCompletedOnboarding: 'has_completed_onboarding',
    userId: 'user_id',
    updatedAt: 'updated_at',
  },
};

function invertMapping(mapping: Record<string, string>): Record<string, string> {
  const inverted: Record<string, string> = {};

  for (const [localKey, remoteKey] of Object.entries(mapping)) {
    inverted[remoteKey] = localKey;
  }

  return inverted;
}

const REMOTE_TO_LOCAL: Record<SyncTableName, Record<string, string>> = {
  entries: invertMapping(LOCAL_TO_REMOTE.entries),
  exercises: invertMapping(LOCAL_TO_REMOTE.exercises),
  settings: invertMapping(LOCAL_TO_REMOTE.settings),
};

function coerceNumeric(value: unknown): unknown {
  if (value === null || typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }

  return value;
}

export function toRemoteRecord(
  table: SyncTableName,
  local: Record<string, unknown>,
): Record<string, unknown> {
  const mapping = LOCAL_TO_REMOTE[table];
  const remote: Record<string, unknown> = {};

  for (const [localKey, remoteKey] of Object.entries(mapping)) {
    if (!(localKey in local)) {
      continue;
    }

    const value = local[localKey];
    if (value !== undefined) {
      remote[remoteKey] = value;
    }
  }

  return remote;
}

export function toLocalRecord(
  table: SyncTableName,
  remote: Record<string, unknown>,
): Record<string, unknown> {
  const mapping = REMOTE_TO_LOCAL[table];
  const local: Record<string, unknown> = {};

  for (const [remoteKey, localKey] of Object.entries(mapping)) {
    if (!(remoteKey in remote)) {
      continue;
    }

    const value = remote[remoteKey];
    if (value !== undefined) {
      local[localKey] = value;
    }
  }

  if (table === 'entries' && 'estimated1RM_kg' in local) {
    local.estimated1RM_kg = coerceNumeric(local.estimated1RM_kg);
  }

  if (table === 'settings' && 'barbellWeightKg' in local) {
    local.barbellWeightKg = coerceNumeric(local.barbellWeightKg);
  }

  return local;
}

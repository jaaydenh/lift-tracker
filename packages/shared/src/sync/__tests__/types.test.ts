import { describe, expect, it } from 'vitest';
import { SYNC_TABLES, toLocalRecord, toRemoteRecord } from '../types';

describe('sync/types', () => {
  it('exposes supported sync table names', () => {
    expect(SYNC_TABLES).toEqual(['entries', 'exercises', 'settings']);
    expect(new Set(SYNC_TABLES).size).toBe(SYNC_TABLES.length);
  });

  describe('toRemoteRecord', () => {
    it('maps entry records from local camelCase keys to remote snake_case keys', () => {
      const localRecord = {
        id: 'entry-1',
        exerciseId: 'builtin-back-squat',
        sets: [{ reps: 5, weightKg: 100 }],
        notes: undefined,
        performedAt: '2026-01-01',
        estimated1RM_kg: 116.67,
        userId: 'user-1',
        updatedAt: '2026-01-01T00:00:00.000Z',
        deletedAt: null,
        ignoredKey: 'ignore-me',
      };

      expect(toRemoteRecord('entries', localRecord)).toEqual({
        id: 'entry-1',
        exercise_id: 'builtin-back-squat',
        sets: [{ reps: 5, weightKg: 100 }],
        performed_at: '2026-01-01',
        estimated_1rm_kg: 116.67,
        user_id: 'user-1',
        updated_at: '2026-01-01T00:00:00.000Z',
        deleted_at: null,
      });
    });

    it('maps settings records to remote keys and omits undefined values', () => {
      const localRecord = {
        id: 'user',
        primaryUnit: 'kg',
        ageBracket: 'middle',
        barbellWeightKg: undefined,
        hasCompletedOnboarding: true,
        userId: 'user-1',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };

      expect(toRemoteRecord('settings', localRecord)).toEqual({
        id: 'user',
        primary_unit: 'kg',
        age_bracket: 'middle',
        has_completed_onboarding: true,
        user_id: 'user-1',
        updated_at: '2026-01-01T00:00:00.000Z',
      });
    });
  });

  describe('toLocalRecord', () => {
    it('maps entry records from remote snake_case keys to local camelCase keys', () => {
      const remoteRecord = {
        id: 'entry-1',
        exercise_id: 'builtin-back-squat',
        sets: [{ reps: 5, weightKg: 100 }],
        notes: 'Top set felt great',
        performed_at: '2026-01-01',
        estimated_1rm_kg: 116.67,
        user_id: 'user-1',
        updated_at: '2026-01-01T00:00:00.000Z',
        deleted_at: null,
        ignored_key: 'ignore-me',
      };

      expect(toLocalRecord('entries', remoteRecord)).toEqual({
        id: 'entry-1',
        exerciseId: 'builtin-back-squat',
        sets: [{ reps: 5, weightKg: 100 }],
        notes: 'Top set felt great',
        performedAt: '2026-01-01',
        estimated1RM_kg: 116.67,
        userId: 'user-1',
        updatedAt: '2026-01-01T00:00:00.000Z',
        deletedAt: null,
      });
    });

    it('coerces numeric strings for entry estimated 1RM and settings barbell weight', () => {
      const localEntry = toLocalRecord('entries', {
        estimated_1rm_kg: '152.5',
      });

      const localSettings = toLocalRecord('settings', {
        barbell_weight_kg: '20',
      });

      expect(localEntry).toEqual({ estimated1RM_kg: 152.5 });
      expect(localSettings).toEqual({ barbellWeightKg: 20 });
    });

    it('keeps non-numeric strings unchanged when coercion fails', () => {
      const localEntry = toLocalRecord('entries', {
        estimated_1rm_kg: 'not-a-number',
      });

      const localSettings = toLocalRecord('settings', {
        barbell_weight_kg: 'not-a-number',
      });

      expect(localEntry).toEqual({ estimated1RM_kg: 'not-a-number' });
      expect(localSettings).toEqual({ barbellWeightKg: 'not-a-number' });
    });
  });
});

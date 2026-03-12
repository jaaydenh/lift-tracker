import { describe, expect, it } from 'vitest';
import type { ExerciseSet } from '../../models/types';
import {
  best1RMFromSets,
  best1RMFromSetsDetailed,
  estimate1RM,
  percentageTable,
} from '../oneRepMax';

let setCounter = 0;

function makeSet(overrides: Partial<ExerciseSet> = {}): ExerciseSet {
  setCounter += 1;
  return {
    id: `set-${setCounter}`,
    weightKg: 100,
    reps: 5,
    isWarmup: false,
    completedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('oneRepMax', () => {
  describe('estimate1RM', () => {
    it('returns null when reps are outside the supported range', () => {
      expect(estimate1RM(100, 0)).toBeNull();
      expect(estimate1RM(100, 16)).toBeNull();
    });

    it('returns the original weight for a single rep', () => {
      expect(estimate1RM(137.5, 1)).toBe(137.5);
    });

    it('averages Epley, Brzycki, and Lander estimates and rounds to 2 decimals', () => {
      expect(estimate1RM(100, 5)).toBe(114.29);
    });
  });

  describe('percentageTable', () => {
    it('builds rows from 100% down to 50% in 5% steps', () => {
      const table = percentageTable(200);

      expect(table).toHaveLength(11);
      expect(table.map((row) => row.percent)).toEqual([100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50]);
      expect(table[0]).toEqual({ percent: 100, kg: 200, lbs: 440.92 });
      expect(table[5]).toEqual({ percent: 75, kg: 150, lbs: 330.69 });
      expect(table.at(-1)).toEqual({ percent: 50, kg: 100, lbs: 220.46 });
    });
  });

  describe('best1RMFromSets', () => {
    it('returns null for an empty set list', () => {
      expect(best1RMFromSets([])).toBeNull();
    });

    it('returns null when all sets are warmups or lack usable weight data', () => {
      const sets = [
        makeSet({ isWarmup: true, weightKg: 60, reps: 8 }),
        makeSet({ weightKg: null, reps: 12 }),
        makeSet({ weightKg: 100, reps: 16 }),
      ];

      expect(best1RMFromSets(sets)).toBeNull();
    });

    it('finds the highest estimated 1RM while skipping warmups/null/invalid sets', () => {
      const sets = [
        makeSet({ isWarmup: true, weightKg: 60, reps: 8 }),
        makeSet({ weightKg: null, reps: 10 }),
        makeSet({ weightKg: 110, reps: 1 }),
        makeSet({ weightKg: 90, reps: 10 }),
        makeSet({ weightKg: 95, reps: 16 }),
      ];

      expect(best1RMFromSets(sets)).toBe(120.22);
    });
  });

  describe('best1RMFromSetsDetailed', () => {
    it('returns null when no set can produce a valid estimate', () => {
      const sets = [
        makeSet({ isWarmup: true, weightKg: 60, reps: 8 }),
        makeSet({ weightKg: null, reps: 10 }),
        makeSet({ weightKg: 95, reps: 16 }),
      ];

      expect(best1RMFromSetsDetailed(sets)).toBeNull();
    });

    it('returns the best estimate plus source set reps and weight', () => {
      const sets = [
        makeSet({ weightKg: 110, reps: 1 }),
        makeSet({ weightKg: 90, reps: 10 }),
        makeSet({ isWarmup: true, weightKg: 120, reps: 3 }),
      ];

      expect(best1RMFromSetsDetailed(sets)).toEqual({
        value: 120.22,
        sourceReps: 10,
        sourceWeightKg: 90,
      });
    });
  });
});

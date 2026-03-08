import type { ExerciseSet } from '../models/types';
import { kgToLbs } from './units';

function epley(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

function brzycki(weight: number, reps: number): number {
  return weight * (36 / (37 - reps));
}

function lander(weight: number, reps: number): number {
  return weight * (100 / (101.3 - 2.67123 * reps));
}

/**
 * Estimate 1RM from weight and reps using the average of Epley, Brzycki, and Lander formulas.
 * Returns null for reps > 15 or reps < 1. For a single rep, returns the weight directly.
 */
export function estimate1RM(weightKg: number, reps: number): number | null {
  if (reps < 1 || reps > 15) return null;
  if (reps === 1) return weightKg;
  const avg = (epley(weightKg, reps) + brzycki(weightKg, reps) + lander(weightKg, reps)) / 3;
  return Math.round(avg * 100) / 100;
}

/**
 * Generate a percentage table from 100% down to 50% in 5% increments.
 */
export function percentageTable(oneRM: number): { percent: number; kg: number; lbs: number }[] {
  const table: { percent: number; kg: number; lbs: number }[] = [];
  for (let pct = 100; pct >= 50; pct -= 5) {
    const kg = Math.round((oneRM * pct / 100) * 100) / 100;
    table.push({ percent: pct, kg, lbs: Math.round(kgToLbs(kg) * 100) / 100 });
  }
  return table;
}

/**
 * Find the highest estimated 1RM from a list of sets.
 * Skips warmup sets and sets with null weight.
 */
export function best1RMFromSets(sets: ExerciseSet[]): number | null {
  let best: number | null = null;
  for (const set of sets) {
    if (set.isWarmup || set.weightKg === null) continue;
    const est = estimate1RM(set.weightKg, set.reps);
    if (est !== null && (best === null || est > best)) {
      best = est;
    }
  }
  return best;
}

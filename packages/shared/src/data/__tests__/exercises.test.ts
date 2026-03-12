import { describe, expect, it } from 'vitest';
import type { ExerciseCategory } from '../../models/types';
import { BUILT_IN_EXERCISES } from '../exercises';

const VALID_CATEGORIES = new Set<ExerciseCategory>([
  'barbell',
  'dumbbell',
  'bodyweight',
  'machine',
  'cable',
  'other',
]);

const REQUIRED_EXERCISE_NAMES = ['Back Squat', 'Bench Press', 'Deadlift'];

describe('BUILT_IN_EXERCISES', () => {
  it('is non-empty', () => {
    expect(BUILT_IN_EXERCISES.length).toBeGreaterThan(0);
  });

  it('has unique ids', () => {
    const ids = BUILT_IN_EXERCISES.map((exercise) => exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has non-empty names', () => {
    const invalidNames = BUILT_IN_EXERCISES.filter((exercise) => exercise.name.trim().length === 0);
    expect(invalidNames).toEqual([]);
  });

  it('only uses valid exercise categories', () => {
    const invalidCategories = BUILT_IN_EXERCISES.filter(
      (exercise) => !VALID_CATEGORIES.has(exercise.category),
    );

    expect(invalidCategories).toEqual([]);
  });

  it('marks every built-in exercise as non-custom', () => {
    expect(BUILT_IN_EXERCISES.every((exercise) => exercise.isCustom === false)).toBe(true);
  });

  it('uses the builtin-* id naming convention', () => {
    const invalidIds = BUILT_IN_EXERCISES.map((exercise) => exercise.id).filter(
      (id) => !id.startsWith('builtin-') || id === 'builtin-',
    );

    expect(invalidIds).toEqual([]);
  });

  it('includes key foundational exercises', () => {
    const names = new Set(BUILT_IN_EXERCISES.map((exercise) => exercise.name));

    for (const exerciseName of REQUIRED_EXERCISE_NAMES) {
      expect(names.has(exerciseName)).toBe(true);
    }
  });
});

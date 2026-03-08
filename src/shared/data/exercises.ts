import type { Exercise } from '../models/types';

export const BUILT_IN_EXERCISES: Exercise[] = [
  // Barbell
  { id: 'builtin-back-squat',       name: 'Back Squat',           category: 'barbell',    isCustom: false },
  { id: 'builtin-front-squat',      name: 'Front Squat',          category: 'barbell',    isCustom: false },
  { id: 'builtin-bench-press',      name: 'Bench Press',          category: 'barbell',    isCustom: false },
  { id: 'builtin-overhead-press',   name: 'Overhead Press',       category: 'barbell',    isCustom: false },
  { id: 'builtin-deadlift',         name: 'Deadlift',             category: 'barbell',    isCustom: false },
  { id: 'builtin-romanian-deadlift', name: 'Romanian Deadlift',   category: 'barbell',    isCustom: false },
  { id: 'builtin-barbell-row',      name: 'Barbell Row',          category: 'barbell',    isCustom: false },
  { id: 'builtin-clean',            name: 'Clean',                category: 'barbell',    isCustom: false },
  { id: 'builtin-clean-and-jerk',   name: 'Clean & Jerk',         category: 'barbell',    isCustom: false },
  { id: 'builtin-snatch',           name: 'Snatch',               category: 'barbell',    isCustom: false },
  { id: 'builtin-push-press',       name: 'Push Press',           category: 'barbell',    isCustom: false },
  { id: 'builtin-sumo-deadlift',    name: 'Sumo Deadlift',        category: 'barbell',    isCustom: false },

  // Dumbbell
  { id: 'builtin-db-bench-press',     name: 'Dumbbell Bench Press',    category: 'dumbbell',   isCustom: false },
  { id: 'builtin-db-row',             name: 'Dumbbell Row',            category: 'dumbbell',   isCustom: false },
  { id: 'builtin-db-shoulder-press',  name: 'Dumbbell Shoulder Press', category: 'dumbbell',   isCustom: false },
  { id: 'builtin-db-curl',            name: 'Dumbbell Curl',           category: 'dumbbell',   isCustom: false },
  { id: 'builtin-lateral-raise',      name: 'Lateral Raise',           category: 'dumbbell',   isCustom: false },

  // Bodyweight
  { id: 'builtin-pull-up',            name: 'Pull Up',                 category: 'bodyweight', isCustom: false },
  { id: 'builtin-chin-up',            name: 'Chin Up',                 category: 'bodyweight', isCustom: false },
  { id: 'builtin-dip',                name: 'Dip',                     category: 'bodyweight', isCustom: false },
  { id: 'builtin-push-up',            name: 'Push Up',                 category: 'bodyweight', isCustom: false },
  { id: 'builtin-handstand-push-up',  name: 'Handstand Push Up',       category: 'bodyweight', isCustom: false },
  { id: 'builtin-muscle-up',          name: 'Muscle Up',               category: 'bodyweight', isCustom: false },

  // Machine / Cable
  { id: 'builtin-lat-pulldown',       name: 'Lat Pulldown',            category: 'cable',   isCustom: false },
  { id: 'builtin-cable-row',          name: 'Cable Row',               category: 'cable',   isCustom: false },
  { id: 'builtin-leg-press',          name: 'Leg Press',               category: 'machine', isCustom: false },
];

import Dexie, { type Table } from 'dexie';
import type { Exercise, ExerciseEntry, UserSettings } from '../shared/models/types';

export class LiftTrackerDB extends Dexie {
  exercises!: Table<Exercise>;
  entries!: Table<ExerciseEntry>;
  settings!: Table<UserSettings>;

  constructor() {
    super('LiftTrackerDB');
    this.version(1).stores({
      exercises: 'id, name, category, isCustom',
      entries: 'id, exerciseId, performedAt',
      settings: 'id',
    });
  }
}

export const db = new LiftTrackerDB();

import { db } from './database';
import { DEFAULT_SETTINGS } from '../shared/constants';
import { BUILT_IN_EXERCISES } from '../shared/data/exercises';

async function seedExercises(): Promise<void> {
  const count = await db.exercises.count();

  if (count === 0) {
    await db.exercises.bulkAdd(BUILT_IN_EXERCISES);
  }
}

async function seedSettings(): Promise<void> {
  const count = await db.settings.count();

  if (count === 0) {
    await db.settings.put({ ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() });
  }
}

export async function seedDatabase(): Promise<void> {
  await seedExercises();
  await seedSettings();
}

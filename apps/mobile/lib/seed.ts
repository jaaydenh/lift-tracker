import { BUILT_IN_EXERCISES } from '@lift-tracker/shared';
import { getStorageAdapter } from '../lib/adapterRuntime';
import { DEFAULT_SETTINGS } from '../shared/constants';

async function seedExercises(): Promise<void> {
  const storage = getStorageAdapter();
  const count = await storage.exercises.count();

  if (count === 0) {
    await storage.exercises.bulkPut(BUILT_IN_EXERCISES);
  }
}

async function seedSettings(): Promise<void> {
  const storage = getStorageAdapter();
  const count = await storage.settings.count();

  if (count === 0) {
    await storage.settings.put({
      ...DEFAULT_SETTINGS,
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function seedDatabase(): Promise<void> {
  await seedExercises();
  await seedSettings();
}

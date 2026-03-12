import { db } from '../db/database';
import { enqueueSync } from './queue';
import type { SyncState } from '@lift-tracker/shared';

export async function migrateLocalDataToUser(userId: string): Promise<void> {
  const syncState = await db.syncState.get('sync');
  if (syncState?.migrationComplete && syncState?.userId === userId) {
    return;
  }

  const now = new Date().toISOString();

  const exercises = await db.exercises
    .filter((exercise) => !exercise.userId)
    .toArray();
  for (const exercise of exercises) {
    const updated = { ...exercise, userId, updatedAt: now };
    await db.exercises.put(updated);
    await enqueueSync('exercises', 'upsert', exercise.id, updated);
  }

  const entries = await db.entries
    .filter((entry) => !entry.userId)
    .toArray();
  for (const entry of entries) {
    const updated = { ...entry, userId, updatedAt: now };
    await db.entries.put(updated);
    await enqueueSync('entries', 'upsert', entry.id, updated);
  }

  const settings = await db.settings
    .filter((setting) => !setting.userId)
    .toArray();
  for (const setting of settings) {
    const updated = { ...setting, userId, updatedAt: now };
    await db.settings.put(updated);
    await enqueueSync('settings', 'upsert', setting.id, updated);
  }

  const newSyncState: SyncState = {
    id: 'sync',
    lastSyncedAt: null,
    userId,
    migrationComplete: true,
  };
  await db.syncState.put(newSyncState);
}

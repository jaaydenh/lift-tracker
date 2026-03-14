import type { StorageAdapter, SyncState } from '@lift-tracker/shared';
import { getStorageAdapter } from '../lib/adapterRuntime';
import { enqueueSync } from './queue';

export async function migrateLocalDataToUser(
  userId: string,
  storageAdapter: StorageAdapter = getStorageAdapter(),
): Promise<void> {
  const syncState = await storageAdapter.syncState.get('sync');
  if (syncState?.migrationComplete && syncState?.userId === userId) {
    return;
  }

  const now = new Date().toISOString();

  const exercises = (await storageAdapter.exercises.toArray()).filter((exercise) => !exercise.userId);
  for (const exercise of exercises) {
    const updated = { ...exercise, userId, updatedAt: now };
    await storageAdapter.exercises.put(updated);
    await enqueueSync('exercises', 'upsert', exercise.id, updated, storageAdapter);
  }

  const entries = (await storageAdapter.entries.toArray()).filter((entry) => !entry.userId);
  for (const entry of entries) {
    const updated = { ...entry, userId, updatedAt: now };
    await storageAdapter.entries.put(updated);
    await enqueueSync('entries', 'upsert', entry.id, updated, storageAdapter);
  }

  const settings = (await storageAdapter.settings.toArray()).filter((setting) => !setting.userId);
  for (const setting of settings) {
    const updated = { ...setting, userId, updatedAt: now };
    await storageAdapter.settings.put(updated);
    await enqueueSync('settings', 'upsert', setting.id, updated, storageAdapter);
  }

  const newSyncState: SyncState = {
    id: 'sync',
    lastSyncedAt: null,
    userId,
    migrationComplete: true,
  };
  await storageAdapter.syncState.put(newSyncState);
}

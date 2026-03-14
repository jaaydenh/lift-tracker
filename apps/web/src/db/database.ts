import Dexie, { type Table } from 'dexie';
import type { Exercise, ExerciseEntry, UserSettings, SyncQueueItem, SyncState } from '@lift-tracker/shared';

export class LiftTrackerDB extends Dexie {
  exercises!: Table<Exercise>;
  entries!: Table<ExerciseEntry>;
  settings!: Table<UserSettings>;
  syncQueue!: Table<SyncQueueItem>;
  syncState!: Table<SyncState>;

  constructor() {
    super('LiftTrackerDB');
    this.version(1).stores({
      exercises: 'id, name, category, isCustom',
      entries: 'id, exerciseId, performedAt',
      settings: 'id',
    });
    this.version(2)
      .stores({
        exercises: 'id, name, category, isCustom, userId, updatedAt',
        entries: 'id, exerciseId, performedAt, userId, updatedAt',
        settings: 'id, userId',
        syncQueue: 'id, table, recordId, updatedAt',
        syncState: 'id',
      })
      .upgrade((tx) => {
        const now = new Date().toISOString();
        return Promise.all([
          tx
            .table('exercises')
            .toCollection()
            .modify((item) => {
              item.updatedAt = item.updatedAt ?? now;
              item.userId = item.userId ?? null;
              item.deletedAt = item.deletedAt ?? null;
            }),
          tx
            .table('entries')
            .toCollection()
            .modify((item) => {
              item.updatedAt = item.updatedAt ?? now;
              item.userId = item.userId ?? null;
              item.deletedAt = item.deletedAt ?? null;
            }),
          tx
            .table('settings')
            .toCollection()
            .modify((item) => {
              item.updatedAt = item.updatedAt ?? now;
              item.userId = item.userId ?? null;
            }),
        ]);
      });
  }
}

export const db = new LiftTrackerDB();

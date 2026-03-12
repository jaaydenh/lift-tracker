import {
  SYNC_TABLES,
  toLocalRecord,
  type StorageAdapter,
  type StorageTable,
  type SyncLocalRecordMap,
  type SyncState,
  type SyncTableName,
} from '@lift-tracker/shared';
import { supabase } from '../auth/supabaseClient';
import { getStorageAdapter } from '../app/adapterRuntime';

const SYNC_STATE_ID = 'sync';

function toMillis(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function isRemoteNewer(remote: string | null, local: string | null | undefined): boolean {
  return toMillis(remote) > toMillis(local);
}

function maxTimestamp(a: string | null, b: string | null): string | null {
  return toMillis(b) > toMillis(a) ? b : a;
}

function asIsoString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

async function applyRemoteRecord<T extends SyncTableName>(
  table: T,
  localTable: StorageTable<SyncLocalRecordMap[T]>,
  remoteRow: Record<string, unknown>,
): Promise<string | null> {
  const localRecord = toLocalRecord(table, remoteRow) as unknown as SyncLocalRecordMap[T] & {
    id?: unknown;
    updatedAt?: unknown;
    deletedAt?: unknown;
  };

  const recordId = typeof localRecord.id === 'string' ? localRecord.id : null;
  if (!recordId) {
    return null;
  }

  const remoteUpdatedAt = asIsoString(localRecord.updatedAt);
  const remoteDeletedAt = asIsoString(localRecord.deletedAt);

  if (remoteDeletedAt) {
    await localTable.delete(recordId);
    return remoteUpdatedAt;
  }

  const localRecordInDb = await localTable.get(recordId);

  if (!localRecordInDb || isRemoteNewer(remoteUpdatedAt, localRecordInDb.updatedAt)) {
    await localTable.put(localRecord);
  }

  return remoteUpdatedAt;
}

async function fetchRemoteTableRows(
  table: SyncTableName,
  userId: string,
  lastSyncedAt: string | null,
): Promise<Record<string, unknown>[]> {
  let query = supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: true });

  if (lastSyncedAt) {
    query = query.gt('updated_at', lastSyncedAt);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as Record<string, unknown>[];
}

export async function pullRemoteChanges(
  userId: string,
  storageAdapter: StorageAdapter = getStorageAdapter(),
): Promise<void> {
  const currentState: SyncState =
    (await storageAdapter.syncState.get(SYNC_STATE_ID)) ?? {
      id: SYNC_STATE_ID,
      lastSyncedAt: null,
      userId,
      migrationComplete: false,
    };

  const lastSyncedAt = currentState.userId === userId ? currentState.lastSyncedAt : null;
  let newestSyncedAt = lastSyncedAt;

  for (const table of SYNC_TABLES) {
    const remoteRows = await fetchRemoteTableRows(table, userId, lastSyncedAt);

    for (const row of remoteRows) {
      let rowUpdatedAt: string | null;

      switch (table) {
        case 'entries':
          rowUpdatedAt = await applyRemoteRecord('entries', storageAdapter.entries, row);
          break;
        case 'exercises':
          rowUpdatedAt = await applyRemoteRecord('exercises', storageAdapter.exercises, row);
          break;
        case 'settings':
          rowUpdatedAt = await applyRemoteRecord('settings', storageAdapter.settings, row);
          break;
      }

      newestSyncedAt = maxTimestamp(newestSyncedAt, rowUpdatedAt);
    }
  }

  await storageAdapter.syncState.put({
    id: SYNC_STATE_ID,
    lastSyncedAt: newestSyncedAt,
    userId,
    migrationComplete: currentState.migrationComplete,
  });
}

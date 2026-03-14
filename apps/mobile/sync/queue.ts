import { v4 as uuidv4 } from 'uuid';
import type { StorageAdapter, SyncQueueItem, SyncTableName } from '@lift-tracker/shared';
import { getStorageAdapter } from '../lib/adapterRuntime';

export async function enqueueSync(
  table: SyncTableName,
  op: SyncQueueItem['op'],
  recordId: string,
  payload: unknown,
  storageAdapter: StorageAdapter = getStorageAdapter(),
): Promise<void> {
  await storageAdapter.syncQueue.put({
    id: uuidv4(),
    table,
    recordId,
    op,
    payload,
    updatedAt: new Date().toISOString(),
  });
}

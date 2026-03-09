import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database';
import type { SyncQueueItem } from '../shared/models/types';
import type { SyncTableName } from './types';

export async function enqueueSync(
  table: SyncTableName,
  op: SyncQueueItem['op'],
  recordId: string,
  payload: unknown,
): Promise<void> {
  await db.syncQueue.put({
    id: uuidv4(),
    table,
    recordId,
    op,
    payload,
    updatedAt: new Date().toISOString(),
  });
}

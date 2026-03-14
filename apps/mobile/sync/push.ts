import { toRemoteRecord, type StorageAdapter } from '@lift-tracker/shared';
import { supabase } from '../lib/supabaseClient';
import { getStorageAdapter } from '../app/adapterRuntime';

function asRecord(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }

  return {};
}

export async function pushQueue(
  userId: string,
  storageAdapter: StorageAdapter = getStorageAdapter(),
): Promise<void> {
  const queueItems = await storageAdapter.syncQueue.orderBy('updatedAt');

  for (const item of queueItems) {
    try {
      if (item.op === 'upsert') {
        const payloadRecord = asRecord(item.payload);
        const remotePayload = {
          ...toRemoteRecord(item.table, payloadRecord),
          user_id: userId,
        };

        const { error } = await supabase
          .from(item.table)
          .upsert(remotePayload, { onConflict: 'id' });

        if (error) {
          throw error;
        }
      } else if (item.table === 'settings') {
        const { error } = await supabase
          .from(item.table)
          .delete()
          .eq('id', item.recordId)
          .eq('user_id', userId);

        if (error) {
          throw error;
        }
      } else {
        const now = new Date().toISOString();
        const { error } = await supabase
          .from(item.table)
          .update({ deleted_at: now, updated_at: now })
          .eq('id', item.recordId)
          .eq('user_id', userId);

        if (error) {
          throw error;
        }
      }

      await storageAdapter.syncQueue.delete(item.id);
    } catch (error) {
      console.error('[sync/push] Failed queue item', item, error);
    }
  }
}

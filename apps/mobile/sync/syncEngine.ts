import { createSyncEngine } from '@lift-tracker/shared';
import { useAuthStore } from '../auth/useAuthStore';
import { getAppAdapters } from '../lib/adapterRuntime';
import { pullRemoteChanges } from './pull';
import { pushQueue } from './push';

const SYNC_INTERVAL_MS = 30_000;

const syncEngine = createSyncEngine({
  appLifecycle: {
    isVisible: () => getAppAdapters().appLifecycle.isVisible(),
    subscribe: (listener) => getAppAdapters().appLifecycle.subscribe(listener),
  },
  connectivity: {
    isOnline: () => getAppAdapters().connectivity.isOnline(),
    subscribe: (listener) => getAppAdapters().connectivity.subscribe(listener),
  },
  timer: {
    setInterval: (callback, intervalMs) => getAppAdapters().timer.setInterval(callback, intervalMs),
    clearInterval: (intervalId) => getAppAdapters().timer.clearInterval(intervalId),
  },
  getCurrentUserId: () => useAuthStore.getState().session?.user.id,
  push: async (userId) => {
    await pushQueue(userId, getAppAdapters().storage);
  },
  pull: async (userId) => {
    await pullRemoteChanges(userId, getAppAdapters().storage);
  },
  intervalMs: SYNC_INTERVAL_MS,
  onError: (error) => {
    console.error('[sync/engine] Sync run failed', error);
  },
});

export const runSync = syncEngine.runSync;
export const startSyncLoop = syncEngine.startSyncLoop;
export const stopSyncLoop = syncEngine.stopSyncLoop;

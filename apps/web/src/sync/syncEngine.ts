import { useAuthStore } from '../auth/useAuthStore';
import { pullRemoteChanges } from './pull';
import { pushQueue } from './push';

const SYNC_INTERVAL_MS = 30_000;

let syncIntervalId: number | null = null;
let inFlightRun: Promise<void> | null = null;

async function runSyncInternal(): Promise<void> {
  if (!navigator.onLine) {
    return;
  }

  const userId = useAuthStore.getState().session?.user.id;
  if (!userId) {
    return;
  }

  await pushQueue(userId);
  await pullRemoteChanges(userId);
}

export function runSync(): Promise<void> {
  if (inFlightRun) {
    return inFlightRun;
  }

  inFlightRun = runSyncInternal()
    .catch((error) => {
      console.error('[sync/engine] Sync run failed', error);
    })
    .finally(() => {
      inFlightRun = null;
    });

  return inFlightRun;
}

function handleOnline(): void {
  void runSync();
}

function handleVisibilityChange(): void {
  if (document.visibilityState === 'visible') {
    void runSync();
  }
}

export function startSyncLoop(): void {
  if (syncIntervalId !== null) {
    return;
  }

  void runSync();

  syncIntervalId = window.setInterval(() => {
    void runSync();
  }, SYNC_INTERVAL_MS);

  window.addEventListener('online', handleOnline);
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

export function stopSyncLoop(): void {
  if (syncIntervalId !== null) {
    window.clearInterval(syncIntervalId);
    syncIntervalId = null;
  }

  window.removeEventListener('online', handleOnline);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
}

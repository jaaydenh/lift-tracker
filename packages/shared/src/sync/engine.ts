import type {
  AppLifecycleAdapter,
  ConnectivityAdapter,
  TimerAdapter,
} from '../adapters';

const DEFAULT_SYNC_INTERVAL_MS = 30_000;

export interface CreateSyncEngineOptions {
  appLifecycle: AppLifecycleAdapter;
  connectivity: ConnectivityAdapter;
  timer: TimerAdapter;
  getCurrentUserId: () => string | null | undefined;
  push: (userId: string) => Promise<void>;
  pull: (userId: string) => Promise<void>;
  intervalMs?: number;
  onError?: (error: unknown) => void;
}

export interface SyncEngine {
  runSync: () => Promise<void>;
  startSyncLoop: () => void;
  stopSyncLoop: () => void;
}

export function createSyncEngine(options: CreateSyncEngineOptions): SyncEngine {
  const intervalMs = options.intervalMs ?? DEFAULT_SYNC_INTERVAL_MS;

  let intervalId: number | null = null;
  let inFlightRun: Promise<void> | null = null;
  let unsubscribeConnectivity: (() => void) | null = null;
  let unsubscribeLifecycle: (() => void) | null = null;

  async function runSyncInternal(): Promise<void> {
    if (!options.connectivity.isOnline() || !options.appLifecycle.isVisible()) {
      return;
    }

    const userId = options.getCurrentUserId();
    if (!userId) {
      return;
    }

    await options.push(userId);
    await options.pull(userId);
  }

  function runSync(): Promise<void> {
    if (inFlightRun) {
      return inFlightRun;
    }

    inFlightRun = runSyncInternal()
      .catch((error) => {
        options.onError?.(error);
      })
      .finally(() => {
        inFlightRun = null;
      });

    return inFlightRun;
  }

  function handleConnectivityChange(): void {
    if (options.connectivity.isOnline()) {
      void runSync();
    }
  }

  function handleLifecycleChange(): void {
    if (options.appLifecycle.isVisible()) {
      void runSync();
    }
  }

  function startSyncLoop(): void {
    if (intervalId !== null) {
      return;
    }

    void runSync();

    intervalId = options.timer.setInterval(() => {
      void runSync();
    }, intervalMs);

    unsubscribeConnectivity = options.connectivity.subscribe(handleConnectivityChange);
    unsubscribeLifecycle = options.appLifecycle.subscribe(handleLifecycleChange);
  }

  function stopSyncLoop(): void {
    if (intervalId !== null) {
      options.timer.clearInterval(intervalId);
      intervalId = null;
    }

    unsubscribeConnectivity?.();
    unsubscribeConnectivity = null;

    unsubscribeLifecycle?.();
    unsubscribeLifecycle = null;
  }

  return {
    runSync,
    startSyncLoop,
    stopSyncLoop,
  };
}

import {
  createBrowserAppLifecycleAdapter,
  createBrowserConnectivityAdapter,
  createBrowserTimerAdapter,
  createDexieStorageAdapter,
} from '@lift-tracker/platform-web';
import type {
  AppLifecycleAdapter,
  ConnectivityAdapter,
  StorageAdapter,
  TimerAdapter,
} from '@lift-tracker/shared';

export interface AppAdapters {
  storage: StorageAdapter;
  connectivity: ConnectivityAdapter;
  appLifecycle: AppLifecycleAdapter;
  timer: TimerAdapter;
}

function createDefaultAdapters(): AppAdapters {
  return {
    storage: createDexieStorageAdapter(),
    connectivity: createBrowserConnectivityAdapter(),
    appLifecycle: createBrowserAppLifecycleAdapter(),
    timer: createBrowserTimerAdapter(),
  };
}

let runtimeAdapters: AppAdapters | null = null;

export function setAppAdapters(adapters: AppAdapters): void {
  runtimeAdapters = adapters;
}

export function getAppAdapters(): AppAdapters {
  runtimeAdapters ??= createDefaultAdapters();
  return runtimeAdapters;
}

export function getStorageAdapter(): StorageAdapter {
  return getAppAdapters().storage;
}

import {
  createNativeAppLifecycleAdapter,
  createNativeConnectivityAdapter,
  createNativeTimerAdapter,
  createSqliteStorageAdapter,
} from '@lift-tracker/platform-mobile';
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
    storage: createSqliteStorageAdapter(),
    connectivity: createNativeConnectivityAdapter(),
    appLifecycle: createNativeAppLifecycleAdapter(),
    timer: createNativeTimerAdapter(),
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

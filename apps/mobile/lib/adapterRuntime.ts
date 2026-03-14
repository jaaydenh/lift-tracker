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
  StorageTable,
  TimerAdapter,
} from '@lift-tracker/shared';
import { createInMemoryStorageAdapter } from './memoryStorageAdapter';

export interface AppAdapters {
  storage: StorageAdapter;
  connectivity: ConnectivityAdapter;
  appLifecycle: AppLifecycleAdapter;
  timer: TimerAdapter;
}

function isMissingNativeModuleError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("native module that doesn't exist") ||
    message.includes('cannot find native module') ||
    message.includes('turbomoduleregistry.getenforcing') ||
    message.includes('native module cannot be null')
  );
}

function createResilientStorageAdapter(): StorageAdapter {
  const sqliteStorage = createSqliteStorageAdapter();
  const memoryStorage = createInMemoryStorageAdapter();
  let useMemoryFallback = false;

  const runStorageOperation = async <TValue>(
    sqliteOperation: () => Promise<TValue>,
    memoryOperation: () => Promise<TValue>,
  ): Promise<TValue> => {
    if (useMemoryFallback) {
      return memoryOperation();
    }

    try {
      return await sqliteOperation();
    } catch (error) {
      if (!isMissingNativeModuleError(error)) {
        throw error;
      }

      useMemoryFallback = true;
      console.warn(
        '[mobile] SQLite native module is unavailable; falling back to in-memory storage for this session.',
        error,
      );
      return memoryOperation();
    }
  };

  const wrapTable = <TRecord extends { id: string }>(
    sqliteTable: StorageTable<TRecord>,
    memoryTable: StorageTable<TRecord>,
  ): StorageTable<TRecord> => {
    return {
      get: (id) => runStorageOperation(() => sqliteTable.get(id), () => memoryTable.get(id)),
      put: (record) => runStorageOperation(() => sqliteTable.put(record), () => memoryTable.put(record)),
      add: (record) => runStorageOperation(() => sqliteTable.add(record), () => memoryTable.add(record)),
      delete: (id) => runStorageOperation(() => sqliteTable.delete(id), () => memoryTable.delete(id)),
      toArray: () => runStorageOperation(() => sqliteTable.toArray(), () => memoryTable.toArray()),
      count: () => runStorageOperation(() => sqliteTable.count(), () => memoryTable.count()),
      bulkPut: (records) =>
        runStorageOperation(() => sqliteTable.bulkPut(records), () => memoryTable.bulkPut(records)),
      bulkDelete: (ids) =>
        runStorageOperation(() => sqliteTable.bulkDelete(ids), () => memoryTable.bulkDelete(ids)),
      whereEqualsMany: (key, value) =>
        runStorageOperation(
          () => sqliteTable.whereEqualsMany(key, value),
          () => memoryTable.whereEqualsMany(key, value),
        ),
      whereEqualsFirst: (key, value) =>
        runStorageOperation(
          () => sqliteTable.whereEqualsFirst(key, value),
          () => memoryTable.whereEqualsFirst(key, value),
        ),
      orderBy: (key, direction) =>
        runStorageOperation(() => sqliteTable.orderBy(key, direction), () => memoryTable.orderBy(key, direction)),
    };
  };

  return {
    exercises: wrapTable(sqliteStorage.exercises, memoryStorage.exercises),
    entries: wrapTable(sqliteStorage.entries, memoryStorage.entries),
    settings: wrapTable(sqliteStorage.settings, memoryStorage.settings),
    syncQueue: wrapTable(sqliteStorage.syncQueue, memoryStorage.syncQueue),
    syncState: wrapTable(sqliteStorage.syncState, memoryStorage.syncState),
  };
}

function createDefaultAdapters(): AppAdapters {
  return {
    storage: createResilientStorageAdapter(),
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

import type {
  Exercise,
  ExerciseEntry,
  SyncQueueItem,
  SyncState,
  UserSettings,
} from '../models/types';

export type StorageOrderDirection = 'asc' | 'desc';

export interface StorageTable<TRecord extends { id: string }> {
  get(id: string): Promise<TRecord | undefined>;
  put(record: TRecord): Promise<void>;
  add(record: TRecord): Promise<void>;
  delete(id: string): Promise<void>;
  toArray(): Promise<TRecord[]>;
  count(): Promise<number>;
  bulkPut(records: TRecord[]): Promise<void>;
  bulkDelete(ids: string[]): Promise<void>;
  whereEqualsMany<TKey extends keyof TRecord>(key: TKey, value: TRecord[TKey]): Promise<TRecord[]>;
  whereEqualsFirst<TKey extends keyof TRecord>(key: TKey, value: TRecord[TKey]): Promise<TRecord | undefined>;
  orderBy<TKey extends keyof TRecord>(key: TKey, direction?: StorageOrderDirection): Promise<TRecord[]>;
}

export interface StorageAdapter {
  exercises: StorageTable<Exercise>;
  entries: StorageTable<ExerciseEntry>;
  settings: StorageTable<UserSettings>;
  syncQueue: StorageTable<SyncQueueItem>;
  syncState: StorageTable<SyncState>;
}

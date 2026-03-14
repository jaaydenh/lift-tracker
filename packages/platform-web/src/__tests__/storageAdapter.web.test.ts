import 'fake-indexeddb/auto';
import { runStorageAdapterContractSuite } from '@lift-tracker/shared/adapters/testing';
import {
  createDexieStorageAdapter,
  type DexieStorageAdapter,
} from '../index';

let storageCounter = 0;

runStorageAdapterContractSuite('platform-web: Dexie storage adapter', {
  createStorageAdapter: () => {
    storageCounter += 1;
    return createDexieStorageAdapter({
      databaseName: `LiftTrackerDB_Test_${storageCounter}`,
    });
  },
  cleanupStorageAdapter: async (storageAdapter) => {
    await (storageAdapter as DexieStorageAdapter).deleteDatabase();
  },
});

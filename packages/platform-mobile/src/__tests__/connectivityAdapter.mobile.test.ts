import { runConnectivityAdapterContractSuite } from '@lift-tracker/shared/adapters/testing';
import { createNativeConnectivityAdapter } from '../connectivityAdapter';

class FakeConnectivitySource {
  private state = { isConnected: true, isInternetReachable: true };
  private listeners = new Set<(state: { isConnected: boolean; isInternetReachable: boolean }) => void>();

  async fetch(): Promise<{ isConnected: boolean; isInternetReachable: boolean }> {
    return this.state;
  }

  addEventListener(
    listener: (state: { isConnected: boolean; isInternetReachable: boolean }) => void,
  ): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getCurrentState(): { isConnected: boolean; isInternetReachable: boolean } {
    return this.state;
  }

  setOnline(isOnline: boolean): void {
    this.state = {
      isConnected: isOnline,
      isInternetReachable: isOnline,
    };
  }

  emitConnectivityChange(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

runConnectivityAdapterContractSuite('platform-mobile: connectivity adapter', (() => {
  const source = new FakeConnectivitySource();

  return {
    createConnectivityAdapter: () => createNativeConnectivityAdapter(source),
    setOnline: (isOnline) => {
      source.setOnline(isOnline);
    },
    emitConnectivityChange: () => {
      source.emitConnectivityChange();
    },
  };
})());

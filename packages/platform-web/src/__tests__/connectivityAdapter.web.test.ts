import { runConnectivityAdapterContractSuite } from '@lift-tracker/shared/adapters/testing';
import { createBrowserConnectivityAdapter } from '../index';

type ConnectivityEventType = 'online' | 'offline';

class FakeConnectivityTarget {
  navigator: { onLine: boolean } = { onLine: true };
  private listeners: Record<ConnectivityEventType, Set<EventListener>> = {
    online: new Set(),
    offline: new Set(),
  };

  addEventListener(type: ConnectivityEventType, listener: EventListener): void {
    this.listeners[type].add(listener);
  }

  removeEventListener(type: ConnectivityEventType, listener: EventListener): void {
    this.listeners[type].delete(listener);
  }

  emit(type: ConnectivityEventType): void {
    for (const listener of this.listeners[type]) {
      listener(new Event(type));
    }
  }
}

runConnectivityAdapterContractSuite('platform-web: connectivity adapter', (() => {
  const target = new FakeConnectivityTarget();

  return {
    createConnectivityAdapter: () => createBrowserConnectivityAdapter(target),
    setOnline: (isOnline) => {
      target.navigator.onLine = isOnline;
    },
    emitConnectivityChange: () => {
      target.emit(target.navigator.onLine ? 'online' : 'offline');
    },
  };
})());

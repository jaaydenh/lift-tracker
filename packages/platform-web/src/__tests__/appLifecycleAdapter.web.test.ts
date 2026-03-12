import { runAppLifecycleAdapterContractSuite } from '@lift-tracker/shared/adapters/testing';
import { createBrowserAppLifecycleAdapter } from '../index';

class FakeLifecycleTarget {
  visibilityState: DocumentVisibilityState = 'visible';
  private listeners = new Set<EventListener>();

  addEventListener(type: 'visibilitychange', listener: EventListener): void {
    if (type === 'visibilitychange') {
      this.listeners.add(listener);
    }
  }

  removeEventListener(type: 'visibilitychange', listener: EventListener): void {
    if (type === 'visibilitychange') {
      this.listeners.delete(listener);
    }
  }

  emitVisibilityChange(): void {
    for (const listener of this.listeners) {
      listener(new Event('visibilitychange'));
    }
  }
}

runAppLifecycleAdapterContractSuite('platform-web: app lifecycle adapter', (() => {
  const target = new FakeLifecycleTarget();

  return {
    createAppLifecycleAdapter: () => createBrowserAppLifecycleAdapter(target),
    setVisible: (isVisible) => {
      target.visibilityState = isVisible ? 'visible' : 'hidden';
    },
    emitVisibilityChange: () => {
      target.emitVisibilityChange();
    },
  };
})());

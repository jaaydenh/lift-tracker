import { runAppLifecycleAdapterContractSuite } from '@lift-tracker/shared/adapters/testing';
import { createNativeAppLifecycleAdapter } from '../appLifecycleAdapter';

class FakeAppLifecycleTarget {
  currentState = 'active';
  private listeners = new Set<(state: string) => void>();

  addEventListener(_type: 'change', listener: (state: string) => void): { remove: () => void } {
    this.listeners.add(listener);

    return {
      remove: () => {
        this.listeners.delete(listener);
      },
    };
  }

  setVisible(isVisible: boolean): void {
    this.currentState = isVisible ? 'active' : 'background';
  }

  emitVisibilityChange(): void {
    for (const listener of this.listeners) {
      listener(this.currentState);
    }
  }
}

runAppLifecycleAdapterContractSuite('platform-mobile: app lifecycle adapter', (() => {
  const target = new FakeAppLifecycleTarget();

  return {
    createAppLifecycleAdapter: () => createNativeAppLifecycleAdapter(target),
    setVisible: (isVisible) => {
      target.setVisible(isVisible);
    },
    emitVisibilityChange: () => {
      target.emitVisibilityChange();
    },
  };
})());

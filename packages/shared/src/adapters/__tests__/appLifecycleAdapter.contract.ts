import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppLifecycleAdapter } from '../appLifecycle';

interface AppLifecycleContractOptions {
  createAppLifecycleAdapter: () => AppLifecycleAdapter;
  setVisible: (isVisible: boolean) => void;
  emitVisibilityChange: () => void;
}

export function runAppLifecycleAdapterContractSuite(
  suiteName: string,
  options: AppLifecycleContractOptions,
): void {
  describe(suiteName, () => {
    let adapter: AppLifecycleAdapter;

    beforeEach(() => {
      adapter = options.createAppLifecycleAdapter();
    });

    it('returns current visibility state', () => {
      options.setVisible(true);
      expect(adapter.isVisible()).toBe(true);

      options.setVisible(false);
      expect(adapter.isVisible()).toBe(false);
    });

    it('notifies subscribers when visibility changes', () => {
      const listener = vi.fn();
      adapter.subscribe(listener);

      options.emitVisibilityChange();

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('stops notifications after unsubscribe', () => {
      const listener = vi.fn();
      const unsubscribe = adapter.subscribe(listener);

      unsubscribe();
      options.emitVisibilityChange();

      expect(listener).not.toHaveBeenCalled();
    });
  });
}

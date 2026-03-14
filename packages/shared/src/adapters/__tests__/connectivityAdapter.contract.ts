import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConnectivityAdapter } from '../connectivity';

interface ConnectivityContractOptions {
  createConnectivityAdapter: () => ConnectivityAdapter;
  setOnline: (isOnline: boolean) => void;
  emitConnectivityChange: () => void;
}

export function runConnectivityAdapterContractSuite(
  suiteName: string,
  options: ConnectivityContractOptions,
): void {
  describe(suiteName, () => {
    let adapter: ConnectivityAdapter;

    beforeEach(() => {
      adapter = options.createConnectivityAdapter();
    });

    it('returns the current online state', () => {
      options.setOnline(true);
      expect(adapter.isOnline()).toBe(true);

      options.setOnline(false);
      expect(adapter.isOnline()).toBe(false);
    });

    it('notifies subscribers when connectivity events occur', () => {
      const listener = vi.fn();
      adapter.subscribe(listener);

      options.emitConnectivityChange();

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('stops notifications after unsubscribe', () => {
      const listener = vi.fn();
      const unsubscribe = adapter.subscribe(listener);

      unsubscribe();
      options.emitConnectivityChange();

      expect(listener).not.toHaveBeenCalled();
    });
  });
}

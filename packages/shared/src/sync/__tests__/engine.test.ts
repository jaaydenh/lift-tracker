import { describe, expect, it, vi, type Mock } from 'vitest';
import type {
  AppLifecycleAdapter,
  ConnectivityAdapter,
  TimerAdapter,
} from '../../adapters';
import { createSyncEngine } from '../engine';

interface SyncHarness {
  connectivity: ConnectivityAdapter;
  appLifecycle: AppLifecycleAdapter;
  timer: TimerAdapter;
  push: Mock<(userId: string) => Promise<void>>;
  pull: Mock<(userId: string) => Promise<void>>;
  emitConnectivity: () => void;
  emitVisibility: () => void;
  tickInterval: () => void;
  setOnline: (isOnline: boolean) => void;
  setVisible: (isVisible: boolean) => void;
  clearIntervalSpy: Mock<(intervalId: number) => void>;
  unsubscribeConnectivitySpy: Mock<() => void>;
  unsubscribeLifecycleSpy: Mock<() => void>;
}

function createHarness(): SyncHarness {
  let online = true;
  let visible = true;
  let connectivityListener: (() => void) | null = null;
  let lifecycleListener: (() => void) | null = null;
  let intervalCallback: (() => void) | null = null;

  const unsubscribeConnectivitySpy = vi.fn() as Mock<() => void>;
  const unsubscribeLifecycleSpy = vi.fn() as Mock<() => void>;
  const clearIntervalSpy = vi.fn() as Mock<(intervalId: number) => void>;

  const connectivity: ConnectivityAdapter = {
    isOnline: () => online,
    subscribe: (listener) => {
      connectivityListener = listener;
      return () => {
        unsubscribeConnectivitySpy();
        connectivityListener = null;
      };
    },
  };

  const appLifecycle: AppLifecycleAdapter = {
    isVisible: () => visible,
    subscribe: (listener) => {
      lifecycleListener = listener;
      return () => {
        unsubscribeLifecycleSpy();
        lifecycleListener = null;
      };
    },
  };

  const timer: TimerAdapter = {
    setInterval: (callback) => {
      intervalCallback = callback;
      return 42;
    },
    clearInterval: clearIntervalSpy,
  };

  return {
    connectivity,
    appLifecycle,
    timer,
    push: vi.fn(async () => undefined) as Mock<(userId: string) => Promise<void>>,
    pull: vi.fn(async () => undefined) as Mock<(userId: string) => Promise<void>>,
    emitConnectivity: () => {
      connectivityListener?.();
    },
    emitVisibility: () => {
      lifecycleListener?.();
    },
    tickInterval: () => {
      intervalCallback?.();
    },
    setOnline: (isOnline) => {
      online = isOnline;
    },
    setVisible: (isVisible) => {
      visible = isVisible;
    },
    clearIntervalSpy,
    unsubscribeConnectivitySpy,
    unsubscribeLifecycleSpy,
  };
}

async function flushMicrotasks(times = 3): Promise<void> {
  for (let index = 0; index < times; index += 1) {
    await Promise.resolve();
  }
}

describe('sync/engine', () => {
  it('runs push then pull in sequence', async () => {
    const harness = createHarness();
    const callOrder: string[] = [];

    harness.push.mockImplementation(async () => {
      callOrder.push('push');
    });

    harness.pull.mockImplementation(async () => {
      callOrder.push('pull');
    });

    const engine = createSyncEngine({
      appLifecycle: harness.appLifecycle,
      connectivity: harness.connectivity,
      timer: harness.timer,
      getCurrentUserId: () => 'user-1',
      push: harness.push,
      pull: harness.pull,
    });

    await engine.runSync();

    expect(callOrder).toEqual(['push', 'pull']);
  });

  it('skips sync when offline or app is not visible', async () => {
    const harness = createHarness();
    const engine = createSyncEngine({
      appLifecycle: harness.appLifecycle,
      connectivity: harness.connectivity,
      timer: harness.timer,
      getCurrentUserId: () => 'user-1',
      push: harness.push,
      pull: harness.pull,
    });

    harness.setOnline(false);
    await engine.runSync();

    harness.setOnline(true);
    harness.setVisible(false);
    await engine.runSync();

    expect(harness.push).not.toHaveBeenCalled();
    expect(harness.pull).not.toHaveBeenCalled();
  });

  it('de-duplicates concurrent runSync calls', async () => {
    const harness = createHarness();
    let resolvePush: () => void = () => undefined;

    harness.push.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvePush = resolve;
        }),
    );

    const engine = createSyncEngine({
      appLifecycle: harness.appLifecycle,
      connectivity: harness.connectivity,
      timer: harness.timer,
      getCurrentUserId: () => 'user-1',
      push: harness.push,
      pull: harness.pull,
    });

    const firstRun = engine.runSync();
    const secondRun = engine.runSync();

    expect(firstRun).toBe(secondRun);
    expect(harness.push).toHaveBeenCalledTimes(1);

    resolvePush();
    await firstRun;
  });

  it('schedules periodic sync runs', async () => {
    const harness = createHarness();
    const engine = createSyncEngine({
      appLifecycle: harness.appLifecycle,
      connectivity: harness.connectivity,
      timer: harness.timer,
      getCurrentUserId: () => 'user-1',
      push: harness.push,
      pull: harness.pull,
      intervalMs: 1000,
    });

    engine.startSyncLoop();
    await flushMicrotasks();

    harness.tickInterval();
    await flushMicrotasks();

    expect(harness.push).toHaveBeenCalledTimes(2);
    expect(harness.pull).toHaveBeenCalledTimes(2);
  });

  it('cleans up subscriptions and interval on stop', () => {
    const harness = createHarness();
    const engine = createSyncEngine({
      appLifecycle: harness.appLifecycle,
      connectivity: harness.connectivity,
      timer: harness.timer,
      getCurrentUserId: () => 'user-1',
      push: harness.push,
      pull: harness.pull,
    });

    engine.startSyncLoop();
    engine.stopSyncLoop();

    expect(harness.clearIntervalSpy).toHaveBeenCalledWith(42);
    expect(harness.unsubscribeConnectivitySpy).toHaveBeenCalledTimes(1);
    expect(harness.unsubscribeLifecycleSpy).toHaveBeenCalledTimes(1);

    harness.emitConnectivity();
    harness.emitVisibility();

    expect(harness.push).toHaveBeenCalledTimes(1);
  });
});

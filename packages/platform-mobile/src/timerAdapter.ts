import type { TimerAdapter } from '@lift-tracker/shared';

interface TimerTarget {
  setInterval(handler: () => void, timeout: number): unknown;
  clearInterval(handle: unknown): void;
}

function resolveTimerTarget(target: TimerTarget | undefined): TimerTarget {
  if (target) {
    return target;
  }

  return {
    setInterval: (handler, timeout) => globalThis.setInterval(handler, timeout),
    clearInterval: (handle) => {
      globalThis.clearInterval(handle as ReturnType<typeof globalThis.setInterval>);
    },
  };
}

export function createNativeTimerAdapter(target?: TimerTarget): TimerAdapter {
  const timerTarget = resolveTimerTarget(target);
  const handles = new Map<number, unknown>();
  let nextIntervalId = 1;

  return {
    setInterval: (callback, intervalMs) => {
      const handle = timerTarget.setInterval(callback, intervalMs);
      const intervalId = nextIntervalId;
      nextIntervalId += 1;
      handles.set(intervalId, handle);
      return intervalId;
    },
    clearInterval: (intervalId) => {
      const handle = handles.get(intervalId);
      if (handle === undefined) {
        return;
      }

      timerTarget.clearInterval(handle);
      handles.delete(intervalId);
    },
  };
}

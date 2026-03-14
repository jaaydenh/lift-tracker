import type { TimerAdapter } from '@lift-tracker/shared';

interface TimerTarget {
  setInterval(handler: () => void, timeout: number): number;
  clearInterval(handle: number): void;
}

function resolveTimerTarget(target: TimerTarget | undefined): TimerTarget {
  if (target) {
    return target;
  }

  if (typeof window === 'undefined') {
    throw new Error('createBrowserTimerAdapter requires a browser-like target.');
  }

  return window;
}

export function createBrowserTimerAdapter(target?: TimerTarget): TimerAdapter {
  const timerTarget = resolveTimerTarget(target);

  return {
    setInterval: (callback, intervalMs) => timerTarget.setInterval(callback, intervalMs),
    clearInterval: (intervalId) => timerTarget.clearInterval(intervalId),
  };
}

import { describe, expect, it, vi } from 'vitest';
import { createNativeTimerAdapter } from '../timerAdapter';

describe('platform-mobile: timer adapter', () => {
  it('returns a numeric interval id and stops callbacks after clear', () => {
    vi.useFakeTimers();

    const adapter = createNativeTimerAdapter();
    const callback = vi.fn();

    const intervalId = adapter.setInterval(callback, 100);
    expect(typeof intervalId).toBe('number');

    vi.advanceTimersByTime(250);
    expect(callback).toHaveBeenCalledTimes(2);

    adapter.clearInterval(intervalId);
    vi.advanceTimersByTime(300);
    expect(callback).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});

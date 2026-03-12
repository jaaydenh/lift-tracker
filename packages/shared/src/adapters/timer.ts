export interface TimerAdapter {
  setInterval(callback: () => void, intervalMs: number): number;
  clearInterval(intervalId: number): void;
}

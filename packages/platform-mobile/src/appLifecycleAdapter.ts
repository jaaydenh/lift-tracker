import type { AppLifecycleAdapter, AppLifecycleListener } from '@lift-tracker/shared';

interface AppStateSubscription {
  remove(): void;
}

interface AppLifecycleTarget {
  currentState: string;
  addEventListener(type: 'change', listener: (state: string) => void): AppStateSubscription;
}

async function createDefaultLifecycleTarget(): Promise<AppLifecycleTarget> {
  const reactNativeModule = await import('react-native');
  return reactNativeModule.AppState as AppLifecycleTarget;
}

function isVisibleAppState(state: string): boolean {
  return state === 'active';
}

export function createNativeAppLifecycleAdapter(target?: AppLifecycleTarget): AppLifecycleAdapter {
  const listeners = new Set<AppLifecycleListener>();
  let currentState = target?.currentState ?? 'active';
  let resolvedTarget: AppLifecycleTarget | null = target ?? null;

  const notify = (): void => {
    for (const listener of listeners) {
      listener();
    }
  };

  const applyState = (state: string): void => {
    currentState = state;
    notify();
  };

  const initialize = async (): Promise<void> => {
    try {
      resolvedTarget ??= await createDefaultLifecycleTarget();
      currentState = resolvedTarget.currentState;
      resolvedTarget.addEventListener('change', applyState);
    } catch {
      // Keep the default visible state when AppState isn't available.
    }
  };

  void initialize();

  return {
    isVisible: () => {
      return isVisibleAppState(resolvedTarget?.currentState ?? currentState);
    },
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}

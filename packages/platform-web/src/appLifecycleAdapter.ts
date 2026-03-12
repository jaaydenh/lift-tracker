import type { AppLifecycleAdapter } from '@lift-tracker/shared';

interface AppLifecycleEventTarget {
  visibilityState: DocumentVisibilityState;
  addEventListener(type: 'visibilitychange', listener: EventListener): void;
  removeEventListener(type: 'visibilitychange', listener: EventListener): void;
}

function resolveAppLifecycleTarget(target: AppLifecycleEventTarget | undefined): AppLifecycleEventTarget {
  if (target) {
    return target;
  }

  if (typeof document === 'undefined') {
    throw new Error('createBrowserAppLifecycleAdapter requires a browser-like target.');
  }

  return document;
}

export function createBrowserAppLifecycleAdapter(
  target?: AppLifecycleEventTarget,
): AppLifecycleAdapter {
  const appLifecycleTarget = resolveAppLifecycleTarget(target);

  return {
    isVisible: () => appLifecycleTarget.visibilityState === 'visible',
    subscribe: (listener) => {
      const eventListener: EventListener = () => {
        listener();
      };

      appLifecycleTarget.addEventListener('visibilitychange', eventListener);

      return () => {
        appLifecycleTarget.removeEventListener('visibilitychange', eventListener);
      };
    },
  };
}

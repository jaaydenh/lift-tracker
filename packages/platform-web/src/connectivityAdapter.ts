import type { ConnectivityAdapter } from '@lift-tracker/shared';

interface ConnectivityEventTarget {
  navigator: Pick<Navigator, 'onLine'>;
  addEventListener(type: 'online' | 'offline', listener: EventListener): void;
  removeEventListener(type: 'online' | 'offline', listener: EventListener): void;
}

function resolveConnectivityTarget(target: ConnectivityEventTarget | undefined): ConnectivityEventTarget {
  if (target) {
    return target;
  }

  if (typeof window === 'undefined') {
    throw new Error('createBrowserConnectivityAdapter requires a browser-like target.');
  }

  return window;
}

export function createBrowserConnectivityAdapter(
  target?: ConnectivityEventTarget,
): ConnectivityAdapter {
  const connectivityTarget = resolveConnectivityTarget(target);

  return {
    isOnline: () => connectivityTarget.navigator.onLine,
    subscribe: (listener) => {
      const eventListener: EventListener = () => {
        listener();
      };

      connectivityTarget.addEventListener('online', eventListener);
      connectivityTarget.addEventListener('offline', eventListener);

      return () => {
        connectivityTarget.removeEventListener('online', eventListener);
        connectivityTarget.removeEventListener('offline', eventListener);
      };
    },
  };
}

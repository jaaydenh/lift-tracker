import type { ConnectivityAdapter, ConnectivityListener } from '@lift-tracker/shared';

interface ConnectivityState {
  isConnected: boolean | null;
  isInternetReachable?: boolean | null;
}

interface ConnectivitySource {
  fetch(): Promise<ConnectivityState>;
  addEventListener(listener: (state: ConnectivityState) => void): () => void;
  getCurrentState?(): ConnectivityState;
}

function normalizeConnectivityState(state: ConnectivityState): ConnectivityState {
  return {
    isConnected: state.isConnected,
    isInternetReachable: state.isInternetReachable ?? null,
  };
}

function isOnline(state: ConnectivityState): boolean {
  return state.isConnected !== false && state.isInternetReachable !== false;
}

async function createDefaultConnectivitySource(): Promise<ConnectivitySource> {
  const netInfoModule = await import('@react-native-community/netinfo');
  const netInfo = netInfoModule.default;
  let latestState: ConnectivityState = { isConnected: true, isInternetReachable: true };

  return {
    fetch: async () => {
      latestState = normalizeConnectivityState(await netInfo.fetch());
      return latestState;
    },
    addEventListener: (listener) =>
      netInfo.addEventListener((state) => {
        latestState = normalizeConnectivityState(state);
        listener(latestState);
      }),
    getCurrentState: () => latestState,
  };
}

export function createNativeConnectivityAdapter(source?: ConnectivitySource): ConnectivityAdapter {
  const listeners = new Set<ConnectivityListener>();
  let currentState: ConnectivityState = { isConnected: true, isInternetReachable: true };
  let resolvedSource: ConnectivitySource | null = source ?? null;

  const notify = (): void => {
    for (const listener of listeners) {
      listener();
    }
  };

  const applyState = (nextState: ConnectivityState): void => {
    currentState = normalizeConnectivityState(nextState);
    notify();
  };

  const initialize = async (): Promise<void> => {
    try {
      resolvedSource ??= await createDefaultConnectivitySource();
      const fetchedState = await resolvedSource.fetch();
      applyState(fetchedState);
      resolvedSource.addEventListener(applyState);
    } catch {
      // Keep the default optimistic online state if NetInfo is unavailable.
    }
  };

  void initialize();

  return {
    isOnline: () => {
      const liveState = resolvedSource?.getCurrentState?.() ?? currentState;
      return isOnline(liveState);
    },
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}

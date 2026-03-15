interface SecureStoreModule {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

const secureStoreFallback = new Map<string, string>();

let secureStoreModulePromise: Promise<SecureStoreModule | null> | null = null;
let shouldUseFallbackOnly = false;

function isMissingNativeModuleError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("native module that doesn't exist") ||
    message.includes('cannot find native module') ||
    message.includes('turbomoduleregistry.getenforcing') ||
    message.includes('native module cannot be null')
  );
}

function activateFallback(error: unknown): void {
  shouldUseFallbackOnly = true;
  console.warn('[mobile] expo-secure-store native module unavailable; using in-memory auth storage fallback.', error);
}

async function getSecureStoreModule(): Promise<SecureStoreModule | null> {
  if (shouldUseFallbackOnly) {
    return null;
  }

  secureStoreModulePromise ??= (async () => {
    try {
      const secureStoreModule = await import('expo-secure-store');
      return secureStoreModule;
    } catch (error) {
      activateFallback(error);
      return null;
    }
  })();

  return secureStoreModulePromise;
}

export const secureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const secureStoreModule = await getSecureStoreModule();

    if (!secureStoreModule) {
      return secureStoreFallback.get(key) ?? null;
    }

    try {
      return await secureStoreModule.getItemAsync(key);
    } catch (error) {
      if (!isMissingNativeModuleError(error)) {
        throw error;
      }

      activateFallback(error);
      return secureStoreFallback.get(key) ?? null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    const secureStoreModule = await getSecureStoreModule();

    if (!secureStoreModule) {
      secureStoreFallback.set(key, value);
      return;
    }

    try {
      await secureStoreModule.setItemAsync(key, value);
    } catch (error) {
      if (!isMissingNativeModuleError(error)) {
        throw error;
      }

      activateFallback(error);
      secureStoreFallback.set(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    const secureStoreModule = await getSecureStoreModule();

    if (!secureStoreModule) {
      secureStoreFallback.delete(key);
      return;
    }

    try {
      await secureStoreModule.deleteItemAsync(key);
    } catch (error) {
      if (!isMissingNativeModuleError(error)) {
        throw error;
      }

      activateFallback(error);
      secureStoreFallback.delete(key);
    }
  },
};

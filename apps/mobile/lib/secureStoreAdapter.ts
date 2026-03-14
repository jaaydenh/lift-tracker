interface SecureStoreModule {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

const secureStoreFallback = new Map<string, string>();

let secureStoreModulePromise: Promise<SecureStoreModule | null> | null = null;

async function getSecureStoreModule(): Promise<SecureStoreModule | null> {
  secureStoreModulePromise ??= (async () => {
    try {
      const secureStoreModule = await import('expo-secure-store');
      return secureStoreModule;
    } catch (error) {
      console.warn('[mobile] expo-secure-store is unavailable; using in-memory auth storage fallback.', error);
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

    return secureStoreModule.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    const secureStoreModule = await getSecureStoreModule();

    if (!secureStoreModule) {
      secureStoreFallback.set(key, value);
      return;
    }

    await secureStoreModule.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    const secureStoreModule = await getSecureStoreModule();

    if (!secureStoreModule) {
      secureStoreFallback.delete(key);
      return;
    }

    await secureStoreModule.deleteItemAsync(key);
  },
};

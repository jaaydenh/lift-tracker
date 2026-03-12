import { createContext, useEffect, type ReactNode } from 'react';
import type { AppAdapters } from './adapterRuntime';
import { getAppAdapters, setAppAdapters } from './adapterRuntime';

const AppAdaptersContext = createContext<AppAdapters | null>(null);

interface AppAdaptersProviderProps {
  children: ReactNode;
  adapters?: AppAdapters;
}

export default function AppAdaptersProvider({
  children,
  adapters,
}: AppAdaptersProviderProps) {
  const resolvedAdapters = adapters ?? getAppAdapters();

  useEffect(() => {
    if (adapters) {
      setAppAdapters(adapters);
    }
  }, [adapters]);

  return (
    <AppAdaptersContext.Provider value={resolvedAdapters}>
      {children}
    </AppAdaptersContext.Provider>
  );
}

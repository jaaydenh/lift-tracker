import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { getAppAdapters } from '../lib/adapterRuntime';
import { seedDatabase } from '../lib/seed';
import { useExerciseStore } from '../store/useExerciseStore';
import { useSettingsStore } from '../store/useSettingsStore';
import AppAdaptersProvider from './AppAdaptersProvider';
import AuthProvider from './AuthProvider';

interface ProvidersProps {
  children: ReactNode;
}

function BootstrapScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-950 px-8">
      <ActivityIndicator size="large" color="#f8fafc" />
      <Text className="mt-4 text-base text-slate-100">Bootstrapping Lift Tracker...</Text>
    </View>
  );
}

export default function Providers({ children }: ProvidersProps) {
  const settingsLoaded = useSettingsStore((state) => state.isLoaded);
  const exercisesLoaded = useExerciseStore((state) => state.isLoaded);
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    void (async () => {
      getAppAdapters();
      await seedDatabase();
      await Promise.all([
        useSettingsStore.getState().loadSettings(),
        useExerciseStore.getState().loadData(),
      ]);

      if (!isCancelled) {
        setIsBootstrapped(true);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <AppAdaptersProvider>
      {!isBootstrapped || !settingsLoaded || !exercisesLoaded ? (
        <BootstrapScreen />
      ) : (
        <AuthProvider>{children}</AuthProvider>
      )}
    </AppAdaptersProvider>
  );
}

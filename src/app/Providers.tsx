import { useEffect, type ReactNode } from 'react';
import { seedDatabase } from '../db/seed';
import { useExerciseStore } from '../store/useExerciseStore';
import { useSettingsStore } from '../store/useSettingsStore';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const settingsLoaded = useSettingsStore((state) => state.isLoaded);
  const exercisesLoaded = useExerciseStore((state) => state.isLoaded);

  useEffect(() => {
    void (async () => {
      await seedDatabase();
      await Promise.all([
        useSettingsStore.getState().loadSettings(),
        useExerciseStore.getState().loadData(),
      ]);
    })();
  }, []);

  if (!settingsLoaded || !exercisesLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}

import { useEffect, useState, type ReactNode } from 'react';
import { Redirect, usePathname } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import { migrateLocalDataToUser } from '../sync/migration';
import { runSync, startSyncLoop, stopSyncLoop } from '../sync/syncEngine';
import { useAuthStore } from './useAuthStore';

interface AuthGateProps {
  children: ReactNode;
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-slate-950 px-8">
      <ActivityIndicator size="large" color="#f8fafc" />
      <Text className="mt-4 text-base text-slate-100">{message}</Text>
    </View>
  );
}

export default function AuthGate({ children }: AuthGateProps) {
  const pathname = usePathname();
  const isLoading = useAuthStore((state) => state.isLoading);
  const session = useAuthStore((state) => state.session);
  const initialize = useAuthStore((state) => state.initialize);
  const hasCompletedOnboarding = useSettingsStore((state) => state.settings.hasCompletedOnboarding);
  const userId = session?.user.id;
  const [isMigrating, setIsMigrating] = useState(true);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (!userId) {
      setIsMigrating(false);
      return;
    }

    let isCancelled = false;
    setIsMigrating(true);

    void (async () => {
      try {
        await migrateLocalDataToUser(userId);
      } catch (error) {
        console.error('[auth] Failed local migration', error);
      } finally {
        if (!isCancelled) {
          setIsMigrating(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (session && !isMigrating) {
      void runSync();
      startSyncLoop();

      return () => {
        stopSyncLoop();
      };
    }

    return undefined;
  }, [session, isMigrating]);

  if (isLoading) {
    return <LoadingScreen message="Initializing authentication..." />;
  }

  const isAuthPath = pathname === '/sign-in' || pathname === '/auth/callback';

  if (session && isMigrating) {
    return <LoadingScreen message="Syncing your data..." />;
  }

  if (!hasCompletedOnboarding && pathname !== '/onboarding') {
    return <Redirect href="/onboarding" />;
  }

  if (hasCompletedOnboarding && pathname === '/onboarding') {
    return <Redirect href="/" />;
  }

  if (session && isAuthPath) {
    return <Redirect href="/" />;
  }

  return <>{children}</>;
}

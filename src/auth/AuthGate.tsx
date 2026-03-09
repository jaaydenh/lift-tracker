import { useEffect, useState, type ReactNode } from 'react';
import { useAuthStore } from './useAuthStore';
import SignInPage from '../pages/SignInPage';
import { migrateLocalDataToUser } from '../sync/migration';

interface AuthGateProps {
  children: ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const isLoading = useAuthStore((state) => state.isLoading);
  const session = useAuthStore((state) => state.session);
  const initialize = useAuthStore((state) => state.initialize);
  const userId = session?.user.id;
  const [isMigrating, setIsMigrating] = useState(true);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (!userId) {
      setIsMigrating(true);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return <SignInPage />;
  }

  if (isMigrating) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p className="text-lg">Syncing your data...</p>
      </div>
    );
  }

  return <>{children}</>;
}

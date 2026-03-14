import type { ReactNode } from 'react';
import AuthGate from '../auth/AuthGate';

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return <AuthGate>{children}</AuthGate>;
}

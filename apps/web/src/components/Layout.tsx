import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div
        className="min-h-screen w-full max-w-md mx-auto"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 1rem)',
          paddingRight: 'max(env(safe-area-inset-right), 1rem)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)',
          paddingLeft: 'max(env(safe-area-inset-left), 1rem)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

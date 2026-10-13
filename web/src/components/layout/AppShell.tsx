'use client';
import { ReactNode } from 'react';
import { Sidebar, BottomNav } from './Navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Spinner } from '@/components/ui';

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { isLoading, isAuthenticated } = useAuthGuard();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-sand">
      <Sidebar />
      <main className="md:ml-64 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

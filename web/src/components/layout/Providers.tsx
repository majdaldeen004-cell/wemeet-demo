'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { useAuthStore } from '@/store/authStore';
import { useNotifications } from '@/hooks/useNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { socketManager } from '@/lib/socket';
import { authApi, usersApi } from '@/lib/api';
import { getInMemoryToken, setInMemoryToken } from '@/lib/api/client';

const hasSessionCookie = (): boolean =>
  typeof document !== 'undefined' && document.cookie.split('; ').some((cookie) => cookie === 'wm_session=1');

const HydrationGuard = ({ children }: { children: ReactNode }) => {
  const { hydrate, isAuthenticated } = useAuthStore();

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    if (isAuthenticated) {
      socketManager.connect();
    } else {
      socketManager.disconnect();
    }
  }, [isAuthenticated]);

  return <>{children}</>;
};

const AuthBootstrap = ({ children }: { children: ReactNode }) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const sessionPresent = hasSessionCookie();
      const accessTokenPresent = Boolean(getInMemoryToken());
      const store = useAuthStore.getState();

      if (sessionPresent && !accessTokenPresent) {
        try {
          const { tokens } = await authApi.refresh();
          setInMemoryToken(tokens.accessToken);
          const me = await usersApi.getMe();
          store.login(tokens, me);
        } catch {
          store.logout();
        }
      } else if (!sessionPresent && store.isAuthenticated && !accessTokenPresent) {
        store.logout();
      }

      if (!cancelled) setReady(true);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-green/20 border-t-brand-green rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
};

const NotificationBootstrap = ({ children }: { children: ReactNode }) => {
  useNotifications();       // polls unread counts + wires socket notifications
  usePushNotifications();   // registers Web Push VAPID subscription
  return <>{children}</>;
};

export const Providers = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary>
    <HydrationGuard>
      <AuthBootstrap>
        <NotificationBootstrap>
          {children}
        </NotificationBootstrap>
      </AuthBootstrap>
    </HydrationGuard>
  </ErrorBoundary>
);

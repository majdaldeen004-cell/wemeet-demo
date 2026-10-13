/**
 * web/src/store/authStore.ts
 *
 * [FIX-1] Runtime login TypeError repaired:
 *   - Removed broken imports of `setTokens` and `clearTokens`.
 *   - `login` now calls `setInMemoryToken(tokens.accessToken)`.
 *   - `logout` calls `setInMemoryToken(null)`.
 *
 * [FIX-2] XSS token-leakage eliminated (V-5 cookie hardening):
 *   - Raw JWT never written to any cookie.
 *   - Replaced with valueless session-flag cookie `wm_session=1`.
 *   - wm_is_admin cookie is now HttpOnly, written by the backend at login/logout.
 *     The frontend no longer writes it — the browser forwards it automatically.
 *
 * [V-ADMIN] Admin route protection:
 *   - setSessionCookie writes only wm_session (presence flag).
 *   - wm_is_admin is set/cleared server-side in auth.controller.ts.
 *   - deleteSessionCookie clears only wm_session.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthTokens } from '@/types';
import { setInMemoryToken } from '@/lib/api/client';

// ─── Cookie helpers ───────────────────────────────────────────────────────────
// wm_session   : client-writable presence flag — Next.js middleware checks this.
// wm_is_admin  : HttpOnly cookie written/cleared by the backend at login/logout.
//                The frontend no longer touches it; the browser forwards it automatically.

const setSessionCookie = (_user: User) => {
  if (typeof document === 'undefined') return;
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  // max-age matches the refresh token lifetime (30 days) so the browser
  // re-presents wm_session across restarts — AuthBootstrap silently refreshes
  // the access token on next load.  If the refresh token has expired the API
  // call fails, store.logout() runs, and wm_session is deleted correctly.
  const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
  document.cookie = `wm_session=1; max-age=${maxAge}; path=/; SameSite=Strict${secure}`;
};

const deleteSessionCookie = () => {
  if (typeof document === 'undefined') return;
  const expired = 'expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict';
  // Clear only the client-writable cookie.
  // wm_is_admin (HttpOnly) is cleared by the backend at POST /auth/logout.
  document.cookie = `wm_session=; ${expired}`;
};

// ─── Store interface ──────────────────────────────────────────────────────────

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingPhone: string | null;
  setupToken: string | null;
  login:           (tokens: AuthTokens, user: User) => void;
  logout:          () => void;
  updateUser:      (partial: Partial<User>) => void;
  setPendingPhone: (phone: string) => void;
  setSetupToken:   (token: string) => void;
  setLoading:      (v: boolean) => void;
  hydrate:         () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      pendingPhone: null,
      setupToken: null,

      login: (tokens, user) => {
        setInMemoryToken(tokens.accessToken);
        setSessionCookie(user); // writes wm_session presence flag only
        set({ user, isAuthenticated: true, isLoading: false });
      },

      logout: () => {
        setInMemoryToken(null);
        deleteSessionCookie(); // clears wm_session; wm_is_admin cleared by backend
        set({
          user: null,
          isAuthenticated: false,
          pendingPhone: null,
          setupToken: null,
          isLoading: false,
        });
      },

      updateUser: (partial) => {
        const current = get().user;
        if (!current) return;
        set({ user: { ...current, ...partial } });
      },

      setPendingPhone:  (phone)  => set({ pendingPhone: phone }),
      setSetupToken:    (token)  => set({ setupToken: token }),
      setLoading:       (v)      => set({ isLoading: v }),
      hydrate:          ()       => set({ isLoading: false }),
    }),
    {
      name: 'wm_auth',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
      ),
      // Tokens are NEVER persisted — only safe user identity data
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
      onRehydrateStorage: () => (state) => { state?.setLoading(false); },
    },
  ),
);

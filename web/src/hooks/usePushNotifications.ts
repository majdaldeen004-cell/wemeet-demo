'use client';
/**
 * web/src/hooks/usePushNotifications.ts
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEMO STUB — Web Push is intentionally disabled.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The production hook registered `/sw.js`, asked the browser for notification
 * permission, fetched a VAPID public key from the backend and POSTed a real
 * push subscription (`POST /notifications/push/web`).
 *
 * In a public demo none of that is appropriate: it would prompt visitors for a
 * browser permission they did not ask for, and it exists only to talk to a
 * backend that is not deployed here. The hook is therefore a documented no-op
 * that keeps the same call signature, so `Providers` and the page tree stay
 * unchanged. `public/sw.js` was removed along with it.
 */

export const usePushNotifications = (): void => {
  // Deliberately does nothing in the demo build.
  // See the file header for the full rationale.
};

export default usePushNotifications;

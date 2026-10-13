/**
 * web/next.config.js — DEMO BUILD
 *
 * The production config ran `output: 'standalone'` (a Node server behind
 * nginx/Docker), reverse-proxied `/api/v1` and `/ws` to the private backend,
 * scoped `next/image` to the private object-storage host, and wrapped
 * everything in Sentry.
 *
 * None of that applies to the public demo:
 *   • there is no backend to proxy to — every API route is answered in the
 *     browser by `src/lib/mock/router.ts`
 *   • there are no private hosts to allow (all images are local/generated)
 *   • Sentry is not configured, so the wrapper is gone
 *   • `output: 'export'` produces a plain static site (out/) that needs no
 *     Node runtime, which is what makes a public static host possible
 */
const nextConfig = {
  output: 'export',
  ...(process.env.NEXT_PUBLIC_BASE_PATH ? { basePath: process.env.NEXT_PUBLIC_BASE_PATH } : {}),

  // Emit `route/index.html` per page so a plain static host serves deep links
  // (e.g. /events/evt-1001/) without server-side rewrites.
  trailingSlash: true,

  // The image optimizer is a server feature; it is unavailable in an export.
  images: { unoptimized: true },

  // react-leaflet does not tolerate React 18 StrictMode's dev-only
  // mount→unmount→remount double-invoke ("Map container is already
  // initialized"), so this stays off exactly as in production.
  reactStrictMode: false,

  // @wemeet/shared ships raw TS source (no build step); transpile it like
  // first-party app code.
  transpilePackages: ['@wemeet/shared'],

  // OpenStreetMap tile/geocoding endpoints are public infrastructure and are
  // the only outbound requests the demo can make (map tiles + address search).
  env: {
    NEXT_PUBLIC_OSM_TILE_URL:  process.env.NEXT_PUBLIC_OSM_TILE_URL,
    NEXT_PUBLIC_NOMINATIM_URL: process.env.NEXT_PUBLIC_NOMINATIM_URL,
  },
};

module.exports = nextConfig;

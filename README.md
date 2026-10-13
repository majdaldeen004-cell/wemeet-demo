# WeMeet — Frontend Demo

A self-contained, **backend-free** demo of the WeMeet web client (Arabic/RTL events & community
platform). It is the *actual* WeMeet web UI — same pages, layout, components, Tailwind design
tokens, RTL behaviour and interactions — running on **fictional in-browser data with simulated
authentication**. No production backend, database, object storage, SMS/OTP provider, push service
or analytics endpoint is contacted at runtime.

> **This is a demo, not the product.** All users, events, messages and notifications are invented.
> Sign-in is simulated in the browser. A small "عرض تجريبي" (demo) badge is shown on every page.

---

## 1. Provenance

| | |
|---|---|
| Extracted from | the private WeMeet monorepo (`web/` + `shared/` packages only) |
| Extraction type | copy of the existing frontend source, with backend coupling replaced by a local mock layer |
| Backend code included | **none** (no `backend/`, no Prisma schema/migrations, no Docker/nginx, no deploy scripts) |
| Real data included | **none** (no DB dumps, uploads, logs, user records) |
| Secrets included | **none** (no `.env`, keys, certificates, tokens) |
| Mobile app / Remotion video package | not included (out of scope for the web demo) |

The source repository was only read; it was not modified, renamed, or pushed to.

---

## 2. Stack

- **Next.js 14** (App Router, `output: 'export'` → plain static site)
- **React 18**, TypeScript 5 (strict)
- **Tailwind CSS 3** with the product's original design tokens (`src/../tailwind.config.ts`)
- **zustand** stores, **react-hook-form** + **zod** validation, **lucide-react** icons
- **react-leaflet / leaflet** for the event map, **qrcode.react** for check-in QR
- Fonts: Cairo (as in production), RTL-first (`<html lang="ar" dir="rtl">`)

`shared/` is the original `@wemeet/shared` workspace package (types, constants, validators, geo
helpers) and ships raw TypeScript, transpiled by Next via `transpilePackages`.

## 3. Layout

```
wemeet-demo/
├── package.json          # npm workspaces: shared, web
├── shared/               # @wemeet/shared — types/constants/validators/geo helpers
└── web/
    ├── next.config.js    # static export, trailingSlash, no rewrites/proxy, no Sentry
    ├── src/app/          # App Router pages (the real WeMeet screens)
    ├── src/components/   # layout, ui, forms, maps, events components
    ├── src/hooks/        # data hooks (unchanged interfaces)
    ├── src/lib/mock/     # ⟵ THE DEMO LAYER: data.ts (dataset) + router.ts (API emulator)
    ├── src/lib/socket/   # local simulated socket (replaces socket.io-client)
    └── src/store/        # zustand stores (auth/events/chat/notifications)
```

## 4. Pages included

`/` landing · `/login` · `/verify-otp` · `/complete-profile` · `/home` event discovery ·
`/events/[id]` event detail (8 events exported) · `/events/map` Leaflet map ·
`/create-event` create form · `/friends` · `/messages` inbox · `/messages/[userId]` conversation ·
`/notifications` · `/profile` · `/settings` · `/gaming` Game Hub · `/gaming/tournaments/[id]`
(with brackets) · `/gaming/venues/[id]` · `/gaming/create-tournament` · `/admin` moderation panel ·
`/terms`. Dynamic routes are pre-rendered via `generateStaticParams` (8 events, 13 profiles,
4 tournaments, 3 venues), so deep links and page refreshes work on a plain static host.

## 5. What replaced the backend

| Production dependency | Demo replacement |
|---|---|
| REST API (`axios` → `/api/v1/*`) | `src/lib/mock/router.ts` — a deterministic in-memory router that implements the real service interfaces (`authApi`, `usersApi`, `eventsApi`, `friendsApi`, `messagesApi`, `notificationsApi`, `redFlagsApi`, `gamingApi`). One axios-shaped adapter keeps every hook/store unchanged. |
| PostgreSQL / Prisma | `src/lib/mock/data.ts` — 13 fictional users, 8 events (with encoded polylines), memberships, friendships, DM threads, event chat history, notifications, admin stats/reports, tournaments + brackets, venues. |
| JWT auth + OTP + Google Sign-In | Simulated: `POST /auth/send-otp` always returns the demo code `123456`; `POST /auth/verify-otp` issues `demo.access.token` / `demo.refresh.token`. A phone number is never contacted; **no Firebase, no SMS**. |
| socket.io realtime chat | `src/lib/socket/index.ts` — a local event emitter with the same API (`connect/emit/on/off`), inflating latency and simulating room join, peer typing and canned peer replies. |
| Web Push (VAPID) + `public/sw.js` | `usePushNotifications` is a documented no-op; the VAPID endpoint returns `{ key: null }`; no service worker is registered. |
| MinIO/S3 uploads, Sentry, Google Maps/OSM keys | Uploads return a generated local SVG/data-URI avatar; Sentry removed; only **public** OpenStreetMap tile + Nominatim endpoints remain (map tiles / address search). |
| Backend reverse proxy (`/api/v1`, `/ws` rewrites) | Removed from `next.config.js`. |

Demo state (current user, join/leave, created events, sent messages) is held in memory for the
session; only `zustand`-persisted auth flags use browser storage. No credentials are stored.

## 6. Run it

```bash
npm install            # npm workspaces; no env vars required
npm run dev            # http://localhost:3000

# static build + preview of the exact deployable output
npm run build          # → web/out
npx serve web/out      # or: npm run serve
```

Quality gates used for this extraction:

```bash
npm run type-check     # tsc --noEmit (shared + web)
npm run lint           # next lint
npm run build          # next build (static export)
```

## 7. Deploying

The build output `web/out/` is a static site — host it anywhere that serves files
(Netlify / Cloudflare Pages / GitHub Pages / S3+CDN / nginx). No Node runtime, no env vars and no
backend are needed. Because `trailingSlash: true` is set, every route exists as
`<route>/index.html`, so deep links resolve without server rewrites. A 404 page is included.

## 8. Security review (performed before publishing)

Scanned the source and the `web/out` build output for infrastructure/secret patterns
(production DB URLs, MinIO/S3 keys, JWT secrets, VAPID keys, Firebase service-account data,
Twilio credentials, Sentry DSNs, tunnel/internal hostnames, absolute developer paths):

- **No matches** for any production credential or internal host in the shipped files.
- `web/out` contains **no** reference to the private API host, Firebase, or object storage; the
  only outbound hosts referenced are public OSM/Nominatim, Google Fonts and library doc links.
- No `.env*` file is committed (only `.env.example`, which contains two optional public OSM URLs).
- All credentials that exist in the private repository were deliberately **not** copied.

Remember that everything under `web/out` (and the source of this repo) is publicly readable.

## 9. Known limitations

- Data resets on reload; there is no persistence layer and no multi-user collaboration.
- Sign-in, OTP, payments, uploads, push notifications and moderation actions are **simulated**.
- Chat is local: replies are canned and generated by the demo, not by other people.
- `/admin` is reachable with the demo account for exploration only; nothing is enforced server-side.
- Map tiles and address search depend on the public OpenStreetMap/Nominatim services; if they are
  unavailable the map screens degrade but the rest of the demo is unaffected.
- `next lint` reports 5 inherited warnings (an `<img>` in the admin table and `useEffect`
  dependency hints in hooks carried over verbatim from the product code). They are pre-existing,
  non-blocking, and were intentionally not "fixed" so the UI code stays faithful to the original.

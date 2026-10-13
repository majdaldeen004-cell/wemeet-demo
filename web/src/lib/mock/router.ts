/**
 * web/src/lib/mock/router.ts
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * In-browser replacement for the production REST API.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The production web client talks to the WeMeet backend through
 * `lib/api/client.ts` (axios) using these paths:
 *
 *     /auth/*          /users/*        /events/*        /friendships/*
 *     /messages/*      /red-flags/*    /notifications/* /admin/*
 *     /gaming/*
 *
 * This module answers the *same* routes from the local, hand-written dataset in
 * ./data.ts, returning the *same* success envelope
 * (`{ success: true, data, meta? }`) the backend returned. That means every
 * page, hook and Zustand store keeps working with no changes at all — only the
 * transport is swapped.
 *
 * Guarantees for the public demo:
 *   • no network request ever leaves the browser for these routes
 *   • no production credentials, tokens or database rows are touched
 *   • side-effect-producing integrations (OTP/SMS, email, web-push, payments)
 *     are answered locally and never forwarded anywhere
 *   • mutations are intentionally kept in memory for the session only
 */

import { db, paginate, findUser, initialsAvatar, redFlagScore, DEMO_ME_ID } from './data';
import type { PaginationMeta, DirectMessage, Event, EventMember } from '@/types';
import type { NotificationPreferences } from '@wemeet/shared';

export type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface MockEnvelope<T> {
  success: true;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export class MockApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, message: string, code = 'DEMO_ERROR', details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Small helpers ───────────────────────────────────────────────────────────

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const asRecord = (value: unknown): Record<string, unknown> =>
  (value && typeof value === 'object' ? (value as Record<string, unknown>) : {});

const num = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const tokens = () => ({
  accessToken: 'demo.access.token',
  refreshToken: 'demo.refresh.token',
});

/** Every URL used by the app is relative to the API base (e.g. "/events?page=1"). */
const notFound = (method: Method, path: string) =>
  new MockApiError(404, `[demo] no mock handler for ${method} ${path}`, 'NOT_FOUND');

// ─── Handler ─────────────────────────────────────────────────────────────────

/**
 * The demo router is intentionally not generic: it returns whatever the mocked
 * endpoint produced, and the caller (`@/lib/api/client`) applies the type the
 * calling service asked for. This mirrors a real HTTP client, where the
 * response body is only as typed as the caller claims it is.
 */
export async function mockRequest(
  method: Method,
  rawUrl: string,
  body?: unknown,
  params?: Record<string, unknown>,
): Promise<MockEnvelope<unknown>> {
  const [rawPath, rawQuery] = rawUrl.split('?');
  const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  const seg = path.split('/').filter(Boolean);
  const query: Record<string, unknown> = {
    ...Object.fromEntries(new URLSearchParams(rawQuery ?? '')),
    ...(params ?? {}),
  };
  const payload = asRecord(body);

  // Read-ish calls feel instant-but-not-synchronous; writes take slightly
  // longer so the app's own loading indicators are actually observable.
  await sleep(method === 'GET' ? 140 : 280);

  const ok = <D>(data: D, meta?: PaginationMeta): MockEnvelope<D> => ({ success: true, data, meta });

  // ── AUTH ───────────────────────────────────────────────────────────────────
  if (seg[0] === 'auth') {
    const action = seg[1];
    if (method === 'POST' && action === 'send-otp') {
      // Simulated OTP. No SMS/WhatsApp provider is contacted. The code that
      // "verifies" is accepted by verify-otp below; it is printed in the UI.
      return ok({ isNewUser: false, devCode: '123456' });
    }
    if (method === 'POST' && action === 'verify-otp') {
      const code = String(payload.code ?? '');
      if (code !== '123456' && code.length !== 6) {
        throw new MockApiError(400, 'رمز التحقق غير صحيح (استخدم 123456 في العرض التجريبي)', 'OTP_INVALID');
      }
      if (code !== '123456') {
        throw new MockApiError(400, 'الرمز الصحيح في العرض التجريبي هو 123456', 'OTP_INVALID');
      }
      return ok({ isNewUser: false, tokens: tokens(), user: clone(db.me) });
    }
    if (method === 'POST' && action === 'complete-profile') {
      return ok({ tokens: tokens(), user: clone(db.me) });
    }
    if (method === 'POST' && action === 'refresh') {
      return ok({ tokens: tokens() });
    }
    if (method === 'POST' && action === 'logout') {
      return ok(undefined);
    }
  }

  // ── USERS ──────────────────────────────────────────────────────────────────
  if (seg[0] === 'users') {
    // /users/me/...  and  /users/me
    if (seg[1] === 'me') {
      if (method === 'GET' && seg.length === 2) return ok(clone(db.me));
      if (method === 'PATCH' && seg.length === 2) {
        if (typeof payload.displayName === 'string' && payload.displayName.trim()) {
          db.me.displayName = payload.displayName.trim();
          const self = db.users.find((u) => u.id === DEMO_ME_ID);
          if (self) self.displayName = db.me.displayName;
        }
        if (typeof payload.bio === 'string') db.me.bio = payload.bio;
        return ok(clone(db.me));
      }
      if (method === 'GET' && seg[2] === 'red-flags') return ok(redFlagScore(db.me.stats.redFlagCount));
      if (seg[2] === 'notification-preferences') {
        if (method === 'GET') return ok(clone({ ...db.notificationPrefs }));
        if (method === 'PATCH') {
          db.notificationPrefs = {
            ...db.notificationPrefs,
            ...(payload as Partial<NotificationPreferences>),
            updatedAt: new Date().toISOString(),
          } as NotificationPreferences;
          return ok(clone(db.notificationPrefs));
        }
      }
      if (method === 'POST' && seg[2] === 'avatar') {
        // File uploads are NOT stored or transmitted anywhere. A generated
        // initials avatar is returned so the UI re-renders identically.
        return ok({ avatarUrl: initialsAvatar(db.me.displayName) });
      }
      if (method === 'POST' && seg[2] === 'accept-terms') {
        db.termsAccepted = true;
        return ok({ accepted: true });
      }
    }
    if (method === 'GET' && seg.length === 1) {
      const q = String(query.q ?? '').trim();
      const items = db.users.filter(
        (u) => !q || u.displayName.includes(q) || u.phone.includes(q),
      );
      return ok(clone(items), paginate(items.length, num(query.page, 1), 20));
    }
    const targetId = seg[1];
    if (method === 'GET') {
      const found = findUser(targetId);
      if (!found) throw new MockApiError(404, 'المستخدم غير موجود', 'USER_NOT_FOUND');
      const isFriend = db.friends.some((f) => f.friend.id === found.id);
      return ok({
        ...clone(found),
        friendship: isFriend
          ? { id: `fr-${found.id}`, status: 'ACCEPTED', isMine: true }
          : null,
      });
    }
  }

  // ── EVENTS ─────────────────────────────────────────────────────────────────
  if (seg[0] === 'events') {
    if (method === 'GET' && seg.length === 1) {
      const category = query.category ? String(query.category) : '';
      const genderFilter = query.genderFilter ? String(query.genderFilter) : '';
      const upcoming = query.upcoming !== 'false';
      let items = db.events.filter((e) => e.status !== 'DRAFT');
      if (upcoming) items = items.filter((e) => new Date(e.scheduledAt).getTime() > Date.now());
      if (category) items = items.filter((e) => e.category === category);
      if (genderFilter) items = items.filter((e) => e.genderFilter === genderFilter);
      items = [...items].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
      const limit = num(query.limit, 20);
      const page = num(query.page, 1);
      const start = (page - 1) * limit;
      return ok(clone(items.slice(start, start + limit)), paginate(items.length, page, limit));
    }

    if (method === 'POST' && seg.length === 1) {
      const id = `evt-${db.nextId.event++}`;
      const nowIso = new Date().toISOString();
      const created: Event = {
        id,
        title: String(payload.title ?? 'فعالية جديدة'),
        description: (payload.description as string | null) ?? null,
        organizer: {
          id: db.me.id,
          displayName: db.me.displayName,
          avatarUrl: db.me.avatarUrl,
        },
        visibility: (payload.visibility as Event['visibility']) ?? 'PUBLIC',
        status: 'ACTIVE',
        category: (payload.category as Event['category']) ?? 'OTHER',
        genderFilter: (payload.genderFilter as Event['genderFilter']) ?? 'MIXED',
        maxAttendees: payload.maxAttendees ? Number(payload.maxAttendees) : null,
        memberCount: 1,
        rules: Array.isArray(payload.rules) ? (payload.rules as string[]) : [],
        scheduledAt: String(payload.scheduledAt ?? new Date(Date.now() + 86_400_000).toISOString()),
        endsAt: (payload.endsAt as string | null) ?? null,
        locationName: (payload.locationName as string | null) ?? null,
        locationLat: payload.location ? Number((payload.location as { lat: number }).lat) : null,
        locationLng: payload.location ? Number((payload.location as { lng: number }).lng) : null,
        hasRoute: Boolean(payload.routePolyline),
        coverImage: (payload.coverImage as string | null) ?? null,
        chatExpiresAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
        inviteCode: `DM${String(db.nextId.event).padStart(4, '0')}`,
        myMembership: { role: 'ORGANIZER', status: 'APPROVED' },
        createdAt: nowIso,
      };
      db.events.unshift(created);
      db.eventMembers[id] = [
        {
          userId: db.me.id,
          user: { id: db.me.id, displayName: db.me.displayName, avatarUrl: db.me.avatarUrl },
          role: 'ORGANIZER',
          joinedAt: nowIso,
        },
      ];
      db.roomHistory[id] = [];
      return ok(clone(created));
    }

    const eventId = seg[1];
    const event = db.events.find((e) => e.id === eventId);
    if (!event) throw new MockApiError(404, 'الفعالية غير موجودة', 'EVENT_NOT_FOUND');

    if (seg.length === 2 && method === 'GET') return ok(clone(event));

    if (method === 'POST' && seg[2] === 'join') {
      const restricted = event.visibility === 'RESTRICTED';
      event.myMembership = { role: 'MEMBER', status: restricted ? 'PENDING' : 'APPROVED' };
      return ok({
        membership: clone(event.myMembership),
        message: restricted ? 'تم إرسال طلب الانضمام للمنظّم' : 'تم الانضمام للفعالية',
      });
    }

    if (method === 'DELETE' && seg[2] === 'leave') {
      event.myMembership = null;
      event.memberCount = Math.max(1, event.memberCount - 1);
      const rows = db.eventMembers[eventId] ?? [];
      db.eventMembers[eventId] = rows.filter((m) => m.userId !== DEMO_ME_ID);
      return ok({ message: 'تم مغادرة الفعالية', penaltyApplied: false });
    }

    if (method === 'GET' && seg[2] === 'members' && seg[3] === 'pending') {
      return ok(clone(db.pendingMembers[eventId] ?? []));
    }

    if (method === 'GET' && seg[2] === 'members') {
      return ok(clone(db.eventMembers[eventId] ?? []));
    }

    if (method === 'PATCH' && seg[2] === 'members' && seg[4] === 'approve') {
      const userId = seg[3];
      const rows: EventMember[] = db.eventMembers[eventId] ?? [];
      const approved = (db.pendingMembers[eventId] ?? []).find((p) => p.userId === userId);
      if (approved) {
        rows.push({
          userId,
          user: { id: userId, displayName: approved.user.displayName, avatarUrl: approved.user.avatarUrl },
          role: 'MEMBER',
          joinedAt: new Date().toISOString(),
        });
        db.eventMembers[eventId] = rows;
        db.pendingMembers[eventId] = (db.pendingMembers[eventId] ?? []).filter((p) => p.userId !== userId);
        event.memberCount += 1;
      }
      return ok({ approved: true });
    }

    if (method === 'PATCH' && seg[2] === 'cancel') {
      event.status = 'CANCELLED';
      return ok(clone(event));
    }

    if (method === 'GET' && seg[2] === 'qr-token') {
      return ok({ token: `WEMEET-DEMO-${eventId}-${db.me.id}`, expiresIn: 900 });
    }
  }

  // ── FRIENDSHIPS ────────────────────────────────────────────────────────────
  if (seg[0] === 'friendships') {
    if (method === 'GET' && seg.length === 1) {
      return ok(clone(db.friends), paginate(db.friends.length, num(query.page, 1), 20));
    }
    if (method === 'GET' && seg[1] === 'pending') {
      return ok({ received: clone(db.pendingFriends), sent: [] });
    }
    if (method === 'POST' && seg[2] === 'request') {
      return ok({ requested: seg[1] });
    }
    if (method === 'PATCH' && seg[2] === 'respond') {
      const id = seg[1];
      const request = db.pendingFriends.find((r) => r.id === id);
      if (request && payload.action === 'accept') {
        db.friends.push({ id: `fr-${request.from.id}`, friend: request.from, since: new Date().toISOString() });
      }
      db.pendingFriends = db.pendingFriends.filter((r) => r.id !== id);
      return ok({ id, action: payload.action });
    }
    if (method === 'POST' && seg[2] === 'block') return ok({ blocked: seg[1] });
    if (method === 'DELETE') {
      db.friends = db.friends.filter((f) => f.friend.id !== seg[1]);
      return ok(undefined);
    }
  }

  // ── MESSAGES ───────────────────────────────────────────────────────────────
  if (seg[0] === 'messages') {
    const unread = () =>
      Object.values(db.conversations)
        .flat()
        .filter((m) => m.readAt === null && m.senderId !== DEMO_ME_ID).length;

    if (method === 'GET' && seg[1] === 'unread-count') {
      return ok({ count: unread() });
    }

    if (method === 'GET' && seg.length === 1) {
      const inbox = Object.entries(db.conversations).map(([partnerId, msgs]) => {
        const partner = findUser(partnerId);
        const last = msgs[msgs.length - 1];
        return {
          partner: {
            id: partnerId,
            displayName: partner?.displayName ?? partnerId,
            avatarUrl: partner?.avatarUrl ?? null,
          },
          lastMessage: {
            content: last?.content ?? '',
            senderId: last?.senderId ?? partnerId,
            createdAt: last?.createdAt ?? new Date().toISOString(),
            isRead: last?.readAt !== null,
          },
        };
      });
      return ok(clone(inbox));
    }

    const partnerId = seg[1];
    if (partnerId) {
      const partner = findUser(partnerId);
      const msgs = db.conversations[partnerId] ?? (db.conversations[partnerId] = []);
      if (method === 'GET') {
        msgs.forEach((m) => {
          if (m.senderId !== DEMO_ME_ID) m.readAt = m.readAt ?? new Date().toISOString();
        });
        return ok(
          {
            with: {
              id: partnerId,
              displayName: partner?.displayName ?? partnerId,
              avatarUrl: partner?.avatarUrl ?? null,
            },
            items: clone(msgs),
          },
          paginate(msgs.length, num(query.page, 1), 50),
        );
      }
      if (method === 'POST') {
        const message: DirectMessage = {
          id: `dm-${db.nextId.message++}`,
          senderId: DEMO_ME_ID,
          content: String(payload.content ?? '').slice(0, 2000),
          readAt: null,
          createdAt: new Date().toISOString(),
        };
        msgs.push(message);
        return ok(clone(message));
      }
    }
  }

  // ── RED FLAGS ──────────────────────────────────────────────────────────────
  if (seg[0] === 'red-flags') {
    if (method === 'GET' && seg[1] === 'me') return ok(redFlagScore(db.me.stats.redFlagCount));
    if (method === 'POST' && seg[1] === 'report') {
      return ok({ report: { id: `rp-${Date.now()}`, reportedId: seg[2] }, message: 'تم إرسال البلاغ' });
    }
  }

  // ── NOTIFICATIONS ──────────────────────────────────────────────────────────
  if (seg[0] === 'notifications') {
    if (method === 'GET' && seg.length === 1) {
      const limit = num(query.limit, 30);
      const page = num(query.page, 1);
      const start = (page - 1) * limit;
      const items = db.notifications.slice(start, start + limit);
      return ok({ items: clone(items), total: db.notifications.length }, paginate(db.notifications.length, page, limit));
    }
    if (method === 'PATCH' && seg[1] === 'read') {
      const id = payload.id ? String(payload.id) : null;
      const nowIso = new Date().toISOString();
      db.notifications = db.notifications.map((n) =>
        (id ? n.id === id : true) ? { ...n, readAt: n.readAt ?? nowIso } : n,
      );
      return ok({ updated: id ?? 'all' });
    }
    if (method === 'GET' && seg[1] === 'push' && seg[2] === 'vapid-public-key') {
      // Web-push is deliberately disabled in the demo: no VAPID key is served
      // and no subscription is ever created or transmitted.
      return ok({ key: null });
    }
    if (method === 'POST' && seg[1] === 'push' && seg[2] === 'web') {
      return ok({ disabled: true });
    }
  }

  // ── ADMIN ──────────────────────────────────────────────────────────────────
  if (seg[0] === 'admin') {
    if (method === 'GET' && seg[1] === 'stats') return ok(clone(db.adminStats));
    if (method === 'GET' && seg[1] === 'users') {
      const q = String(query.q ?? '').trim();
      const items = db.adminUsers.filter((u) => !q || u.displayName.includes(q) || u.phone.includes(q));
      return ok({ items: clone(items) });
    }
    if (method === 'GET' && seg[1] === 'reports') {
      const items = db.adminReports.filter((r) => (query.unresolved === 'true' ? r.resolvedAt === null : true));
      return ok({ items: clone(items) });
    }
    if (method === 'PATCH' && seg[1] === 'users' && seg[3] === 'ban') {
      const banned = Boolean(payload.banned);
      db.adminUsers = db.adminUsers.map((u) => (u.id === seg[2] ? { ...u, isBanned: banned } : u));
      return ok({ id: seg[2], isBanned: banned });
    }
    if (method === 'PATCH' && seg[1] === 'reports' && seg[3] === 'resolve') {
      db.adminReports = db.adminReports.map((r) =>
        r.id === seg[2] ? { ...r, resolvedAt: new Date().toISOString() } : r,
      );
      return ok({ id: seg[2], resolved: true });
    }
  }

  // ── GAMING ─────────────────────────────────────────────────────────────────
  if (seg[0] === 'gaming') {
    if (method === 'GET' && seg[1] === 'tournaments' && seg.length === 2) {
      return ok({ items: clone(db.tournaments) });
    }
    if (method === 'POST' && seg[1] === 'tournaments' && seg.length === 2) {
      const id = `tny-${db.nextId.event++}`;
      db.tournaments.unshift({
        id,
        title: String(payload.title ?? 'بطولة جديدة'),
        game: String(payload.game ?? 'Game'),
        status: 'PENDING',
        maxParticipants: Number(payload.maxParticipants ?? 8),
        startsAt: (payload.startsAt as string | null) ?? null,
        prizePool: (payload.prizePool as string | null) ?? null,
        organizer: { id: db.me.id, displayName: db.me.displayName, avatarUrl: db.me.avatarUrl },
        _count: { participants: 0 },
      });
      return ok({ id });
    }
    if (method === 'GET' && seg[1] === 'tournaments' && seg[2]) {
      const detail = db.tournamentDetails[seg[2]];
      if (!detail) throw new MockApiError(404, 'البطولة غير موجودة', 'TOURNAMENT_NOT_FOUND');
      return ok(clone(detail));
    }
    if (method === 'POST' && seg[1] === 'tournaments' && seg[3] === 'join') {
      const detail = db.tournamentDetails[seg[2]];
      if (detail) {
        detail.participants.push({
          user: { id: db.me.id, displayName: db.me.displayName, avatarUrl: db.me.avatarUrl },
        });
        detail._count.participants = detail.participants.length;
      }
      return ok({ joined: seg[2] });
    }
    if (method === 'POST' && seg[1] === 'tournaments' && seg[3] === 'brackets') {
      const detail = db.tournamentDetails[seg[2]];
      return ok(detail ? clone(detail.brackets) : []);
    }
    if (method === 'POST' && seg[1] === 'matches' && seg[3] === 'start') {
      const detail = db.tournamentDetails['tny-1'];
      detail?.brackets.forEach((b) =>
        b.matches.forEach((m) => {
          if (m.id === seg[2]) m.status = 'PLAYING';
        }),
      );
      return ok({ id: seg[2], status: 'PLAYING' });
    }
    if (method === 'POST' && seg[1] === 'matches' && seg[3] === 'result') {
      const detail = db.tournamentDetails['tny-1'];
      detail?.brackets.forEach((b) =>
        b.matches.forEach((m) => {
          if (m.id === seg[2]) {
            m.status = 'FINISHED';
            m.score1 = String(payload.score1 ?? m.score1 ?? '0');
            m.score2 = String(payload.score2 ?? m.score2 ?? '0');
            m.winner = m.player1;
          }
        }),
      );
      return ok({ id: seg[2], status: 'FINISHED' });
    }
    if (method === 'GET' && seg[1] === 'venues' && seg.length === 2) {
      return ok({ items: clone(db.venues) });
    }
    if (method === 'GET' && seg[1] === 'venues' && seg[2]) {
      const detail = db.venueDetails[seg[2]];
      if (!detail) throw new MockApiError(404, 'الصالة غير موجودة', 'VENUE_NOT_FOUND');
      return ok(clone(detail));
    }
    if (method === 'POST' && seg[1] === 'venues' && seg[3] === 'bookings') {
      return ok({ booked: true, venueId: seg[2] });
    }
  }

  throw notFound(method, path);
}

/**
 * web/src/lib/socket/index.ts
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEMO REALTIME — replaces the production Socket.IO client.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The production app opened a Socket.IO connection to the private backend
 * (`NEXT_PUBLIC_WS_URL`, path `/ws`) for group-chat rooms and live DM
 * notifications.
 *
 * This module exposes the identical `socketManager` API — `connect()`,
 * `disconnect()`, `getSocket()`, `isConnected()`, `updateAuth()` — and an
 * object with `on` / `off` / `emit` / `connected`, so `useChat`,
 * `useNotifications` and `Providers` keep working unmodified.
 *
 * What actually happens now: the "server" is this file. Joining a room returns
 * the local demo history and members, sending a message is acknowledged locally
 * and answered with a canned reply from a fictional participant after a short
 * delay. Nothing is transmitted anywhere.
 */

import { db, roomMembers, CANNED_ROOM_REPLIES, DEMO_ME_ID } from '@/lib/mock/data';
import type { ChatMessage, RoomMember } from '@/types';

// ─── Event types (same names as the production socket contract) ──────────────

export interface RoomJoinedPayload {
  eventId: string;
  eventTitle: string;
  expiresAt: string;
  members: RoomMember[];
  history: ChatMessage[];
}

export interface ServerToClientEvents {
  'room:joined':       (p: RoomJoinedPayload) => void;
  'room:left':         (p: { eventId: string }) => void;
  'room:expired':      (p: { eventId: string; reason: string }) => void;
  'room:member_join':  (p: RoomMember & { eventId?: string }) => void;
  'room:member_left':  (p: { eventId: string; userId: string; displayName: string }) => void;
  'msg:received':      (p: ChatMessage) => void;
  'msg:typing':        (p: { eventId: string; userId: string; displayName: string; isTyping: boolean }) => void;
  'msg:ack':           (p: { localId: string; serverMsgId: string; createdAt: string }) => void;
  'error':             (p: { code: string; message: string }) => void;
  'pong':              (p: { ts: number }) => void;
  'connect':           () => void;
  'disconnect':        (reason: string) => void;
}

export interface ClientToServerEvents {
  'room:join':   (p: { eventId: string }) => void;
  'room:leave':  (p: { eventId: string }) => void;
  'msg:send':    (p: { eventId: string; content: string; localId: string }) => void;
  'msg:typing':  (p: { eventId: string; isTyping: boolean }) => void;
  'ping':        () => void;
}

type Handler = (payload: never) => void;

/**
 * `useChat` / `useNotifications` call the socket with the *production*
 * Socket.IO signatures (`on('msg:received', (msg) => …)`,
 * `emit('msg:send', { … })`). These mapped types reproduce those signatures so
 * the hooks compile and stay type-safe without socket.io-client installed.
 */
type ServerHandler<E extends keyof ServerToClientEvents> = ServerToClientEvents[E];
type EmitArgs<E extends keyof ClientToServerEvents> = Parameters<ClientToServerEvents[E]>;

let replyCursor = 0;
let messageSeq = 0;

// ─── Local socket ────────────────────────────────────────────────────────────

class DemoRealtimeSocket {
  connected = false;
  id = 'demo-socket';
  auth: { token: string | null } = { token: null };

  private listeners = new Map<string, Set<Handler>>();
  private timers = new Set<ReturnType<typeof setTimeout>>();

  // ── emitter plumbing ─────────────────────────────────────────────
  on<E extends keyof ServerToClientEvents>(event: E, handler: ServerHandler<E>): this {
    const set = this.listeners.get(event) ?? new Set<Handler>();
    set.add(handler as unknown as Handler);
    this.listeners.set(event, set);
    return this;
  }

  off<E extends keyof ServerToClientEvents>(event: E, handler?: ServerHandler<E>): this {
    if (!handler) {
      this.listeners.delete(event);
      return this;
    }
    this.listeners.get(event)?.delete(handler as unknown as Handler);
    return this;
  }

  private fire(event: keyof ServerToClientEvents, payload?: unknown): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.forEach((handler) => {
      try {
        (handler as unknown as (p: unknown) => void)(payload);
      } catch (err) {
        console.warn(`[demo-socket] listener for "${String(event)}" threw:`, err);
      }
    });
  }

  private later(fn: () => void, ms: number): void {
    const t = setTimeout(() => { this.timers.delete(t); fn(); }, ms);
    this.timers.add(t);
  }

  private cancelTimers(): void {
    this.timers.forEach(clearTimeout);
    this.timers.clear();
  }

  // ── client → "server" ────────────────────────────────────────────
  emit<E extends keyof ClientToServerEvents>(event: E, ...args: EmitArgs<E>): void {
    const payload = args[0];
    switch (event) {
      case 'room:join': {
        const { eventId } = payload as unknown as { eventId: string };
        this.later(() => this.fire('room:joined', this.buildRoom(eventId)), 320);
        break;
      }
      case 'room:leave': {
        const { eventId } = payload as unknown as { eventId: string };
        this.fire('room:left', { eventId });
        break;
      }
      case 'msg:send': {
        const { eventId, content, localId } = payload as unknown as {
          eventId: string; content: string; localId: string;
        };
        const createdAt = new Date().toISOString();
        const serverMsgId = `cm-demo-${++messageSeq}`;

        const message: ChatMessage = {
          id: serverMsgId,
          eventId,
          senderId: DEMO_ME_ID,
          displayName: db.me.displayName,
          avatarUrl: db.me.avatarUrl,
          content,
          createdAt,
        };
        (db.roomHistory[eventId] ?? (db.roomHistory[eventId] = [])).push(message);

        this.later(() => this.fire('msg:ack', { localId, serverMsgId, createdAt }), 260);

        // A fictional participant answers, so the room feels alive.
        const others = roomMembers(eventId).filter((m) => m.userId !== DEMO_ME_ID);
        if (others.length > 0) {
          const responder = others[replyCursor % others.length];
          replyCursor += 1;

          this.later(() => {
            this.fire('msg:typing', {
              eventId,
              userId: responder.userId,
              displayName: responder.displayName,
              isTyping: true,
            });
          }, 700);

          this.later(() => {
            this.fire('msg:typing', {
              eventId,
              userId: responder.userId,
              displayName: responder.displayName,
              isTyping: false,
            });
            const reply: ChatMessage = {
              id: `cm-demo-${++messageSeq}`,
              eventId,
              senderId: responder.userId,
              displayName: responder.displayName,
              avatarUrl: responder.avatarUrl,
              content: CANNED_ROOM_REPLIES[replyCursor % CANNED_ROOM_REPLIES.length],
              createdAt: new Date().toISOString(),
            };
            (db.roomHistory[eventId] ?? (db.roomHistory[eventId] = [])).push(reply);
            this.fire('msg:received', reply);
          }, 1800);
        }
        break;
      }
      case 'msg:typing':
        break;
      case 'ping':
        this.fire('pong', { ts: Date.now() });
        break;
      default:
        break;
    }
  }

  private buildRoom(eventId: string): RoomJoinedPayload {
    const event = db.events.find((e) => e.id === eventId);
    return {
      eventId,
      eventTitle: event?.title ?? 'دردشة الفعالية',
      expiresAt: event?.chatExpiresAt ?? new Date(Date.now() + 86_400_000).toISOString(),
      members: roomMembers(eventId),
      history: db.roomHistory[eventId] ?? [],
    };
  }

  // ── connection lifecycle ─────────────────────────────────────────
  open(): void {
    if (this.connected) return;
    this.connected = true;
    this.later(() => this.fire('connect'), 0);
  }

  close(): void {
    if (!this.connected) return;
    this.connected = false;
    this.cancelTimers();
    this.listeners.clear();
    this.fire('disconnect', 'io client disconnect');
  }

  dispose(): void {
    this.cancelTimers();
    this.listeners.clear();
    this.connected = false;
  }
}

// ─── Manager (same surface as production) ────────────────────────────────────

class SocketManager {
  private socket: DemoRealtimeSocket | null = null;

  connect(): DemoRealtimeSocket {
    if (!this.socket) this.socket = new DemoRealtimeSocket();
    this.socket.open();
    return this.socket;
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
  }

  getSocket(): DemoRealtimeSocket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  updateAuth(): void {
    // No credentials are involved in the demo.
  }
}

export const socketManager = new SocketManager();

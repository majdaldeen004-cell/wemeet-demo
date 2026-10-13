import { apiGet, apiPost, apiPatch, apiDelete } from './client';
import type {
  User, AuthTokens, Event, EventMember, CreateEventInput,
  EventFilters, RedFlagScore, Friend, DirectMessage, PaginationMeta,
} from '@/types';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  sendOtp: (phone: string) =>
    apiPost<{ isNewUser: boolean; devCode?: string }>('/auth/send-otp', { phone }),

  verifyOtp: (phone: string, code: string) =>
    apiPost<{
      isNewUser: boolean;
      tokens?: AuthTokens;
      user?: User;
      setupToken?: string;
    }>('/auth/verify-otp', { phone, code }),

  completeProfile: (setupToken: string, data: {
    displayName: string;
    birthDate: string;
    gender: string;
    bio?: string;
  }) => apiPost<{ tokens: AuthTokens; user: User }>('/auth/complete-profile', { setupToken, ...data }),

  refresh: () =>
    apiPost<{ tokens: AuthTokens }>('/auth/refresh', {}),

  logout: (refreshToken: string) =>
    apiPost<void>('/auth/logout', { refreshToken }),
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersApi = {
  getMe: () =>
    apiGet<User & { stats: { eventsOrganized: number; eventsJoined: number; friends: number; redFlagCount: number } }>('/users/me'),

  updateMe: (data: { displayName?: string; bio?: string; gender?: string }) =>
    apiPatch<User>('/users/me', data),

  // Avatar upload is handled via raw multipart POST (see profile/page.tsx).
  // The helper below exists so other parts of the codebase can reference it
  // consistently without importing apiClient directly.
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    // Use the raw fetch wrapper so we can set multipart headers properly.
    return apiPost<{ avatarUrl: string }>('/users/me/avatar', form as unknown as Record<string, unknown>);
  },

  getUserById: (userId: string) =>
    apiGet<User & { friendship: { id: string; status: string; isMine: boolean } | null }>(`/users/${userId}`),

  getMyRedFlags: () =>
    apiGet<RedFlagScore>('/users/me/red-flags'),

  search: (q: string, page = 1) =>
    apiGet<{ items: User[]; meta: PaginationMeta }>('/users', { q, page }),
};

// ─── Events ───────────────────────────────────────────────────────────────────

export const eventsApi = {
  list: (filters?: EventFilters) =>
    apiGet<{ items: Event[]; meta: PaginationMeta }>('/events', {
      ...filters,
      upcoming: filters?.upcoming ?? true,
    }),

  getById: (eventId: string) =>
    apiGet<Event>(`/events/${eventId}`),

  create: (data: CreateEventInput) =>
    apiPost<Event>('/events', data),

  join: (eventId: string, inviteCode?: string) =>
    apiPost<{ membership: object; message: string }>(`/events/${eventId}/join`, inviteCode ? { inviteCode } : {}),

  leave: (eventId: string) =>
    apiDelete<{ message: string; penaltyApplied: boolean }>(`/events/${eventId}/leave`),

  getMembers: (eventId: string) =>
    apiGet<EventMember[]>(`/events/${eventId}/members`),

  /** Organizer-only: fetch PENDING membership requests */
  getPendingMembers: (eventId: string) =>
    apiGet<{ userId: string; user: { displayName: string; avatarUrl: string | null }; requestedAt: string }[]>(
      `/events/${eventId}/members/pending`,
    ),

  /** Organizer-only: approve a PENDING member */
  approveMember: (eventId: string, userId: string) =>
    apiPatch<object>(`/events/${eventId}/members/${userId}/approve`),

  cancel: (eventId: string) =>
    apiPatch<Event>(`/events/${eventId}/cancel`),

  generateQrToken: (eventId: string) =>
    apiGet<{ token: string; expiresIn: number }>(`/events/${eventId}/qr-token`),
};

// ─── Friends ──────────────────────────────────────────────────────────────────

export const friendsApi = {
  list: (page = 1) =>
    apiGet<{ items: Friend[]; meta: PaginationMeta }>('/friendships', { page }),

  pending: () =>
    apiGet<{ received: object[]; sent: object[] }>('/friendships/pending'),

  sendRequest: (userId: string) =>
    apiPost<object>(`/friendships/${userId}/request`),

  respond: (friendshipId: string, action: 'accept' | 'decline') =>
    apiPatch<object>(`/friendships/${friendshipId}/respond`, { action }),

  block: (userId: string) =>
    apiPost<void>(`/friendships/${userId}/block`),

  remove: (userId: string) =>
    apiDelete(`/friendships/${userId}`),
};

// ─── Messages ─────────────────────────────────────────────────────────────────

export const messagesApi = {
  inbox: () =>
    apiGet<{ partner: object; lastMessage: object }[]>('/messages'),

  conversation: (userId: string, page = 1) =>
    apiGet<{ with: object; items: DirectMessage[]; meta: PaginationMeta }>(`/messages/${userId}`, { page }),

  send: (userId: string, content: string) =>
    apiPost<DirectMessage>(`/messages/${userId}`, { content }),

  unreadCount: () =>
    apiGet<{ count: number }>('/messages/unread-count'),
};

// ─── Red Flags ────────────────────────────────────────────────────────────────

export const redFlagsApi = {
  myScore: () =>
    apiGet<RedFlagScore>('/red-flags/me'),

  /** Report a user. Bound to POST /red-flags/report/:userId */
  report: (userId: string, reason: string, context?: string) =>
    apiPost<{ report: object; message: string }>(`/red-flags/report/${userId}`, { reason, context }),
};

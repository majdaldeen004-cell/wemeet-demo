// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  phone: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  gender: Gender;
  isVerified: boolean;
  isAdmin: boolean;
  status: UserStatus;
  createdAt: string;
  stats?: UserStats;
}

export interface UserStats {
  eventsOrganized: number;
  eventsJoined: number;
  friends: number;
  redFlagCount: number;
}

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export interface Event {
  id: string;
  title: string;
  description: string | null;
  organizer: PublicUser;
  visibility: EventVisibility;
  status: EventStatus;
  category: EventCategory;
  genderFilter: EventGenderFilter;
  maxAttendees: number | null;
  memberCount: number;
  rules: string[];
  scheduledAt: string;
  endsAt: string | null;
  locationName: string | null;
  locationLat: number | null;
  locationLng: number | null;
  hasRoute: boolean;
  coverImage: string | null;
  chatExpiresAt: string | null;
  inviteCode?: string;
  myMembership?: MembershipInfo | null;
  createdAt: string;
}

export type EventVisibility  = 'PUBLIC' | 'RESTRICTED' | 'PRIVATE';
export type EventStatus      = 'DRAFT' | 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
export type EventCategory    = 'CYCLING' | 'OUTDOOR' | 'STUDY' | 'GAMING' | 'PETS' | 'SOCIAL' | 'SPORTS' | 'OTHER';
export type EventGenderFilter= 'MALES_ONLY' | 'FEMALES_ONLY' | 'MIXED';

export interface MembershipInfo {
  role: 'ORGANIZER' | 'MEMBER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REMOVED' | 'LEFT';
}

export interface EventMember {
  userId: string;
  user: PublicUser;
  role: 'ORGANIZER' | 'MEMBER';
  joinedAt: string | null;
}

export interface PublicUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified?: boolean;
}

// ─── Create Event ─────────────────────────────────────────────────────────────

export interface CreateEventInput {
  title: string;
  description?: string;
  visibility: EventVisibility;
  category: EventCategory;
  genderFilter: EventGenderFilter;
  maxAttendees?: number;
  rules: string[];
  scheduledAt: string;
  endsAt?: string;
  locationName?: string;
  location?: { lat: number; lng: number };
  routePolyline?: string;
  coverImage?: string;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  eventId: string;
  senderId: string;
  displayName: string;
  avatarUrl: string | null;
  content: string;
  createdAt: string;
  localId?: string;
  pending?: boolean;
}

export interface RoomMember {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: 'organizer' | 'member';
  joinedAt: string;
}

// ─── Red Flags ────────────────────────────────────────────────────────────────

export interface RedFlagScore {
  total: number;
  status: UserStatus;
  warnThreshold: number;
  banThreshold: number;
  breakdown: { reason: string; count: number }[];
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string; details?: unknown };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface EventFilters {
  category?: EventCategory;
  genderFilter?: EventGenderFilter;
  upcoming?: boolean;
  page?: number;
  limit?: number;
}

// ─── Friendship ───────────────────────────────────────────────────────────────

export interface Friend {
  id: string;
  friend: PublicUser;
  since: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

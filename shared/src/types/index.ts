// ─── Enums (mirror Prisma enums for client use) ───────────────────────────────

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export enum EventVisibility {
  PUBLIC = 'PUBLIC',
  RESTRICTED = 'RESTRICTED',
  PRIVATE = 'PRIVATE',
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum EventGenderFilter {
  MALES_ONLY = 'MALES_ONLY',
  FEMALES_ONLY = 'FEMALES_ONLY',
  MIXED = 'MIXED',
}

export enum EventCategory {
  CYCLING = 'CYCLING',
  OUTDOOR = 'OUTDOOR',
  STUDY = 'STUDY',
  GAMING = 'GAMING',
  PETS = 'PETS',
  SOCIAL = 'SOCIAL',
  SPORTS = 'SPORTS',
  OTHER = 'OTHER',
}

export enum MembershipRole {
  ORGANIZER = 'ORGANIZER',
  MEMBER = 'MEMBER',
}

export enum MembershipStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REMOVED = 'REMOVED',
  LEFT = 'LEFT',
}

export enum RedFlagReason {
  NO_SHOW = 'NO_SHOW',
  RULE_VIOLATION = 'RULE_VIOLATION',
  TOXIC_BEHAVIOR = 'TOXIC_BEHAVIOR',
  HARASSMENT = 'HARASSMENT',
  SPAM = 'SPAM',
  OTHER = 'OTHER',
}

export enum FriendshipStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  BLOCKED = 'BLOCKED',
}

// ─── Domain DTOs ──────────────────────────────────────────────────────────────

export interface UserDto {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  gender: Gender;
  isVerified: boolean;
  status: UserStatus;
  createdAt: string;
}

export interface EventDto {
  id: string;
  title: string;
  description: string | null;
  organizer: Pick<UserDto, 'id' | 'displayName' | 'avatarUrl'>;
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
  createdAt: string;
}

export interface MembershipDto {
  id: string;
  user: Pick<UserDto, 'id' | 'displayName' | 'avatarUrl'>;
  role: MembershipRole;
  status: MembershipStatus;
  joinedAt: string | null;
}

export interface DirectMessageDto {
  id: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

export interface FriendshipDto {
  id: string;
  user: Pick<UserDto, 'id' | 'displayName' | 'avatarUrl'>;
  status: FriendshipStatus;
  createdAt: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: { path: string; message: string }[];
  };
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

// ─── Auth ─────────────────────────────────────────────────────────────────────

/** Canonical authenticated-user shape used by all clients. */
export interface UserStats {
  eventsOrganized: number;
  eventsJoined: number;
  friends: number;
  redFlagCount: number;
}

export type AuthUser = UserDto & { phone: string; stats?: UserStats };

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ─── Gaming Hub ───────────────────────────────────────────────────────────────

export type GamingMatchStatus = 'SCHEDULED' | 'PLAYING' | 'FINISHED' | 'BYE';
export type TournamentStatus  = 'PENDING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export interface GamingPlayer {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

/** score1 / score2 are free-text strings ("2-1", "16-14") — never number */
export interface GamingMatch {
  id: string;
  round: number;
  position: number;
  status: GamingMatchStatus;
  player1: GamingPlayer | null;
  player2: GamingPlayer | null;
  winner:  GamingPlayer | null;
  score1:  string | null;
  score2:  string | null;
}

export interface GamingBracket {
  id: string;
  totalRounds: number;
  totalSlots: number;
  matches: GamingMatch[];
}

export interface TournamentSummary {
  id: string;
  title: string;
  game: string;
  status: TournamentStatus;
  maxParticipants: number;
  startsAt: string | null;
  prizePool: string | null;
  organizer: GamingPlayer;
  _count?: { participants: number };
}

export interface TournamentDetail extends TournamentSummary {
  participants: { user: GamingPlayer }[];
  brackets: GamingBracket[];
  _count: { participants: number };
}

export interface VenueSummary {
  id: string;
  name: string;
  address: string | null;
  stationCount: number;
  pricePerHour: string;
  currency: string;
  amenities: string[];
}

/** A single existing reservation window, returned alongside venue detail so
 *  clients can render/disable already-booked time slots. */
export interface VenueBookingSlot {
  startTime: string;
  endTime: string;
  stationsBooked: number;
}

export interface VenueDetail extends VenueSummary {
  description: string | null;
  openTime: string | null;
  closeTime: string | null;
  owner: GamingPlayer;
  bookings: VenueBookingSlot[];
}

// ─── Notification Preferences ─────────────────────────────────────────────────

export interface NotificationPreferences {
  id:             string;
  userId:         string;
  eventInvite:    boolean;
  eventUpdate:    boolean;
  eventStarting:  boolean;
  friendRequest:  boolean;
  friendAccepted: boolean;
  newMessage:     boolean;
  redFlag:        boolean;
  marketing:      boolean;
  createdAt:      string;
  updatedAt:      string;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminStats {
  users: {
    total:        number;
    newToday:     number;
    newThisWeek:  number;
    newThisMonth: number;
    banned:       number;
  };
  events: {
    total:     number;
    active:    number;
    cancelled: number;
  };
  messages: { total: number };
  reports:  { total: number; unresolved: number };
  redFlags: Array<{ reason: string; count: number }>;
}

export interface AdminUser {
  id:           string;
  phone:        string;
  displayName:  string;
  avatarUrl:    string | null;
  isVerified:   boolean;
  isBanned:     boolean;
  isAdmin:      boolean;
  redFlagCount: number;
  createdAt:    string;
  _count: { organizedEvents: number; memberships: number };
}

export interface AdminReport {
  id:          string;
  reason:      string;
  description: string | null;
  createdAt:   string;
  resolvedAt:  string | null;
  filer:    { id: string; displayName: string };
  reported: { id: string; displayName: string; redFlagCount: number; isBanned: boolean };
}

// ─── Notification Preferences ─────────────────────────────────────────────────

export interface NotificationPreferences {
  id:             string;
  userId:         string;
  eventInvite:    boolean;
  eventUpdate:    boolean;
  eventStarting:  boolean;
  friendRequest:  boolean;
  friendAccepted: boolean;
  newMessage:     boolean;
  redFlag:        boolean;
  marketing:      boolean;
  createdAt:      string;
  updatedAt:      string;
}

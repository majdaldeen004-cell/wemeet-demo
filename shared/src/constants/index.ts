// ─── Red Flag Thresholds ──────────────────────────────────────────────────────

export const RED_FLAG_LIMITS = {
  WARN_THRESHOLD: 3,
  BAN_THRESHOLD: 5,
  CANCELLATION_WINDOW_HOURS: 12,
} as const;

// ─── Event Constraints ────────────────────────────────────────────────────────

export const EVENT_LIMITS = {
  MAX_ATTENDEES_CAP: 500,
  MIN_SCHEDULE_MINUTES_AHEAD: 60,
  MAX_RULES: 10,
  INVITE_CODE_LENGTH: 8,
  CHAT_EXPIRY_AFTER_EVENT_HOURS: 24,
} as const;

// ─── OTP Settings ─────────────────────────────────────────────────────────────

export const OTP_CONFIG = {
  EXPIRY_MINUTES: 5,
  MAX_ATTEMPTS: 3,
  CODE_LENGTH: 6,
  RESEND_COOLDOWN_SECONDS: 60,
} as const;

// ─── Pagination Defaults ──────────────────────────────────────────────────────

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// ─── Event Category Labels (for UI) ───────────────────────────────────────────

export const EVENT_CATEGORY_LABELS: Record<string, string> = {
  CYCLING: '🚲 Cycling',
  OUTDOOR: '🌿 Outdoor',
  STUDY: '📚 Study',
  GAMING: '🎮 Gaming',
  PETS: '🐾 Pets & Kids',
  SOCIAL: '☕ Social',
  SPORTS: '⚽ Sports',
  OTHER: '✨ Other',
} as const;

export const GENDER_FILTER_LABELS: Record<string, string> = {
  MALES_ONLY: '♂ Males only',
  FEMALES_ONLY: '♀ Females only',
  MIXED: '⚥ Mixed',
} as const;

// ─── Gaming Hub Status Colors ─────────────────────────────────────────────────

/** Canonical tournament status → hex color map. Import in all gaming UI views. */
export const TOURNAMENT_STATUS_COLOR = {
  PENDING:   '#f59e0b',
  ONGOING:   '#16a34a',
  COMPLETED: '#94a3b8',
  CANCELLED: '#ef4444',
} as const satisfies Record<string, string>;

/** Tailwind class map for web (status badge). */
export const TOURNAMENT_STATUS_STYLE = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  ONGOING:   'bg-green-100  text-green-800',
  COMPLETED: 'bg-gray-100   text-gray-600',
  CANCELLED: 'bg-red-100    text-red-700',
} as const satisfies Record<string, string>;

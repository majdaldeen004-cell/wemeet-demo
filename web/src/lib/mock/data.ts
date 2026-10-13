/**
 * web/src/lib/mock/data.ts
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEMO DATA LAYER — 100% fictional, deterministic, offline.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Every record below was written by hand for this public demo. It contains:
 *   • no real user records, phone numbers, messages or uploads
 *   • no production database content
 *   • no network dependency (avatars/covers render from generated SVG initials)
 *
 * The shape of each object matches the production API contracts declared in
 * `@/types` and `@wemeet/shared`, so the existing pages, hooks and stores are
 * reused unmodified — only the transport (see ./router.ts) is replaced.
 *
 * Timestamps are derived from "now" using fixed offsets, so the demo always
 * shows plausible upcoming/past events but stays deterministic across reloads.
 */

import { encodePolyline } from '@/lib/maps/loader';
import type {
  User, UserStats, Event, EventMember, Friend, DirectMessage,
  RedFlagScore, PaginationMeta, ChatMessage, RoomMember,
} from '@/types';
import type {
  TournamentSummary, TournamentDetail, GamingMatch, GamingBracket,
  VenueSummary, VenueDetail, VenueBookingSlot,
  NotificationPreferences as NotificationPreferencesDto,
  AdminStats, AdminUser as AdminUserDto, AdminReport as AdminReportDto,
} from '@wemeet/shared';

// ─── Time helpers (fixed offsets from now) ───────────────────────────────────

const now = () => Date.now();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const inHours = (h: number) => new Date(now() + h * HOUR).toISOString();
const inDays = (d: number) => new Date(now() + d * DAY).toISOString();

/** Damascus — the fictional demo city for all events/venues. */
export const DEMO_CENTER = { lat: 33.5138, lng: 36.2765 };

export const DEMO_MODE_NOTICE =
  'وضع العرض التجريبي — جميع البيانات وهمية وتسجيل الدخول محاكى بالكامل.';

/**
 * DEMO ONLY — simulated sign-in credentials.
 * `DEMO_PHONE` is a placeholder in a reserved-for-example numbering pattern;
 * `DEMO_OTP_CODE` is verified locally by `@/lib/mock/router` and never leaves
 * the browser. No SMS/WhatsApp provider is contacted at any point.
 */
export const DEMO_PHONE = '+963900000001';
export const DEMO_OTP_CODE = '123456';

// ─── Users (fictional) ───────────────────────────────────────────────────────

export type DemoUser = User & { stats: UserStats };

const user = (
  id: string,
  displayName: string,
  gender: User['gender'],
  bio: string,
  stats: UserStats,
  extra: Partial<User> = {},
): DemoUser => ({
  id,
  phone: `+9639${id.replace(/\D/g, '').padStart(7, '0').slice(-7)}`,
  displayName,
  avatarUrl: null,
  bio,
  gender,
  isVerified: true,
  isAdmin: false,
  status: 'ACTIVE',
  createdAt: inDays(-140),
  stats,
  ...extra,
});

export const DEMO_ME_ID = 'demo-user';

export const USERS: DemoUser[] = [
  user('demo-user', 'ياسمين حلاق', 'FEMALE', 'أحب الجري والدورات القصيرة في اللاذقية.', {
    eventsOrganized: 4, eventsJoined: 12, friends: 4, redFlagCount: 0,
  }, { isAdmin: true, phone: '+963900000001' }),
  user('usr-1001', 'عمر الشامي', 'MALE', 'مهتم بدراجات الجبال والفعاليات الصغيرة.', {
    eventsOrganized: 7, eventsJoined: 21, friends: 9, redFlagCount: 0,
  }),
  user('usr-1002', 'هبة زيتون', 'FEMALE', 'طالبة هندسة — أدرس في مجموعات صغيرة.', {
    eventsOrganized: 3, eventsJoined: 8, friends: 6, redFlagCount: 0,
  }),
  user('usr-1003', 'كنان درويش', 'MALE', 'بلاير بوردغيمز، أحب الشطرنج أكثر.', {
    eventsOrganized: 5, eventsJoined: 17, friends: 11, redFlagCount: 1,
  }),
  user('usr-1004', 'ريم قاسم', 'FEMALE', 'أتصوّر الطبيعة وأمشي كل جمعة صباحاً.', {
    eventsOrganized: 2, eventsJoined: 14, friends: 7, redFlagCount: 0,
  }),
  user('usr-1005', 'سامر خوري', 'MALE', 'مدرب لياقة ومهتم بالفعاليّات الخارجية.', {
    eventsOrganized: 6, eventsJoined: 25, friends: 13, redFlagCount: 0,
  }),
  user('usr-1006', 'لمى عنبر', 'FEMALE', 'طبّ بيطري — أنشطة الحيوانات مرحّب بها.', {
    eventsOrganized: 1, eventsJoined: 6, friends: 4, redFlagCount: 0,
  }),
  user('usr-1007', 'باسل نعمة', 'MALE', 'أحب القهوة والمحادثات الطويلة.', {
    eventsOrganized: 2, eventsJoined: 9, friends: 5, redFlagCount: 0,
  }),
  user('usr-1008', 'دانا سباعي', 'FEMALE', 'مصمّمة، وأشارك في جلسات القراءة.', {
    eventsOrganized: 3, eventsJoined: 11, friends: 8, redFlagCount: 0,
  }),
  user('usr-1009', 'رامي شعبان', 'MALE', 'لاعب تنس طاولة ومحب للتنافس.', {
    eventsOrganized: 4, eventsJoined: 19, friends: 10, redFlagCount: 2,
  }),
  user('usr-1010', 'نور الحاج', 'FEMALE', 'أهتم بالتصوير الليلي والمشي في المدينة القديمة.', {
    eventsOrganized: 1, eventsJoined: 5, friends: 3, redFlagCount: 0,
  }),
  user('usr-1011', 'فادي مرزوق', 'MALE', 'معلّق رياضي وأحب المباريات المحلية.', {
    eventsOrganized: 2, eventsJoined: 7, friends: 4, redFlagCount: 0,
  }),
  user('usr-1012', 'سلوى بركات', 'FEMALE', 'مدرّبة يوغا — جلسات هادئة صباحاً.', {
    eventsOrganized: 3, eventsJoined: 10, friends: 6, redFlagCount: 0,
  }),
];

export const ME = USERS[0];

const publics = (ids: string[]) =>
  ids.map((id) => {
    const u = USERS.find((x) => x.id === id)!;
    return { id: u.id, displayName: u.displayName, avatarUrl: u.avatarUrl };
  });

// ─── Red-flag scores ─────────────────────────────────────────────────────────

export const redFlagScore = (total: number): RedFlagScore => ({
  total,
  status: total >= 5 ? 'BANNED' : total >= 3 ? 'SUSPENDED' : 'ACTIVE',
  warnThreshold: 3,
  banThreshold: 5,
  breakdown: total === 0
    ? []
    : [
        { reason: 'NO_SHOW', count: Math.max(0, total - 1) },
        { reason: 'RULE_VIOLATION', count: Math.min(1, total) },
      ],
});

// ─── Events ──────────────────────────────────────────────────────────────────

const CYCLING_ROUTE = encodePolyline([
  [33.5138, 36.2765], [33.5360, 36.2620], [33.5620, 36.2210],
  [33.5900, 36.1780], [33.6220, 36.1350],
]);

const HIKING_ROUTE = encodePolyline([
  [33.5226, 36.2855], [33.5480, 36.3100], [33.5790, 36.3320],
  [33.6100, 36.3550], [33.6440, 36.3810],
]);

export type DemoEvent = Event & { routePolyline?: string | null };

export const EVENTS: DemoEvent[] = [
  {
    id: 'evt-1001',
    title: 'جولة دراجات صباحية على طريق الزبداني',
    description: 'مسار 32 كم داخل الطريق الريفي — مناسب للمستوى المتوسط، مع استراحة على المطل.',
    organizer: publics(['demo-user'])[0],
    visibility: 'PUBLIC', status: 'ACTIVE', category: 'CYCLING', genderFilter: 'MIXED',
    maxAttendees: 18, memberCount: 11,
    rules: ['ارتداء خوذة إلزامي', 'الالتزام بترتيب المجموعة', 'إلغاء الحجز قبل 12 ساعة'],
    scheduledAt: inDays(3), endsAt: inDays(3),
    locationName: 'ساحة الأمويين — نقطة التجمع',
    locationLat: 33.5138, locationLng: 36.2765,
    hasRoute: true, routePolyline: CYCLING_ROUTE,
    coverImage: null, chatExpiresAt: inDays(4), inviteCode: 'RIDE2026',
    myMembership: { role: 'ORGANIZER', status: 'APPROVED' },
    createdAt: inDays(-6),
  },
  {
    id: 'evt-1002',
    title: 'مشي ودردشة: طريق جبل قاسيون',
    description: 'طلعة خفيفة لمدّة ساعتين، مناسبة للمبتدئين، وبعدها فطور شعبي مختصر.',
    organizer: publics(['usr-1004'])[0],
    visibility: 'PUBLIC', status: 'ACTIVE', category: 'OUTDOOR', genderFilter: 'MIXED',
    maxAttendees: 30, memberCount: 22,
    rules: ['لا تدخين أثناء المسير', 'حذاء مريح', 'احترام الآخرين'],
    scheduledAt: inDays(2), endsAt: null,
    locationName: 'مدخل جبل قاسيون',
    locationLat: 33.5226, locationLng: 36.2855,
    hasRoute: true, routePolyline: HIKING_ROUTE,
    coverImage: null, chatExpiresAt: inDays(3),
    myMembership: { role: 'MEMBER', status: 'APPROVED' },
    createdAt: inDays(-9),
  },
  {
    id: 'evt-1003',
    title: 'مجموعة دراسة: تحليل البيانات للامتحان',
    description: 'جلسة مركّزة لثلاث ساعات مع تمارين محلولة على السبورة.',
    organizer: publics(['usr-1002'])[0],
    visibility: 'PUBLIC', status: 'ACTIVE', category: 'STUDY', genderFilter: 'MIXED',
    maxAttendees: 14, memberCount: 9,
    rules: ['إسكات الجوّال', 'احضار دفتر ملاحظات'],
    scheduledAt: inDays(1), endsAt: null,
    locationName: 'مكتبة المزة العامة',
    locationLat: 33.5020, locationLng: 36.2550,
    hasRoute: false, coverImage: null, chatExpiresAt: inDays(2),
    myMembership: { role: 'MEMBER', status: 'APPROVED' },
    createdAt: inDays(-3),
  },
  {
    id: 'evt-1004',
    title: 'بطولة بوردغيمز الصغيرة — الشطرنج والكوت',
    description: 'دوريّ سريع من ثلاث جولات، جوائز رمزية وشاي مفتوح.',
    organizer: publics(['usr-1003'])[0],
    visibility: 'RESTRICTED', status: 'ACTIVE', category: 'GAMING', genderFilter: 'MALES_ONLY',
    maxAttendees: 16, memberCount: 14,
    rules: ['احترام وقت الجولة', 'لا مساعدة خارجية'],
    scheduledAt: inDays(5), endsAt: null,
    locationName: 'مقهى الباب الشرقي',
    locationLat: 33.5150, locationLng: 36.3150,
    hasRoute: false, coverImage: null, chatExpiresAt: inDays(6),
    myMembership: { role: 'MEMBER', status: 'PENDING' },
    createdAt: inDays(-2),
  },
  {
    id: 'evt-1005',
    title: 'نزهة أصحاب الحيوانات الأليفة',
    description: 'حديقة مفتوحة للكلاب والقطط مع مساحة لعب آمنة.',
    organizer: publics(['usr-1006'])[0],
    visibility: 'PUBLIC', status: 'ACTIVE', category: 'PETS', genderFilter: 'MIXED',
    maxAttendees: 25, memberCount: 8,
    rules: ['رباط للحيوان', 'حمل شنطة نظافة'],
    scheduledAt: inDays(4), endsAt: null,
    locationName: 'حديقة تشرين',
    locationLat: 33.5280, locationLng: 36.3010,
    hasRoute: false, coverImage: null, chatExpiresAt: inDays(5),
    myMembership: null,
    createdAt: inDays(-1),
  },
  {
    id: 'evt-1006',
    title: 'مساء قهوة ومحادثة هادئة',
    description: 'طاولة صغيرة لثمانية أشخاص فقط — موضوع النقاش: أفلام هذا الشهر.',
    organizer: publics(['usr-1007'])[0],
    visibility: 'PRIVATE', status: 'ACTIVE', category: 'SOCIAL', genderFilter: 'MIXED',
    maxAttendees: 8, memberCount: 6,
    rules: ['لا حديث في السياسة', 'الموبايل على السايلنت'],
    scheduledAt: inDays(6), endsAt: null,
    locationName: 'مقهى في شارع الحمرا',
    locationLat: 33.5010, locationLng: 36.2810,
    hasRoute: false, coverImage: null, chatExpiresAt: inDays(7), inviteCode: 'COFFEE42',
    myMembership: null,
    createdAt: inHours(-20),
  },
  {
    id: 'evt-1007',
    title: 'مباراة كرة قدم 5 ضد 5',
    description: 'ملعب مصغّر مضاء — ناقص لاعبين اثنين لاستكمال الفريقين.',
    organizer: publics(['usr-1005'])[0],
    visibility: 'PUBLIC', status: 'ACTIVE', category: 'SPORTS', genderFilter: 'MALES_ONLY',
    maxAttendees: 12, memberCount: 12,
    rules: ['أحذية رياضية فقط', 'الحضور قبل 15 دقيقة'],
    scheduledAt: inHours(30), endsAt: null,
    locationName: 'ملعب المزة الرياضي',
    locationLat: 33.4995, locationLng: 36.2500,
    hasRoute: false, coverImage: null, chatExpiresAt: inDays(2),
    myMembership: null,
    createdAt: inDays(-5),
  },
  {
    id: 'evt-1008',
    title: 'جلسة يوغا في الهواء الطلق',
    description: 'جلسة صباحية لمدّة ساعة، مناسب لجميع المستويات، احضار سجّادة.',
    organizer: publics(['usr-1012'])[0],
    visibility: 'PUBLIC', status: 'COMPLETED', category: 'SPORTS', genderFilter: 'FEMALES_ONLY',
    maxAttendees: 20, memberCount: 18,
    rules: ['الوصول قبل البدء بعشر دقائق'],
    scheduledAt: inDays(-2), endsAt: inDays(-2),
    locationName: 'حديقة الجاحظ',
    locationLat: 33.5080, locationLng: 36.2900,
    hasRoute: false, coverImage: null, chatExpiresAt: inDays(-1),
    myMembership: { role: 'MEMBER', status: 'APPROVED' },
    createdAt: inDays(-12),
  },
];

// ─── Event members / pending requests ────────────────────────────────────────

const memberRow = (userId: string, role: 'ORGANIZER' | 'MEMBER', joinedAt: string | null): EventMember => ({
  userId,
  user: publics([userId])[0],
  role,
  joinedAt,
});

export const EVENT_MEMBERS: Record<string, EventMember[]> = {
  'evt-1001': [
    memberRow('demo-user', 'ORGANIZER', inDays(-6)),
    memberRow('usr-1001', 'MEMBER', inDays(-4)),
    memberRow('usr-1005', 'MEMBER', inDays(-3)),
    memberRow('usr-1009', 'MEMBER', inDays(-2)),
    memberRow('usr-1010', 'MEMBER', inDays(-1)),
  ],
  'evt-1002': [
    memberRow('usr-1004', 'ORGANIZER', inDays(-9)),
    memberRow('demo-user', 'MEMBER', inDays(-7)),
    memberRow('usr-1008', 'MEMBER', inDays(-6)),
    memberRow('usr-1010', 'MEMBER', inDays(-5)),
  ],
  'evt-1003': [
    memberRow('usr-1002', 'ORGANIZER', inDays(-3)),
    memberRow('demo-user', 'MEMBER', inDays(-2)),
    memberRow('usr-1008', 'MEMBER', inDays(-2)),
  ],
  'evt-1004': [memberRow('usr-1003', 'ORGANIZER', inDays(-2))],
  'evt-1005': [memberRow('usr-1006', 'ORGANIZER', inDays(-1))],
  'evt-1006': [memberRow('usr-1007', 'ORGANIZER', inHours(-20))],
  'evt-1007': [
    memberRow('usr-1005', 'ORGANIZER', inDays(-5)),
    memberRow('usr-1011', 'MEMBER', inDays(-4)),
  ],
  'evt-1008': [
    memberRow('usr-1012', 'ORGANIZER', inDays(-12)),
    memberRow('demo-user', 'MEMBER', inDays(-10)),
  ],
};

export type PendingMember = {
  userId: string;
  user: { displayName: string; avatarUrl: string | null };
  requestedAt: string;
};

export const PENDING_MEMBERS: Record<string, PendingMember[]> = {
  'evt-1001': [
    { userId: 'usr-1008', user: publics(['usr-1008'])[0], requestedAt: inHours(-9) },
    { userId: 'usr-1011', user: publics(['usr-1011'])[0], requestedAt: inHours(-3) },
  ],
};

// ─── Friendships ─────────────────────────────────────────────────────────────

export const FRIENDS: Friend[] = [
  { id: 'fr-2001', friend: publics(['usr-1001'])[0], since: inDays(-95) },
  { id: 'fr-2002', friend: publics(['usr-1002'])[0], since: inDays(-70) },
  { id: 'fr-2003', friend: publics(['usr-1004'])[0], since: inDays(-41) },
  { id: 'fr-2004', friend: publics(['usr-1012'])[0], since: inDays(-16) },
];

export type PendingFriendRequest = {
  id: string;
  from: { id: string; displayName: string; avatarUrl: string | null };
  at: string;
};

export const PENDING_FRIENDS: PendingFriendRequest[] = [
  { id: 'fr-3001', from: publics(['usr-1008'])[0], at: inHours(-14) },
  { id: 'fr-3002', from: publics(['usr-1010'])[0], at: inHours(-2) },
];

// ─── Direct messages ─────────────────────────────────────────────────────────

export const CONVERSATIONS: Record<string, DirectMessage[]> = {
  'usr-1001': [
    { id: 'dm-5001', senderId: 'usr-1001', content: 'مرحبا ياسمين، الجولة لسه مفتوحة؟', readAt: inHours(-26), createdAt: inHours(-27) },
    { id: 'dm-5002', senderId: DEMO_ME_ID, content: 'أهلاً عمر، أكيد — ناقصنا 3 أماكن.', readAt: inHours(-26), createdAt: inHours(-26) },
    { id: 'dm-5003', senderId: 'usr-1001', content: 'تمام، بأكد مع صاحبي وبخبرك اليوم المسا.', readAt: null, createdAt: inHours(-5) },
  ],
  'usr-1002': [
    { id: 'dm-5101', senderId: 'usr-1002', content: 'جبتلك ملخّص الفصل الثالث، مفيد جداً.', readAt: inHours(-3), createdAt: inHours(-4) },
    { id: 'dm-5102', senderId: DEMO_ME_ID, content: 'شكراً هبة! بقرأه قبل الجلسة.', readAt: inHours(-3), createdAt: inHours(-3) },
  ],
  'usr-1004': [
    { id: 'dm-5201', senderId: DEMO_ME_ID, content: 'ريم، الطلعة يوم الجمعة الساعة 7 صح؟', readAt: inHours(-9), createdAt: inHours(-10) },
    { id: 'dm-5202', senderId: 'usr-1004', content: 'نعم صباحاً 7 بالضبط، من مدخل قاسيون.', readAt: null, createdAt: inHours(-8) },
  ],
};

// ─── Group chat (event room) ─────────────────────────────────────────────────

export const ROOM_HISTORY: Record<string, ChatMessage[]> = {
  'evt-1001': [
    { id: 'cm-7001', eventId: 'evt-1001', senderId: 'usr-1005', displayName: 'سامر خوري', avatarUrl: null, content: 'مين جاهز يوم الخميس؟', createdAt: inHours(-30) },
    { id: 'cm-7002', eventId: 'evt-1001', senderId: DEMO_ME_ID, displayName: 'ياسمين حلاق', avatarUrl: null, content: 'أنا جاهزة — نلتقي عند ساحة الأمويين.', createdAt: inHours(-29) },
    { id: 'cm-7003', eventId: 'evt-1001', senderId: 'usr-1001', displayName: 'عمر الشامي', avatarUrl: null, content: 'بجيب مضخة هواء احتياطية للطريق.', createdAt: inHours(-6) },
  ],
  'evt-1002': [
    { id: 'cm-7101', eventId: 'evt-1002', senderId: 'usr-1004', displayName: 'ريم قاسم', avatarUrl: null, content: 'الطقس متوقّع صافي — نبدأ بالوقت.', createdAt: inHours(-20) },
    { id: 'cm-7102', eventId: 'evt-1002', senderId: 'usr-1008', displayName: 'دانا سباعي', avatarUrl: null, content: 'رح أجيب ماء إضافي للجميع.', createdAt: inHours(-18) },
  ],
};

export const roomMembers = (eventId: string): RoomMember[] =>
  (EVENT_MEMBERS[eventId] ?? []).map((m) => ({
    userId: m.userId,
    displayName: m.user.displayName,
    avatarUrl: m.user.avatarUrl,
    role: m.role === 'ORGANIZER' ? 'organizer' : 'member',
    joinedAt: m.joinedAt ?? inDays(-1),
  }));

/** Canned replies used by the simulated group-chat socket. */
export const CANNED_ROOM_REPLIES = [
  'وصلت! أنا قريب من نقطة التجمع.',
  'ممتاز، خلّينا نلتزم بالوقت.',
  'أنا معكم، بس متأخّر عشر دقائق.',
  'في أحد يمرّ من المزة ويقلّني؟',
  'الجو حلو اليوم، مناسبة تماماً.',
];

/** Canned replies used by the simulated DM socket. */
export const CANNED_DM_REPLIES = [
  'تمام، وصلتني الرسالة.',
  'أكيد، بسأل وأرد عليك.',
  'شكراً على التوضيح!',
  'خلّينا نأكد الوقت بالليل.',
];

// ─── Notifications ───────────────────────────────────────────────────────────

export type DemoNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export const NOTIFICATIONS: DemoNotification[] = [
  { id: 'nt-9001', type: 'friend_request',  title: 'طلب صداقة جديد',     body: 'دانا سباعي ترغب بإضافتك كصديقة.',              data: { href: '/friends' },           readAt: null,        createdAt: inHours(-14) },
  { id: 'nt-9002', type: 'message',         title: 'رسالة من عمر الشامي', body: 'تمام، بأكد مع صاحبي وبخبرك اليوم المسا.',       data: { href: '/messages/usr-1001' }, readAt: null,        createdAt: inHours(-5) },
  { id: 'nt-9003', type: 'event_update',    title: 'تحديث فعالية',        body: 'تم تحديث نقطة التجمع لجولة الدراجات.',          data: { href: '/events/evt-1001' },   readAt: inHours(-8), createdAt: inHours(-12) },
  { id: 'nt-9004', type: 'event_starting',  title: 'فعاليتك تبدأ قريباً', body: 'جولة الدراجات تبدأ بعد 24 ساعة.',               data: { href: '/events/evt-1001' },   readAt: null,        createdAt: inHours(-1) },
  { id: 'nt-9005', type: 'friend_accepted', title: 'تم قبول طلب الصداقة', body: 'سلوى بركات أصبحت في قائمة أصدقائك.',            data: { href: '/friends' },           readAt: inDays(-2),  createdAt: inDays(-2) },
  { id: 'nt-9006', type: 'event_invite',    title: 'دعوة لفعالية',        body: 'باسل نعمة دعاك إلى «مساء قهوة ومحادثة هادئة».', data: { href: '/events/evt-1006' },   readAt: inDays(-1),  createdAt: inDays(-1) },
];

// ─── Notification preferences ────────────────────────────────────────────────

export const NOTIFICATION_PREFS: NotificationPreferencesDto = {
  id: 'np-1',
  userId: DEMO_ME_ID,
  eventInvite: true,
  eventUpdate: true,
  eventStarting: true,
  friendRequest: true,
  friendAccepted: true,
  newMessage: true,
  redFlag: true,
  marketing: false,
  createdAt: inDays(-140),
  updatedAt: inDays(-3),
};

// ─── Admin console ───────────────────────────────────────────────────────────

export const ADMIN_STATS: AdminStats = {
  users: { total: 1284, newToday: 14, newThisWeek: 96, newThisMonth: 388, banned: 7 },
  events: { total: 342, active: 61, cancelled: 12 },
  messages: { total: 24_918 },
  reports: { total: 38, unresolved: 4 },
  redFlags: [
    { reason: 'NO_SHOW', count: 19 },
    { reason: 'RULE_VIOLATION', count: 11 },
    { reason: 'SPAM', count: 5 },
    { reason: 'TOXIC_BEHAVIOR', count: 3 },
  ],
};

export const ADMIN_USERS: AdminUserDto[] = USERS.slice(0, 8).map((u) => ({
  id: u.id,
  phone: u.phone,
  displayName: u.displayName,
  avatarUrl: null,
  isVerified: u.isVerified,
  isBanned: false,
  isAdmin: u.isAdmin,
  redFlagCount: u.stats.redFlagCount,
  createdAt: u.createdAt,
  _count: { organizedEvents: u.stats.eventsOrganized, memberships: u.stats.eventsJoined },
}));

export const ADMIN_REPORTS: AdminReportDto[] = [
  {
    id: 'rp-1', reason: 'NO_SHOW', description: 'لم يحضر الفعالية ولم يلغِ الحجز مسبقاً.',
    createdAt: inHours(-30), resolvedAt: null,
    filer: { id: 'usr-1005', displayName: 'سامر خوري' },
    reported: { id: 'usr-1009', displayName: 'رامي شعبان', redFlagCount: 2, isBanned: false },
  },
  {
    id: 'rp-2', reason: 'RULE_VIOLATION', description: 'مخالفة قواعد الملعب بعد تنبيه.',
    createdAt: inHours(-12), resolvedAt: null,
    filer: { id: 'usr-1003', displayName: 'كنان درويش' },
    reported: { id: 'usr-1009', displayName: 'رامي شعبان', redFlagCount: 2, isBanned: false },
  },
  {
    id: 'rp-3', reason: 'SPAM', description: 'إعلانات متكررة في غرفة الدردشة.',
    createdAt: inDays(-3), resolvedAt: null,
    filer: { id: 'usr-1002', displayName: 'هبة زيتون' },
    reported: { id: 'usr-1003', displayName: 'كنان درويش', redFlagCount: 1, isBanned: false },
  },
];

// ─── Gaming hub ──────────────────────────────────────────────────────────────

const player = (id: string) => {
  const u = USERS.find((x) => x.id === id)!;
  return { id: u.id, displayName: u.displayName, avatarUrl: u.avatarUrl };
};

export const TOURNAMENTS: TournamentSummary[] = [
  {
    id: 'tny-1', title: 'كأس الويكند — FIFA', game: 'FIFA 24', status: 'ONGOING',
    maxParticipants: 16, startsAt: inHours(-3), prizePool: '150,000 ل.س',
    organizer: player('usr-1003'), _count: { participants: 16 },
  },
  {
    id: 'tny-2', title: 'دوري الشطرنج السريع', game: 'Chess', status: 'PENDING',
    maxParticipants: 32, startsAt: inDays(4), prizePool: 'بطاقة هدية',
    organizer: player('usr-1009'), _count: { participants: 11 },
  },
  {
    id: 'tny-3', title: 'بطولة Rocket League الثنائية', game: 'Rocket League', status: 'PENDING',
    maxParticipants: 8, startsAt: inDays(9), prizePool: '80,000 ل.س',
    organizer: player('usr-1005'), _count: { participants: 5 },
  },
  {
    id: 'tny-4', title: 'بطولة الجوّال — PUBG Mobile', game: 'PUBG Mobile', status: 'COMPLETED',
    maxParticipants: 64, startsAt: inDays(-10), prizePool: '250,000 ل.س',
    organizer: player('usr-1001'), _count: { participants: 58 },
  },
];

const bracketMatches = (): GamingMatch[] => {
  const round1: GamingMatch[] = [
    { id: 'mtch-1', round: 1, position: 0, status: 'FINISHED', player1: player('usr-1003'), player2: player('usr-1011'), winner: player('usr-1003'), score1: '3', score2: '1' },
    { id: 'mtch-2', round: 1, position: 1, status: 'FINISHED', player1: player('usr-1005'), player2: player('usr-1007'), winner: player('usr-1005'), score1: '2', score2: '0' },
    { id: 'mtch-3', round: 1, position: 2, status: 'PLAYING',  player1: player('usr-1009'), player2: player('usr-1001'), winner: null, score1: '1', score2: '1' },
    { id: 'mtch-4', round: 1, position: 3, status: 'BYE',      player1: player(DEMO_ME_ID), player2: null, winner: player(DEMO_ME_ID), score1: null, score2: null },
  ];
  const round2: GamingMatch[] = [
    { id: 'mtch-5', round: 2, position: 0, status: 'SCHEDULED', player1: player('usr-1003'), player2: player('usr-1005'), winner: null, score1: null, score2: null },
    { id: 'mtch-6', round: 2, position: 1, status: 'SCHEDULED', player1: null, player2: player(DEMO_ME_ID), winner: null, score1: null, score2: null },
  ];
  return [...round1, ...round2];
};

const BRACKET: GamingBracket = {
  id: 'brk-1',
  totalRounds: 2,
  totalSlots: 8,
  matches: bracketMatches(),
};

export const TOURNAMENT_DETAILS: Record<string, TournamentDetail> = {
  'tny-1': {
    ...TOURNAMENTS[0],
    participants: ['usr-1003', 'usr-1011', 'usr-1005', 'usr-1007', 'usr-1009', 'usr-1001', DEMO_ME_ID, 'usr-1012']
      .map((id) => ({ user: player(id) })),
    brackets: [BRACKET],
    _count: { participants: 16 },
  },
};

export const VENUES: VenueSummary[] = [
  {
    id: 'ven-1', name: 'صالة النخبة للألعاب', address: 'المزة — شارع الفردوس',
    stationCount: 8, pricePerHour: '25,000', currency: 'SYP',
    amenities: ['إنترنت فايبر', 'مكيّف', 'مشروبات', 'مواقف'],
  },
  {
    id: 'ven-2', name: 'GameZone دمشق', address: 'الميدان — قرب دوار البيطرة',
    stationCount: 12, pricePerHour: '20,000', currency: 'SYP',
    amenities: ['إنترنت', 'شاشات 144Hz', 'مقهى داخلي'],
  },
  {
    id: 'ven-3', name: 'استوديو القهوة والألعاب', address: 'أبو رمانة — شارع الأمير',
    stationCount: 6, pricePerHour: '30,000', currency: 'SYP',
    amenities: ['PS5', 'غرف خاصة', 'حجز مسبق'],
  },
];

const bookedSlots = (): VenueBookingSlot[] => [
  { startTime: inHours(4), endTime: inHours(6), stationsBooked: 3 },
  { startTime: inHours(8), endTime: inHours(10), stationsBooked: 6 },
];

export const VENUE_DETAILS: Record<string, VenueDetail> = {
  'ven-1': {
    ...VENUES[0],
    description: 'صالة مغلقة مخصّصة للبطولات المحلية، مع مسرح صغير للبثّ المباشر.',
    openTime: '12:00',
    closeTime: '02:00',
    owner: player('usr-1003'),
    bookings: bookedSlots(),
  },
};

// ─── Mutable demo state ──────────────────────────────────────────────────────
//
// The demo keeps its mutable state in one place so interactions (creating an
// event, sending a message, toggling a preference, approving a member, …)
// visibly persist for the browser session. Nothing is written to disk and no
// real credential or personal data is involved.

export const db = {
  me: ME,
  users: USERS,
  events: EVENTS,
  eventMembers: EVENT_MEMBERS,
  pendingMembers: PENDING_MEMBERS,
  friends: FRIENDS,
  pendingFriends: PENDING_FRIENDS,
  conversations: CONVERSATIONS,
  roomHistory: ROOM_HISTORY,
  notifications: NOTIFICATIONS,
  notificationPrefs: { ...NOTIFICATION_PREFS },
  adminStats: ADMIN_STATS,
  adminUsers: ADMIN_USERS,
  adminReports: ADMIN_REPORTS,
  tournaments: TOURNAMENTS,
  tournamentDetails: TOURNAMENT_DETAILS,
  venues: VENUES,
  venueDetails: VENUE_DETAILS,
  termsAccepted: true,
  unreadMessages: 3,
  nextId: { event: 2000, message: 8000, notification: 9500 },
};

export const demoIds = {
  events: EVENTS.map((e) => e.id),
  users: USERS.map((u) => u.id),
  tournaments: TOURNAMENTS.map((t) => t.id),
  venues: VENUES.map((v) => v.id),
};

export const paginate = (total: number, page = 1, limit = 20): PaginationMeta => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 };
};

export const findUser = (id: string): DemoUser | undefined =>
  db.users.find((u) => u.id === id);

/** Self-contained SVG data-URI avatar — no external request, no real photo. */
export const initialsAvatar = (name: string): string => {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('');
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#22c55e"/><stop offset="1" stop-color="#3b82f6"/>' +
    '</linearGradient></defs>' +
    '<rect width="128" height="128" fill="url(#g)"/>' +
    `<text x="64" y="84" font-size="52" font-family="sans-serif" fill="#ffffff" text-anchor="middle">${initials}</text>` +
    '</svg>';
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

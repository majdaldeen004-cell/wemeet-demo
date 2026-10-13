'use client';
import React from 'react';
import {
  MapPin, ClipboardList, Calendar, Users, Lock, ArrowLeft,
  MessageCircle, Map, Flag, Check, Hand, Clock, X, QrCode,
  Bike, Gamepad2, TreePine, BookOpen, PawPrint, Dumbbell, Star,
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import { QRCodeSVG } from 'qrcode.react';
import { AppShell } from '@/components/layout/AppShell';
import { Avatar, Badge, Button, Card, EmptyState } from '@/components/ui';
import { EventDetailSkeleton } from '@/components/ui/Skeletons';
import { ErrorMessage } from '@/components/errors/ErrorBoundary';
import { useEvent } from '@/hooks/useEvents';
import { eventsApi, redFlagsApi } from '@/lib/api';
import type { EventMember } from '@/types';

const EventsMap = dynamic(() => import('@/components/maps/EventMap').then((m) => m.EventsMap), { ssr: false });
const RouteMap  = dynamic(() => import('@/components/maps/EventMap').then((m) => m.RouteMap),  { ssr: false });

const GENDER_LABEL: Record<string, string> = {
  MALES_ONLY: 'ذكور فقط', FEMALES_ONLY: 'إناث فقط', MIXED: 'الكل',
};

// ── Red Flag reasons (mirrors backend enum) ───────────────────────────────────
const REPORT_REASONS = [
  { value: 'TOXIC_BEHAVIOR', label: 'Toxic behaviour' },
  { value: 'HARASSMENT',     label: 'Harassment' },
  { value: 'SPAM',           label: 'Spam' },
  { value: 'FAKE_PROFILE',   label: 'Fake profile' },
  { value: 'NO_SHOW',        label: 'No-show' },
] as const;

type ReportReason = (typeof REPORT_REASONS)[number]['value'];

// ── Pending member type ───────────────────────────────────────────────────────
type PendingMember = {
  userId: string;
  user: { displayName: string; avatarUrl: string | null };
  requestedAt: string;
};

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  CYCLING: <Bike      size={64} className="text-ink-muted opacity-40" />,
  GAMING:  <Gamepad2  size={64} className="text-ink-muted opacity-40" />,
  OUTDOOR: <TreePine  size={64} className="text-ink-muted opacity-40" />,
  STUDY:   <BookOpen  size={64} className="text-ink-muted opacity-40" />,
  PETS:    <PawPrint  size={64} className="text-ink-muted opacity-40" />,
  SOCIAL:  <Users     size={64} className="text-ink-muted opacity-40" />,
  SPORTS:  <Dumbbell  size={64} className="text-ink-muted opacity-40" />,
  OTHER:   <Star      size={64} className="text-ink-muted opacity-40" />,
};

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { event, loading, error, joining, leaving, join, leave, refetch } = useEvent(id);

  const [members,  setMembers]  = useState<EventMember[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [activeTab, setActiveTab] = useState<'members' | 'pending'>('members');

  // ── Approval panel ─────────────────────────────────────────────────────────
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);

  // ── Report modal ───────────────────────────────────────────────────────────
  const [reportTarget, setReportTarget] = useState<{ userId: string; name: string } | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>('TOXIC_BEHAVIOR');
  const [reportContext, setReportContext] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // ── Attendance QR token ────────────────────────────────────────────────────
  const [attendanceToken, setAttendanceToken] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!event) return;
    eventsApi.getMembers(id).then(setMembers).catch(() => {});
  }, [id, event]);

  const loadPending = useCallback(async () => {
    if (!event) return;
    setPendingLoading(true);
    try {
      const data = await eventsApi.getPendingMembers(id);
      setPendingMembers(data);
    } catch {
      setPendingMembers([]);
    } finally {
      setPendingLoading(false);
    }
  }, [id, event]);

  useEffect(() => { loadMembers(); }, [loadMembers]);
  useEffect(() => {
    if (isOrganizer) loadPending();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  // Auto-fetch QR token for approved non-organizer members
  useEffect(() => {
    if (!event) return;
    const isMemberApproved = event.myMembership?.status === 'APPROVED';
    const isOrg = event.myMembership?.role === 'ORGANIZER';
    if (isMemberApproved && !isOrg && !attendanceToken) {
      setQrLoading(true);
      eventsApi.generateQrToken(id)
        .then((res) => setAttendanceToken(res.token))
        .catch(() => {/* silently fail — user can still use the app */})
        .finally(() => setQrLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.myMembership?.status, event?.myMembership?.role]);

  const handleApprove = async (userId: string) => {
    setApproving(userId);
    try {
      await eventsApi.approveMember(id, userId);
      await Promise.all([loadMembers(), loadPending()]);
    } catch {
      // keep UI consistent — the server will return the error via toast infra
    } finally {
      setApproving(null);
    }
  };

  const handleReport = async () => {
    if (!reportTarget) return;
    setReportSubmitting(true);
    try {
      await redFlagsApi.report(reportTarget.userId, reportReason, reportContext || undefined);
      setReportSuccess(true);
    } finally {
      setReportSubmitting(false);
    }
  };

  const closeReport = () => {
    setReportTarget(null);
    setReportReason('TOXIC_BEHAVIOR');
    setReportContext('');
    setReportSuccess(false);
  };

  if (loading && !event) return <AppShell><div className="max-w-2xl mx-auto px-4 py-6"><EventDetailSkeleton /></div></AppShell>;
  if (error)             return <AppShell><div className="max-w-2xl mx-auto px-4 py-6"><ErrorMessage message={error} onRetry={refetch} /></div></AppShell>;
  if (!event)            return null;

  const isMember     = event.myMembership?.status === 'APPROVED';
  const isPending    = event.myMembership?.status === 'PENDING';
  const isOrganizer  = event.myMembership?.role === 'ORGANIZER';
  const isFull       = event.maxAttendees ? event.memberCount >= event.maxAttendees : false;
  const chatActive   = event.chatExpiresAt && new Date(event.chatExpiresAt) > new Date() && event.status === 'ACTIVE';
  const hasLocation  = !!(event.locationLat && event.locationLng);
  const hasRoute     = !!(event as never as { routePolyline?: string }).routePolyline;

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition">
          <ArrowLeft size={16} /> Back
        </button>

        {/* Main card */}
        <Card className="overflow-hidden">
          {/* Cover image or category icon fallback */}
          {event.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.coverImage}
              alt={event.title}
              className="w-full object-cover"
              style={{ height: 200, objectFit: 'cover' }}
            />
          ) : (
            <div
              className="flex items-center justify-center bg-sand"
              style={{ height: 120 }}
            >
              {CATEGORY_ICON[event.category] ?? <Star size={64} className="text-ink-muted opacity-40" />}
            </div>
          )}

          <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-ink">{event.title}</h1>
              {event.description && <p className="text-sm text-ink-soft mt-1">{event.description}</p>}
            </div>
            <Badge variant={event.status === 'ACTIVE' ? 'green' : 'sand'}>{event.status}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-ink-soft">
              <Calendar size={15} className="text-brand-green" />
              <span>{format(new Date(event.scheduledAt), 'EEE, MMM d · h:mm a')}</span>
            </div>
            <div className="flex items-center gap-2 text-ink-soft">
              <Users size={15} className="text-brand-green" />
              <span>{event.memberCount}{event.maxAttendees ? `/${event.maxAttendees}` : ''}</span>
            </div>
            {event.locationName && (
              <div className="flex items-center gap-2 text-ink-soft col-span-2">
                <MapPin size={15} className="text-brand-green flex-shrink-0" />
                <span>{event.locationName}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="sand">{GENDER_LABEL[event.genderFilter]}</Badge>
            <Badge variant="sand">{event.category}</Badge>
            <Badge variant={event.visibility === 'PUBLIC' ? 'green' : 'blue'}>
              {event.visibility === 'PRIVATE' && <Lock size={11} className="mr-0.5" />}
              {event.visibility}
            </Badge>
            {hasRoute && <Badge variant="blue"><Map size={11} className="mr-0.5" /> Has route</Badge>}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Avatar src={event.organizer.avatarUrl} name={event.organizer.displayName} size="sm" />
              <div>
                <p className="text-xs text-ink-muted">Organised by</p>
                <p className="text-sm font-medium text-ink">{event.organizer.displayName}</p>
              </div>
            </div>
            {/* Report the organizer (only visible to non-organizer members) */}
            {isMember && !isOrganizer && (
              <button
                onClick={() => setReportTarget({ userId: event.organizer.id, name: event.organizer.displayName })}
                className="flex items-center gap-1 text-xs text-ink-muted hover:text-red-500 transition"
              >
                <Flag size={12} /> Report
              </button>
            )}
          </div>{/* end organizer row */}
          </div>{/* end p-5 */}
        </Card>

        {/* Maps */}
        {hasLocation && (
          <Card className="overflow-hidden">
            <div className="p-3 border-b border-border">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest flex items-center gap-1"><MapPin size={11}/>نقطة التجمع</p>
            </div>
            <EventsMap
              events={[event]}
              center={{ lat: Number(event.locationLat), lng: Number(event.locationLng) }}
              height="220px"
            />
          </Card>
        )}

        {hasRoute && (
          <Card className="overflow-hidden">
            <div className="p-3 border-b border-border">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest">المسار</p>
            </div>
            <RouteMap
              polyline={(event as never as { routePolyline: string }).routePolyline}
              height="240px"
            />
          </Card>
        )}

        {/* Rules */}
        {event.rules.length > 0 && (
          <Card className="p-4 space-y-2">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5"><ClipboardList size={14}/>قواعد الفعالية</h3>
            <ul className="space-y-1.5">
              {event.rules.map((rule, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-soft">
                  <span className="text-brand-green font-bold mt-0.5">{i + 1}.</span>
                  {rule}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Invite code input */}
        {!isMember && !isPending && event.visibility === 'PRIVATE' && (
          <Card className="p-4 space-y-2">
            <p className="text-sm font-medium text-ink">Enter invite code</p>
            <input
              className="w-full rounded-xl border border-border-sand bg-sand-dark px-4 py-3 text-center tracking-widest uppercase font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="XXXXXXXX"
              maxLength={8}
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            />
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {!isMember && !isPending && event.status === 'ACTIVE' && !isFull && (
            <Button fullWidth size="lg" loading={joining} onClick={() => join(inviteCode || undefined)}>
              {event.visibility === 'RESTRICTED' ? 'طلب الانضمام' : 'الانضمام للفعالية'}
            </Button>
          )}
          {isPending && (
            <div className="flex-1 bg-brand-blue-light text-brand-blue text-sm font-medium rounded-xl px-4 py-3 text-center">
              ⏳ Awaiting organizer approval
            </div>
          )}
          {isFull && !isMember && (
            <div className="flex-1 bg-sand text-ink-muted text-sm rounded-xl px-4 py-3 text-center border border-border">
              Event is full
            </div>
          )}
          {isMember && chatActive && (
            <Button variant="secondary" fullWidth size="lg" onClick={() => router.push(`/chat/${event.id}`)}>
              <MessageCircle size={18} /> Open chat
            </Button>
          )}
          {isMember && !isOrganizer && (
            <Button variant="ghost" size="lg" loading={leaving} onClick={leave} className="flex-shrink-0">
              Leave
            </Button>
          )}
        </div>

        {/* ── Attendance QR code (approved non-organizer members only) ── */}
        {isMember && !isOrganizer && (
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5">
              <QrCode size={14} className="text-brand-green" />
              رمز الحضور
            </h3>
            {qrLoading ? (
              <div className="flex justify-center py-6">
                <div className="w-[200px] h-[200px] bg-sand-dark rounded-xl animate-pulse" />
              </div>
            ) : attendanceToken ? (
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-border">
                  <QRCodeSVG
                    value={attendanceToken}
                    size={200}
                    bgColor="#ffffff"
                    fgColor="#1a1a1a"
                    level="M"
                  />
                </div>
                <p className="text-xs text-ink-muted text-center">
                  أظهر هذا الرمز للمنظِّم عند الحضور
                </p>
              </div>
            ) : (
              <p className="text-xs text-ink-muted text-center py-4">
                تعذّر توليد رمز الحضور. حاول مرة أخرى.
              </p>
            )}
          </Card>
        )}

        {/* Organizer invite code */}
        {isOrganizer && event.inviteCode && (
          <Card className="p-4">
            <p className="text-xs text-ink-muted mb-1">Private invite code (share this)</p>
            <p className="font-mono text-xl font-bold text-ink tracking-widest text-center py-2 bg-sand rounded-xl">
              {event.inviteCode}
            </p>
          </Card>
        )}

        {/* Members / Pending tabs — organizer sees both tabs; others see only Members */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <button
              onClick={() => setActiveTab('members')}
              className={`text-sm font-semibold transition ${activeTab === 'members' ? 'text-ink' : 'text-ink-muted hover:text-ink'}`}
            >
              Members ({members.length})
            </button>
            {isOrganizer && (
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex items-center gap-1.5 text-sm font-semibold transition ${activeTab === 'pending' ? 'text-ink' : 'text-ink-muted hover:text-ink'}`}
              >
                <Hand size={13} />
                Pending Requests
                {pendingMembers.length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center rounded-full bg-brand-green text-white text-[10px] font-bold w-4 h-4">
                    {pendingMembers.length}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Members tab */}
          {activeTab === 'members' && (
            <div className="space-y-2">
              {members.length === 0 && (
                <p className="text-sm text-ink-muted text-center py-4">No members yet.</p>
              )}
              {members.map((m) => (
                <div key={m.userId} className="flex items-center gap-3">
                  <Avatar src={m.user.avatarUrl} name={m.user.displayName} size="sm" />
                  <span className="text-sm text-ink flex-1">{m.user.displayName}</span>
                  {m.role === 'ORGANIZER' && <Badge variant="green">Organizer</Badge>}
                  {/* Report member button (visible to organizer and to other members, not to self) */}
                  {(isOrganizer || isMember) && m.role !== 'ORGANIZER' && (
                    <button
                      onClick={() => setReportTarget({ userId: m.userId, name: m.user.displayName })}
                      className="text-ink-muted hover:text-red-500 transition"
                      title={`Report ${m.user.displayName}`}
                    >
                      <Flag size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pending tab — organizer only */}
          {activeTab === 'pending' && isOrganizer && (
            <div className="space-y-2">
              {pendingLoading && (
                <p className="text-sm text-ink-muted text-center py-4">Loading…</p>
              )}
              {!pendingLoading && pendingMembers.length === 0 && (
                <p className="text-sm text-ink-muted text-center py-4">No pending requests.</p>
              )}
              {pendingMembers.map((m) => (
                <div key={m.userId} className="flex items-center gap-3">
                  <Avatar src={m.user.avatarUrl} name={m.user.displayName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">{m.user.displayName}</p>
                    <p className="text-xs text-ink-muted flex items-center gap-1">
                      <Clock size={10} /> {format(new Date(m.requestedAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    loading={approving === m.userId}
                    onClick={() => handleApprove(m.userId)}
                  >
                    <Check size={13} /> Approve
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Report modal ────────────────────────────────────────────────────── */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm p-5 space-y-4 rounded-2xl">
            {reportSuccess ? (
              <div className="text-center space-y-3 py-4">
                <div className="mx-auto w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center">
                  <Check size={20} className="text-brand-green" />
                </div>
                <p className="font-semibold text-ink">Report submitted</p>
                <p className="text-sm text-ink-muted">Thank you. Our team will review it.</p>
                <Button fullWidth onClick={closeReport}>Close</Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-ink flex items-center gap-1.5">
                    <Flag size={14} className="text-red-500" />
                    Report {reportTarget.name}
                  </h2>
                  <button onClick={closeReport}><X size={16} className="text-ink-muted" /></button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-ink-muted">Reason</p>
                  <div className="grid grid-cols-2 gap-2">
                    {REPORT_REASONS.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => setReportReason(r.value)}
                        className={`rounded-xl border px-3 py-2 text-xs font-medium text-left transition
                          ${reportReason === r.value
                            ? 'border-red-400 bg-red-50 text-red-600'
                            : 'border-border text-ink-soft hover:border-red-300'}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-ink-muted">Additional context (optional)</p>
                  <textarea
                    rows={3}
                    className="w-full rounded-xl border border-border bg-sand-dark px-3 py-2 text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
                    placeholder="Describe what happened…"
                    value={reportContext}
                    onChange={(e) => setReportContext(e.target.value)}
                    maxLength={300}
                  />
                  <p className="text-[10px] text-ink-muted text-right">{reportContext.length}/300</p>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" fullWidth onClick={closeReport}>Cancel</Button>
                  <Button
                    variant="danger"
                    fullWidth
                    loading={reportSubmitting}
                    onClick={handleReport}
                  >
                    Submit Report
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </AppShell>
  );
}

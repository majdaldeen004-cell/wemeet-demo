/**
 * web/src/app/gaming/tournaments/[id]/page.tsx
 *
 * [D-2] Inline Player/Match/Bracket/Tournament interfaces removed — now from @wemeet/shared
 * [C-2] "Generate Brackets" button added for organizers
 * [C-4] Match boxes are clickable for the organizer: a SCHEDULED match (both
 *       players set) opens a "Start Match" action; a PLAYING match opens an
 *       inline score-entry panel that reports the result. Wired to the
 *       backend's startMatch / reportMatchResult endpoints.
 * [C-5] score1/score2 rendered as strings (fixes NaN for "2-1" format)
 * [V-6] SVG bracket bounded with overflow-x-auto; slots > 32 show round tabs instead
 */
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Trophy, Users, ArrowLeft, Clock, Swords, Play, Check, X } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { apiGet, apiPost } from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import type {
  TournamentDetail,
  GamingBracket,
  GamingMatch,
} from '@wemeet/shared';
import { TOURNAMENT_STATUS_STYLE } from '@wemeet/shared';

// ─── SVG Constants ────────────────────────────────────────────────────────────

const MATCH_W = 180;
const MATCH_H = 56;
const H_GAP   = 80;
const V_GAP   = 24;

// ─── Slot guard: switch to round-tab view above this threshold (V-6) ─────────
const SVG_MAX_SLOTS = 32;

// ─── SVG Bracket Viewer ───────────────────────────────────────────────────────

function BracketViewer({
  bracket,
  isOrganizer,
  onMatchUpdated,
}: {
  bracket: GamingBracket;
  isOrganizer: boolean;
  onMatchUpdated: () => void | Promise<void>;
}) {
  const [activeRound, setActiveRound] = useState<number | null>(null);

  // [C-4] Interactive match state — clicking an actionable match opens an
  // inline start/score panel below the bracket (rendered once, regardless
  // of which view branch — round-tabs or full SVG — is currently shown).
  const [selectedMatch, setSelectedMatch] = useState<GamingMatch | null>(null);
  const [score1Draft,   setScore1Draft]   = useState('');
  const [score2Draft,   setScore2Draft]   = useState('');
  const [winnerDraft,   setWinnerDraft]   = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError,   setActionError]   = useState<string | null>(null);

  const rounds = bracket.totalRounds;
  const useTabs = bracket.totalSlots > SVG_MAX_SLOTS;

  const matchesByRound = (r: number): GamingMatch[] =>
    bracket.matches.filter((m) => m.round === r).sort((a, b) => a.position - b.position);

  const round1Count    = matchesByRound(1).length;
  const svgH           = round1Count * (MATCH_H + V_GAP) + V_GAP;
  const svgW           = rounds * (MATCH_W + H_GAP) + H_GAP;

  const matchY = (round: number, position: number): number => {
    const cnt    = matchesByRound(round).length;
    const total  = cnt * (MATCH_H + V_GAP);
    const startY = (svgH - total) / 2;
    return startY + (position - 1) * (MATCH_H + V_GAP);
  };
  const matchX = (round: number) => (round - 1) * (MATCH_W + H_GAP) + H_GAP / 2;

  const statusColor = (s: string) =>
    s === 'FINISHED' ? '#22c55e' : s === 'PLAYING' ? '#f59e0b' : s === 'BYE' ? '#94a3b8' : '#e2e8f0';

  // [C-4] A match can be acted on by the organizer when it's SCHEDULED with
  // both players assigned (ready to start) or already PLAYING (ready for a
  // result). BYE and FINISHED matches stay display-only.
  const isActionable = (m: GamingMatch): boolean =>
    isOrganizer &&
    ((m.status === 'SCHEDULED' && !!m.player1 && !!m.player2) || m.status === 'PLAYING');

  const openMatch = (m: GamingMatch) => {
    if (!isActionable(m)) return;
    setSelectedMatch(m);
    setScore1Draft(m.score1 ?? '');
    setScore2Draft(m.score2 ?? '');
    setWinnerDraft(m.winner?.id ?? null);
    setActionError(null);
  };

  const closePanel = () => {
    setSelectedMatch(null);
    setActionError(null);
  };

  const handleStartMatch = async () => {
    if (!selectedMatch) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await apiPost(`/gaming/matches/${selectedMatch.id}/start`);
      await onMatchUpdated();
      closePanel();
    } catch (e: unknown) {
      setActionError(
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? 'Failed to start match',
      );
    } finally { setActionLoading(false); }
  };

  const handleSubmitResult = async () => {
    if (!selectedMatch || !winnerDraft) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await apiPost(`/gaming/matches/${selectedMatch.id}/result`, {
        winnerId: winnerDraft,
        score1:   score1Draft || undefined,
        score2:   score2Draft || undefined,
      });
      await onMatchUpdated();
      closePanel();
    } catch (e: unknown) {
      setActionError(
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? 'Failed to save match result',
      );
    } finally { setActionLoading(false); }
  };

  // Round-tab view for large brackets (V-6 fix)
  let content: React.ReactNode;
  if (useTabs) {
    const currentRound = activeRound ?? 1;
    const matches      = matchesByRound(currentRound);

    content = (
      <div className="space-y-3">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {Array.from({ length: rounds }, (_, i) => i + 1).map((r) => (
            <button
              key={r}
              onClick={() => setActiveRound(r)}
              className={clsx(
                'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition',
                currentRound === r
                  ? 'bg-brand-green text-white'
                  : 'bg-sand text-ink-muted hover:text-ink',
              )}
            >
              {r === rounds ? 'النهائي' : r === rounds - 1 ? 'نصف النهائي' : `R${r}`}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {matches.map((m) => {
            const p1 = m.player1?.displayName ?? (m.status === 'BYE' ? 'BYE' : 'TBD');
            const p2 = m.player2?.displayName ?? (m.status === 'BYE' ? '—' : 'TBD');
            const clickable = isActionable(m);
            return (
              <div
                key={m.id}
                onClick={() => openMatch(m)}
                className={clsx(
                  'bg-surface rounded-xl border overflow-hidden text-sm',
                  selectedMatch?.id === m.id ? 'border-brand-green' : 'border-border',
                  clickable && 'cursor-pointer hover:border-brand-green transition',
                )}
              >
                <div className={clsx('flex items-center justify-between px-4 py-2', m.winner?.id === m.player1?.id && 'bg-green-50')}>
                  <span className={clsx('font-medium', m.player1 ? 'text-ink' : 'text-ink-muted')}>{p1}</span>
                  {/* [C-5] score rendered as string — no toNumber() coercion */}
                  <span className="font-bold text-ink">{m.score1 ?? ''}</span>
                </div>
                <div className="h-px bg-border" />
                <div className={clsx('flex items-center justify-between px-4 py-2', m.winner?.id === m.player2?.id && 'bg-green-50')}>
                  <span className={clsx('font-medium', m.player2 ? 'text-ink' : 'text-ink-muted')}>{p2}</span>
                  <span className="font-bold text-ink">{m.score2 ?? ''}</span>
                </div>
                {clickable && (
                  <div className="text-[10px] font-semibold text-brand-green text-center py-1 bg-brand-green-light">
                    {m.status === 'PLAYING' ? 'Tap to report result' : 'Tap to start match'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  } else {
    // Full SVG view for ≤ 32 slots (V-6 bounded with overflow-x-auto)
    content = (
      <div className="overflow-x-auto w-full max-w-full rounded-2xl border border-border bg-sand p-4">
        <svg width={svgW} height={svgH} className="block" style={{ minWidth: svgW }}>
          {/* Connector lines */}
          {Array.from({ length: rounds - 1 }, (_, ri) => {
            const round = ri + 1;
            return matchesByRound(round).map((m) => {
              const x1      = matchX(round) + MATCH_W;
              const y1      = matchY(round, m.position) + MATCH_H / 2;
              const nextPos = Math.ceil(m.position / 2);
              const x2      = matchX(round + 1);
              const y2      = matchY(round + 1, nextPos) + MATCH_H / 2;
              return (
                <path
                  key={`conn-${m.id}`}
                  d={`M ${x1} ${y1} C ${x1 + H_GAP / 2} ${y1} ${x2 - H_GAP / 2} ${y2} ${x2} ${y2}`}
                  fill="none" stroke="#cbd5e1" strokeWidth={1.5}
                />
              );
            });
          })}

          {/* Match boxes */}
          {bracket.matches.map((m) => {
            const x   = matchX(m.round);
            const y   = matchY(m.round, m.position);
            const sc  = statusColor(m.status);
            const p1  = m.player1?.displayName ?? (m.status === 'BYE' ? 'BYE' : 'TBD');
            const p2  = m.player2?.displayName ?? (m.status === 'BYE' ? '—' : 'TBD');
            const fin = m.round === rounds;
            // [C-4] clickable matches get a brand-green dashed ring (solid when selected)
            const clickable = isActionable(m);
            const selected  = selectedMatch?.id === m.id;

            return (
              <g
                key={m.id}
                onClick={() => openMatch(m)}
                style={{ cursor: clickable ? 'pointer' : 'default' }}
              >
                <rect x={x} y={y} width={MATCH_W} height={MATCH_H} rx={8} ry={8}
                  fill="#fff" stroke={sc} strokeWidth={fin ? 2.5 : 1.5} />
                {(clickable || selected) && (
                  <rect x={x - 2} y={y - 2} width={MATCH_W + 4} height={MATCH_H + 4} rx={10} ry={10}
                    fill="none" stroke="#22c55e" strokeWidth={selected ? 2 : 1.5}
                    strokeDasharray={selected ? undefined : '4 3'} />
                )}
                {fin && <text x={x + MATCH_W / 2} y={y - 6} textAnchor="middle" fontSize={10} fill="#f59e0b" fontWeight="bold">★</text>}

                {/* Player 1 row */}
                <rect x={x} y={y} width={MATCH_W} height={MATCH_H / 2} rx={8} ry={8}
                  fill={m.winner?.id === m.player1?.id ? '#dcfce7' : 'transparent'} />
                <text x={x + 10} y={y + 20} fontSize={11}
                  fill={m.player1 ? '#0f172a' : '#94a3b8'}
                  fontWeight={m.winner?.id === m.player1?.id ? '700' : '400'}>
                  {p1.length > 18 ? p1.slice(0, 17) + '…' : p1}
                </text>
                {/* [C-5] score as string — no numeric coercion */}
                {m.score1 !== null && (
                  <text x={x + MATCH_W - 8} y={y + 20} fontSize={11}
                    textAnchor="end" fontWeight="700" fill="#0f172a">
                    {m.score1}
                  </text>
                )}

                <line x1={x} y1={y + MATCH_H / 2} x2={x + MATCH_W} y2={y + MATCH_H / 2}
                  stroke="#e2e8f0" strokeWidth={1} />

                {/* Player 2 row */}
                <rect x={x} y={y + MATCH_H / 2} width={MATCH_W} height={MATCH_H / 2} rx={8} ry={8}
                  fill={m.winner?.id === m.player2?.id ? '#dcfce7' : 'transparent'} />
                <text x={x + 10} y={y + MATCH_H - 10} fontSize={11}
                  fill={m.player2 ? '#0f172a' : '#94a3b8'}
                  fontWeight={m.winner?.id === m.player2?.id ? '700' : '400'}>
                  {p2.length > 18 ? p2.slice(0, 17) + '…' : p2}
                </text>
                {m.score2 !== null && (
                  <text x={x + MATCH_W - 8} y={y + MATCH_H - 10} fontSize={11}
                    textAnchor="end" fontWeight="700" fill="#0f172a">
                    {m.score2}
                  </text>
                )}
              </g>
            );
          })}

          {/* Round labels */}
          {Array.from({ length: rounds }, (_, ri) => {
            const r     = ri + 1;
            const label = r === rounds ? 'Grand Final' : r === rounds - 1 ? 'Semi-Final' : `Round ${r}`;
            return (
              <text key={`lbl-${r}`} x={matchX(r) + MATCH_W / 2} y={14}
                textAnchor="middle" fontSize={11} fontWeight="600" fill="#64748b">
                {label}
              </text>
            );
          })}
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {content}

      {/* [C-4] Inline start/score panel — shared by both render branches above */}
      {selectedMatch && (
        <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">
              {selectedMatch.status === 'PLAYING' ? 'Report Match Result' : 'Start Match'}
            </h3>
            <button onClick={closePanel} className="text-ink-muted hover:text-ink transition">
              <X size={16} />
            </button>
          </div>

          <p className="text-xs text-ink-muted">
            Round {selectedMatch.round} · Match {selectedMatch.position}
          </p>

          {selectedMatch.status === 'SCHEDULED' ? (
            <>
              <p className="text-sm text-ink-soft">
                {selectedMatch.player1?.displayName} vs {selectedMatch.player2?.displayName}
              </p>
              {actionError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{actionError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={closePanel}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-ink-muted hover:text-ink transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartMatch}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-brand-green-dark transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Play size={14} />
                  {actionLoading ? 'Starting…' : 'Start Match'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5 block">
                  <span className="block text-xs font-semibold text-ink-muted">
                    {selectedMatch.player1?.displayName ?? 'Player 1'} score
                  </span>
                  <input
                    type="text" value={score1Draft} onChange={(e) => setScore1Draft(e.target.value)}
                    placeholder="e.g. 2"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-sand focus:outline-none focus:border-brand-green transition"
                  />
                </label>
                <label className="space-y-1.5 block">
                  <span className="block text-xs font-semibold text-ink-muted">
                    {selectedMatch.player2?.displayName ?? 'Player 2'} score
                  </span>
                  <input
                    type="text" value={score2Draft} onChange={(e) => setScore2Draft(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-sand focus:outline-none focus:border-brand-green transition"
                  />
                </label>
              </div>

              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-ink-muted">Winner</span>
                <div className="flex gap-2">
                  {[selectedMatch.player1, selectedMatch.player2].map((p) => p && (
                    <button
                      key={p.id}
                      onClick={() => setWinnerDraft(p.id)}
                      className={clsx(
                        'flex-1 py-2.5 rounded-xl border text-sm font-semibold transition',
                        winnerDraft === p.id
                          ? 'border-brand-green bg-brand-green-light text-brand-green-dark'
                          : 'border-border text-ink-muted hover:text-ink',
                      )}
                    >
                      {p.displayName}
                    </button>
                  ))}
                </div>
              </div>

              {actionError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{actionError}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={closePanel}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-ink-muted hover:text-ink transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitResult}
                  disabled={actionLoading || !winnerDraft}
                  className="flex-1 py-2.5 rounded-xl bg-brand-green text-white text-sm font-bold hover:bg-brand-green-dark transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Check size={14} />
                  {actionLoading ? 'Saving…' : 'Save Result'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TournamentPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { user } = useAuthStore();

  const [tournament,         setTournament]         = useState<TournamentDetail | null>(null);
  const [loading,            setLoading]            = useState(true);
  const [joining,            setJoining]            = useState(false);
  const [generatingBrackets, setGeneratingBrackets] = useState(false);
  const [error,              setError]              = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    apiGet<TournamentDetail>(`/gaming/tournaments/${id}`)
      .then(setTournament)
      .catch(() => setError('Tournament not found'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { void load(); }, [id]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await apiPost(`/gaming/tournaments/${id}/join`);
      await load();
    } catch (e: unknown) {
      setError(
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? 'Failed to join',
      );
    } finally { setJoining(false); }
  };

  // [C-2] Organizer can trigger bracket generation
  const handleGenerateBrackets = async () => {
    setGeneratingBrackets(true);
    setError(null);
    try {
      await apiPost(`/gaming/tournaments/${id}/brackets`, {});
      await load();
    } catch (e: unknown) {
      setError(
        (e as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? 'Failed to generate brackets',
      );
    } finally { setGeneratingBrackets(false); }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }
  if (!tournament) {
    return (
      <AppShell>
        <div className="text-center py-16 text-ink-muted">{error ?? 'Not found'}</div>
      </AppShell>
    );
  }

  const bracket     = tournament.brackets[0];
  const isOrganizer = user?.id === tournament.organizer.id;
  const isJoined    = tournament.participants.some((p) => p.user.id === user?.id);
  const canJoin     = tournament.status === 'PENDING' && !isJoined && !isOrganizer;
  // [C-2] Show generate button only when organizer, PENDING, enough players, no bracket yet
  const canGenerateBrackets =
    isOrganizer &&
    !bracket &&
    tournament.status === 'PENDING' &&
    tournament._count.participants >= 2;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition"
        >
          <ArrowLeft size={15} /> Back to Gaming Hub
        </button>

        {/* Header */}
        <div className="bg-surface rounded-2xl border border-border p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {/* [D-6] Status badge from shared constant */}
                <span className={clsx(
                  'text-xs font-bold px-2 py-0.5 rounded-full',
                  TOURNAMENT_STATUS_STYLE[tournament.status] ?? 'bg-gray-100 text-gray-600',
                )}>
                  {tournament.status}
                </span>
                <span className="text-sm text-ink-muted">{tournament.game}</span>
              </div>
              <h1 className="text-2xl font-bold text-ink">{tournament.title}</h1>
              <div className="flex items-center gap-4 mt-3 text-sm text-ink-muted flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Users size={14} />
                  {tournament._count.participants}/{tournament.maxParticipants} players
                </span>
                {tournament.startsAt && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} />
                    {format(new Date(tournament.startsAt), 'dd MMM yyyy · HH:mm')}
                  </span>
                )}
                {tournament.prizePool && (
                  <span className="flex items-center gap-1.5">
                    <Trophy size={14} />Prize: {tournament.prizePool}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              {/* [C-2] Generate Brackets button */}
              {canGenerateBrackets && (
                <button
                  onClick={handleGenerateBrackets}
                  disabled={generatingBrackets}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white font-semibold text-sm rounded-xl hover:bg-amber-600 transition disabled:opacity-50"
                >
                  <Play size={14} />
                  {generatingBrackets ? 'Generating…' : 'Generate Brackets'}
                </button>
              )}
              {canJoin && (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="flex items-center gap-2 px-4 py-2.5 bg-brand-green text-white font-semibold text-sm rounded-xl hover:bg-brand-green-dark transition disabled:opacity-50"
                >
                  <Swords size={15} />
                  {joining ? 'Joining…' : 'Join Tournament'}
                </button>
              )}
            </div>
          </div>
          {error && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {/* Bracket */}
        {bracket ? (
          <div>
            <h2 className="text-lg font-bold text-ink mb-3">جدول البطولة</h2>
            <BracketViewer bracket={bracket} isOrganizer={isOrganizer} onMatchUpdated={load} />
          </div>
        ) : tournament.status === 'PENDING' ? (
          <div className="bg-sand rounded-2xl border border-border p-8 text-center">
            <Swords size={36} className="mx-auto mb-3 text-border" />
            <p className="font-semibold text-ink">Bracket not yet generated</p>
            <p className="text-sm text-ink-muted mt-1">
              {isOrganizer
                ? 'Click "Generate Brackets" above when registration is closed.'
                : 'The organizer will generate brackets once registration closes.'}
            </p>
          </div>
        ) : null}

        {/* Participants */}
        <div>
          <h2 className="text-lg font-bold text-ink mb-3">
            Participants ({tournament._count.participants})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {tournament.participants.map(({ user: p }) => (
              <div
                key={p.id}
                className="flex items-center gap-2.5 bg-surface rounded-xl border border-border px-3 py-2.5"
              >
                <div className="w-8 h-8 rounded-full bg-brand-green-light flex items-center justify-center text-brand-green-dark font-bold text-sm flex-shrink-0">
                  {p.displayName[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-ink truncate">{p.displayName}</span>
                {p.id === tournament.organizer.id && (
                  <span className="ml-auto text-[10px] text-brand-green font-bold">ORG</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

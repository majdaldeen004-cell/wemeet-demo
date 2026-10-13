/**
 * web/src/app/gaming/page.tsx
 * Gaming Hub — Full dark-gaming redesign.
 * ⚠️  All API calls and data logic preserved exactly. Only visual layer rebuilt.
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Swords, Trophy, Crown, Shield, Zap, Star, Target, Flame,
  Gamepad2, Monitor, Joystick, Dice5, Medal, Users2, Timer, ChevronRight,
  MapPin, Users, Clock, Plus, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import type { TournamentSummary, VenueSummary } from '@wemeet/shared';
import { apiGet } from '@/lib/api/client';
import { format } from 'date-fns';

// ─── Ambient particles ────────────────────────────────────────────────────────
type ParticleDef = { Icon: LucideIcon; x: number; y: number; delay: number; dur: number };
const PARTICLES: ParticleDef[] = [
  { Icon: Swords,  x: 7,  y: 18, delay: 0,   dur: 3.2 },
  { Icon: Zap,     x: 20, y: 62, delay: 0.5, dur: 4   },
  { Icon: Star,    x: 44, y: 22, delay: 1.1, dur: 3.5 },
  { Icon: Target,  x: 63, y: 72, delay: 0.3, dur: 4.2 },
  { Icon: Flame,   x: 77, y: 18, delay: 0.8, dur: 3   },
  { Icon: Shield,  x: 88, y: 52, delay: 1.4, dur: 4.5 },
  { Icon: Crown,   x: 53, y: 82, delay: 0.6, dur: 3.8 },
  { Icon: Dice5,   x: 33, y: 45, delay: 1.8, dur: 4   },
];

// ─── Status badge config ──────────────────────────────────────────────────────
interface StatusCfg {
  label: string;
  Icon: LucideIcon;
  bg: string; color: string; pulse?: boolean;
}
const STATUS_CFG: Record<string, StatusCfg> = {
  PENDING:   { label: 'قادمة',  Icon: Timer, bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
  ONGOING:   { label: 'جارية',  Icon: Zap,   bg: 'rgba(34,197,94,0.15)',   color: '#22c55e', pulse: true },
  COMPLETED: { label: 'منتهية', Icon: Medal, bg: 'rgba(100,116,139,0.15)', color: '#64748b' },
  CANCELLED: { label: 'ملغاة',  Icon: X,     bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function GamingPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [venues,      setVenues]      = useState<VenueSummary[]>([]);
  const [tab,         setTab]         = useState<'tournaments' | 'venues'>('tournaments');
  const [loading,     setLoading]     = useState(true);
  const [mounted,     setMounted]     = useState(false);

  useEffect(() => {
    setMounted(true);
    const load = async () => {
      setLoading(true);
      try {
        const [t, v] = await Promise.all([
          apiGet<{ items: TournamentSummary[] }>('/gaming/tournaments', { limit: 20 }),
          apiGet<{ items: VenueSummary[] }>('/gaming/venues', { limit: 20 }),
        ]);
        setTournaments(t.items ?? []);
        setVenues(v.items ?? []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const totalPlayers = tournaments.reduce((s, t) => s + (t._count?.participants ?? 0), 0);

  return (
    <>
      <AppShell>
        {/* ── Full dark canvas ── */}
        <div style={{ background: '#111828', minHeight: '100vh' }}>

          {/* ══════════════════════════════ HERO ══════════════════════════════ */}
          <div
            className="relative overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, #1a0a3c 0%, #111828 55%, #081420 100%)',
              minHeight: 280,
            }}
          >
            {/* Scrolling grid */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(139,92,246,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(139,92,246,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '36px 36px',
                animation: 'gridScroll 22s linear infinite',
              }}
            />

            {/* Glow orbs */}
            <div className="absolute pointer-events-none" style={{
              width: "min(400px, 70vw)", height: "min(400px, 70vw)",
              background: 'radial-gradient(circle, rgba(139,92,246,0.22), transparent 70%)',
              borderRadius: '50%', filter: 'blur(40px)',
              top: -120, right: -80,
            }} />
            <div className="absolute pointer-events-none" style={{
              width: "min(240px, 50vw)", height: "min(240px, 50vw)",
              background: 'radial-gradient(circle, rgba(6,182,212,0.18), transparent 70%)',
              borderRadius: '50%', filter: 'blur(32px)',
              bottom: -60, left: 40,
            }} />

            {/* Floating particles */}
            {mounted && PARTICLES.map(({ Icon, x, y, delay, dur }, i) => (
              <div
                key={i}
                className="absolute pointer-events-none"
                style={{
                  left: `${x}%`, top: `${y}%`,
                  animation: `float ${dur}s ease-in-out infinite`,
                  animationDelay: `${delay}s`,
                  opacity: 0.15,
                }}
              >
                <Icon size={13} color="#a78bfa" />
              </div>
            ))}

            {/* Hero content */}
            <div className="relative z-10 max-w-2xl mx-auto px-5 pt-10 pb-8 text-center">
              {/* Floating icon */}
              <div className="flex justify-center mb-5">
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 72, height: 72,
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                    borderRadius: 20,
                    boxShadow: '0 0 40px rgba(139,92,246,0.55), 0 0 80px rgba(139,92,246,0.15)',
                    animation: 'float 3.2s ease-in-out infinite',
                  }}
                >
                  <Joystick size={36} color="#fff" />
                </div>
              </div>

              {/* Gradient headline */}
              <h1
                className="font-black mb-1"
                style={{
                  fontSize: 'clamp(30px, 6vw, 44px)',
                  lineHeight: 1.05,
                  letterSpacing: '-0.03em',
                  background: 'linear-gradient(90deg, #a78bfa, #06b6d4, #8b5cf6, #a78bfa)',
                  backgroundSize: '300% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'gradient-shift 5s ease infinite',
                }}
              >
                Gaming Hub
              </h1>
              <p className="text-xs tracking-widest mb-7" style={{ color: '#6b4f9e', letterSpacing: '0.15em' }}>
                البطولات · الأماكن · الحجوزات
              </p>

              {/* Stats row */}
              <div className="flex justify-center gap-3 mb-7 flex-wrap">
                {[
                  { Icon: Trophy, value: tournaments.length, label: 'بطولة', accent: '#8b5cf6' },
                  { Icon: MapPin, value: venues.length,      label: 'مكان',   accent: '#06b6d4' },
                  { Icon: Users2, value: totalPlayers,       label: 'لاعب',   accent: '#f59e0b' },
                ].map(({ Icon, value, label, accent }) => (
                  <div key={label}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${accent}30` }}>
                    <Icon size={13} color={accent} />
                    <span className="font-bold text-sm" style={{ color: '#e2d9f3' }}>{value}</span>
                    <span className="text-xs" style={{ color: `${accent}cc` }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Primary CTA */}
              <button
                onClick={() => router.push('/gaming/create-tournament')}
                className="g-btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white"
              >
                <Plus size={15} />
                بطولة جديدة
              </button>
            </div>
          </div>

          {/* ══════════════════════════════ CONTENT ══════════════════════════ */}
          <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">

            {/* ── Tab switcher ── */}
            <div
              className="flex gap-1 p-1 rounded-2xl"
              style={{ background: '#1a2236', border: '1px solid #2d3a52' }}
            >
              {([
                { key: 'tournaments' as const, Icon: Trophy,  label: `البطولات (${tournaments.length})` },
                { key: 'venues'      as const, Icon: Monitor, label: `الأماكن (${venues.length})` },
              ]).map(({ key, Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                  style={tab === key ? {
                    background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                    color: '#fff',
                    boxShadow: '0 2px 14px rgba(139,92,246,0.4)',
                  } : { color: '#4a3870' }}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            {/* ── Loading skeleton ── */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 rounded-2xl animate-pulse"
                    style={{ background: 'rgba(139,92,246,0.07)', animationDelay: `${i * 0.12}s` }} />
                ))}
              </div>

            /* ── Tournament list ── */
            ) : tab === 'tournaments' ? (
              <div className="space-y-3">
                {tournaments.length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <div style={{ animation: 'float 3s ease-in-out infinite' }}>
                      <Swords size={56} color="#2d1a5c" className="mx-auto" />
                    </div>
                    <div>
                      <p className="font-bold text-base" style={{ color: '#e2d9f3' }}>لا توجد بطولات بعد</p>
                      <p className="text-sm mt-1" style={{ color: '#4a3870' }}>كن أول من يبدأ المعركة!</p>
                    </div>
                    <button
                      onClick={() => router.push('/gaming/create-tournament')}
                      className="g-btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                    >
                      <Plus size={14} /> أنشئ بطولة
                    </button>
                  </div>
                ) : (
                  tournaments.map((t, i) => {
                    const cfg = STATUS_CFG[t.status] ?? STATUS_CFG.PENDING;
                    const { Icon: StatusIcon } = cfg;
                    return (
                      <Link
                        key={t.id}
                        href={`/gaming/tournaments/${t.id}`}
                        className="g-card-t block rounded-2xl p-4 group"
                        style={{
                          background: '#1a2236',
                          border: '1px solid rgba(139,92,246,0.35)',
                          animation: `fadeInUp 0.4s ease ${i * 0.07}s both, pulse-glow 2s ease-in-out ${i * 0.25 + 0.4}s infinite`,
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">

                            {/* Status + game */}
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span
                                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                                style={{ background: cfg.bg, color: cfg.color }}
                              >
                                <StatusIcon size={10} color={cfg.color} />
                                {cfg.pulse && (
                                  <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ background: cfg.color, animation: 'blink-dot 1s ease-in-out infinite' }}
                                  />
                                )}
                                {cfg.label}
                              </span>
                              <span
                                className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                                style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa' }}
                              >
                                {t.game}
                              </span>
                              {t.prizePool && (
                                <span
                                  className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                                  style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}
                                >
                                  🏆 {t.prizePool}
                                </span>
                              )}
                            </div>

                            {/* Title */}
                            <p className="font-bold truncate mb-2 transition-colors group-hover:text-purple-300"
                              style={{ color: '#e2d9f3', fontSize: 15 }}>
                              {t.title}
                            </p>

                            {/* Meta row */}
                            <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: '#6b4f9e' }}>
                              <span className="flex items-center gap-1">
                                <Users size={11} color="#8b5cf6" />
                                {t._count?.participants ?? 0} / {t.maxParticipants}
                              </span>
                              {t.startsAt && (
                                <span className="flex items-center gap-1">
                                  <Clock size={11} color="#8b5cf6" />
                                  {format(new Date(t.startsAt), 'dd MMM · HH:mm')}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Crown size={11} color="#f59e0b" />
                                {t.organizer.displayName}
                              </span>
                            </div>
                          </div>

                          <ChevronRight
                            size={18}
                            color="#8b5cf6"
                            className="flex-shrink-0 mt-0.5 transition-transform group-hover:translate-x-1"
                          />
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>

            /* ── Venue list ── */
            ) : (
              <div className="space-y-3">
                {venues.length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <div style={{ animation: 'float 3s ease-in-out infinite' }}>
                      <Monitor size={56} color="#082030" className="mx-auto" />
                    </div>
                    <div>
                      <p className="font-bold text-base" style={{ color: '#e2d9f3' }}>لا توجد أماكن مدرجة</p>
                      <p className="text-sm mt-1" style={{ color: '#4a3870' }}>لم يُضف أحد أماكن بعد</p>
                    </div>
                  </div>
                ) : (
                  venues.map((v, i) => (
                    <Link
                      key={v.id}
                      href={`/gaming/venues/${v.id}`}
                      className="g-card-v block rounded-2xl p-4 group"
                      style={{
                        background: '#1a2236',
                        border: '1px solid rgba(6,182,212,0.3)',
                        animation: `fadeInUp 0.4s ease ${i * 0.07}s both, pulse-glow-cyan 2s ease-in-out ${i * 0.25 + 0.4}s infinite`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">

                          {/* Name */}
                          <p className="font-bold truncate mb-1.5 transition-colors group-hover:text-cyan-300"
                            style={{ color: '#e2d9f3', fontSize: 15 }}>
                            {v.name}
                          </p>

                          {/* Address */}
                          {v.address && (
                            <p className="text-xs flex items-center gap-1 mb-2 truncate" style={{ color: '#4a7a8a' }}>
                              <MapPin size={10} color="#06b6d4" />
                              {v.address}
                            </p>
                          )}

                          {/* Meta */}
                          <div className="flex items-center gap-2.5 text-xs flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold"
                              style={{ background: 'rgba(6,182,212,0.12)', color: '#06b6d4' }}>
                              <Gamepad2 size={10} color="#06b6d4" />
                              {v.stationCount} محطة
                            </span>
                            <span className="font-semibold" style={{ color: '#f59e0b' }}>
                              {Number(v.pricePerHour).toFixed(0)} {v.currency}/ساعة
                            </span>
                            {v.amenities.slice(0, 2).map((a) => (
                              <span key={a}
                                className="text-[10px] px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(6,182,212,0.07)', color: '#3a6a7a', border: '1px solid rgba(6,182,212,0.15)' }}>
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>

                        <ChevronRight
                          size={18}
                          color="#06b6d4"
                          className="flex-shrink-0 mt-0.5 transition-transform group-hover:translate-x-1"
                        />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </AppShell>

      {/* ══════════════════════════════ ANIMATIONS ═══════════════════════════ */}
      <style jsx global>{`
        /* ── Keyframes ─────────────────────────────────────── */
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 6px rgba(139,92,246,0.25), 0 2px 16px rgba(0,0,0,0.5); }
          50%       { box-shadow: 0 0 22px rgba(139,92,246,0.55), 0 4px 28px rgba(139,92,246,0.18); }
        }
        @keyframes pulse-glow-cyan {
          0%, 100% { box-shadow: 0 0 6px rgba(6,182,212,0.2), 0 2px 16px rgba(0,0,0,0.5); }
          50%       { box-shadow: 0 0 20px rgba(6,182,212,0.45), 0 4px 28px rgba(6,182,212,0.15); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50%       { transform: translateY(-6px) rotate(2deg); }
        }
        @keyframes gradient-shift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gridScroll {
          0%   { transform: translate(0, 0); }
          100% { transform: translate(36px, 36px); }
        }
        @keyframes blink-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }

        /* ── Tournament card hover ──────────────────────────── */
        .g-card-t {
          transition: transform 0.2s ease, box-shadow 0.3s ease;
        }
        .g-card-t:hover {
          transform: scale(1.02);
          box-shadow: 0 0 30px rgba(139,92,246,0.5),
                      0 8px 40px rgba(0,0,0,0.6) !important;
        }

        /* ── Venue card hover ───────────────────────────────── */
        .g-card-v {
          transition: transform 0.2s ease, box-shadow 0.3s ease;
        }
        .g-card-v:hover {
          transform: scale(1.02);
          box-shadow: 0 0 28px rgba(6,182,212,0.45),
                      0 8px 40px rgba(0,0,0,0.6) !important;
        }

        /* ── Primary button (purple → cyan gradient on hover) ─ */
        .g-btn-primary {
          background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
          background-size: 200% 200%;
          box-shadow: 0 4px 16px rgba(139,92,246,0.4);
          transition: background-position 0.3s ease, box-shadow 0.3s ease, transform 0.15s ease;
        }
        .g-btn-primary:hover {
          background-position: right center;
          background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%);
          box-shadow: 0 0 24px rgba(139,92,246,0.6), 0 4px 20px rgba(6,182,212,0.3);
        }
        .g-btn-primary:active {
          transform: scale(0.97);
        }

        /* ── Outline button ─────────────────────────────────── */
        .g-btn-outline {
          border: 1.5px solid #8b5cf6;
          background: transparent;
          color: #a78bfa;
          transition: background 0.3s ease, color 0.3s ease;
        }
        .g-btn-outline:hover {
          background: rgba(139,92,246,0.18);
          color: #fff;
        }
      `}</style>
    </>
  );
}

import { clsx } from 'clsx';
import { ReactNode } from 'react';

const Pulse = ({ className }: { className?: string }) => (
  <div className={clsx('animate-pulse bg-sand-dark rounded-xl', className)} />
);

// ─── Event card skeleton ──────────────────────────────────────────────────────
export const EventCardSkeleton = () => (
  <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
    <div className="flex gap-2 items-start">
      <Pulse className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <Pulse className="h-4 w-3/4" />
        <Pulse className="h-3 w-full" />
        <Pulse className="h-3 w-1/2" />
      </div>
    </div>
    <div className="flex gap-2">
      <Pulse className="h-5 w-14 rounded-full" />
      <Pulse className="h-5 w-18 rounded-full" />
      <Pulse className="h-5 w-12 rounded-full" />
    </div>
    <div className="space-y-1.5">
      <Pulse className="h-3 w-40" />
      <Pulse className="h-3 w-32" />
    </div>
    <div className="flex items-center gap-2 pt-1 border-t border-border">
      <Pulse className="w-8 h-8 rounded-full" />
      <Pulse className="h-3 w-24" />
    </div>
  </div>
);

// ─── Event list skeletons ─────────────────────────────────────────────────────
export const EventListSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <EventCardSkeleton key={i} />
    ))}
  </div>
);

// ─── Event detail skeleton ────────────────────────────────────────────────────
export const EventDetailSkeleton = () => (
  <div className="space-y-4">
    <Pulse className="h-7 w-2/3" />
    <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
      <Pulse className="h-6 w-3/4" />
      <Pulse className="h-4 w-full" />
      <Pulse className="h-4 w-5/6" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Pulse key={i} className="h-4" />)}
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => <Pulse key={i} className="h-6 w-20 rounded-full" />)}
      </div>
    </div>
    <Pulse className="h-12 w-full rounded-xl" />
  </div>
);

// ─── Profile skeleton ─────────────────────────────────────────────────────────
export const ProfileSkeleton = () => (
  <div className="space-y-4">
    <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
      <div className="flex items-center gap-4">
        <Pulse className="w-16 h-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Pulse className="h-5 w-40" />
          <Pulse className="h-3 w-28" />
        </div>
      </div>
      <Pulse className="h-4 w-full" />
      <Pulse className="h-4 w-3/4" />
    </div>
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-surface rounded-2xl border border-border p-3 text-center space-y-1">
          <Pulse className="h-7 w-8 mx-auto" />
          <Pulse className="h-3 w-12 mx-auto" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Chat message skeleton ────────────────────────────────────────────────────
export const ChatMessageSkeleton = ({ isMe = false }: { isMe?: boolean }) => (
  <div className={clsx('flex gap-2', isMe && 'flex-row-reverse')}>
    {!isMe && <Pulse className="w-8 h-8 rounded-full flex-shrink-0" />}
    <div className={clsx('space-y-1 max-w-[60%]', isMe && 'items-end flex flex-col')}>
      <Pulse className="h-4 w-32 rounded-full" />
      <Pulse className={clsx('h-10 rounded-2xl', isMe ? 'w-44 rounded-tr-sm' : 'w-52 rounded-tl-sm')} />
    </div>
  </div>
);

// ─── Full-page loading screen ─────────────────────────────────────────────────
export const PageLoader = ({ label }: { label?: string }) => (
  <div className="min-h-screen bg-sand flex flex-col items-center justify-center gap-3">
    <div className="w-10 h-10 border-2 border-brand-green/20 border-t-brand-green rounded-full animate-spin" />
    {label && <p className="text-sm text-ink-muted">{label}</p>}
  </div>
);

// ─── Inline loading ───────────────────────────────────────────────────────────
export const InlineLoader = ({ className }: { className?: string }) => (
  <div className={clsx('flex items-center justify-center py-8', className)}>
    <div className="w-6 h-6 border-2 border-brand-green/20 border-t-brand-green rounded-full animate-spin" />
  </div>
);

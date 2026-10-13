'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, PlusCircle, Trees } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { EventCard } from '@/components/events/EventCard';
import { EventFiltersBar } from '@/components/events/EventFilters';
import { EmptyState, Button } from '@/components/ui';
import { EventListSkeleton } from '@/components/ui/Skeletons';
import { ErrorMessage } from '@/components/errors/ErrorBoundary';
import { useEvents } from '@/hooks/useEvents';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { notifications } = useNotificationStore();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const { events, loading, error, meta, filters, applyFilters, refetch } = useEvents(true);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-ink">
              مرحباً {user?.displayName?.split(' ')[0] ?? 'there'}
            </h1>
            <p className="text-sm text-ink-muted">اكتشف الفعاليات القريبة منك</p>
          </div>
          <button
            onClick={() => router.push('/notifications')}
            className="relative w-10 h-10 bg-surface rounded-xl shadow-card border border-border flex items-center justify-center hover:shadow-card-hover transition-shadow"
          >
            <Bell size={18} className="text-ink-soft" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Create CTA */}
        <button
          onClick={() => router.push('/create-event')}
          className="w-full bg-brand-green text-white rounded-2xl p-4 flex items-center gap-3 shadow-md hover:bg-brand-green-dark transition active:scale-[0.98]"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <PlusCircle size={20} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm">نظّم فعالية</p>
            <p className="text-xs text-white/80">ادعُ مجتمعك إلى شيء حقيقي</p>
          </div>
        </button>

        {/* Filters */}
        <EventFiltersBar filters={filters} onChange={applyFilters} />

        {/* Content */}
        {loading ? (
          <EventListSkeleton count={4} />
        ) : error ? (
          <ErrorMessage message={error} onRetry={refetch} />
        ) : events.length === 0 ? (
          <EmptyState
            icon={<Trees size={20} />}
            title="لا توجد فعاليات"
            description="كن أول من ينشئ فعالية في منطقتك"
            action={
              <Button size="sm" onClick={() => router.push('/create-event')}>
                إنشاء فعالية
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {events.map((event) => <EventCard key={event.id} event={event} />)}
            {meta?.hasNext && (
              <button
                onClick={() => applyFilters({ ...filters, page: (meta.page ?? 1) + 1 })}
                className="w-full py-3 text-sm text-brand-blue font-medium hover:underline"
              >
                تحميل المزيد
              </button>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

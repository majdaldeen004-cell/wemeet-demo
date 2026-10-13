'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Bell, BellOff, CheckCheck, Check,
  Calendar, Users, MessageSquare, Flag, Zap, UserPlus,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { AppShell } from '@/components/layout/AppShell';
import { Card, Button } from '@/components/ui';
import { apiClient } from '@/lib/api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type Notification = {
  id:        string;
  type:      string;
  title:     string;
  body:      string;
  data:      Record<string, unknown>;
  readAt:    string | null;
  createdAt: string;
};

// ─── Type → icon + colour ─────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; bg: string; ring: string }> = {
  event_invite:    { icon: <Calendar  size={16} />, bg: 'bg-green-100',  ring: 'text-green-600'  },
  event_update:    { icon: <Zap       size={16} />, bg: 'bg-blue-100',   ring: 'text-blue-600'   },
  event_starting:  { icon: <Zap       size={16} />, bg: 'bg-amber-100',  ring: 'text-amber-600'  },
  friend_request:  { icon: <UserPlus  size={16} />, bg: 'bg-blue-100',   ring: 'text-blue-600'   },
  friend_accepted: { icon: <Users     size={16} />, bg: 'bg-green-100',  ring: 'text-green-600'  },
  message:         { icon: <MessageSquare size={16} />, bg: 'bg-blue-100', ring: 'text-blue-600' },
  red_flag:        { icon: <Flag      size={16} />, bg: 'bg-red-100',    ring: 'text-red-600'    },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? {
    icon: <Bell size={16} />,
    bg:   'bg-slate-100',
    ring: 'text-slate-500',
  };
}

// ─── Single notification row ──────────────────────────────────────────────────

function NotifRow({
  item,
  onMarkRead,
}: {
  item: Notification;
  onMarkRead: (id: string) => void;
}) {
  const cfg    = getConfig(item.type);
  const isRead = item.readAt !== null;

  return (
    <div
      className={`flex items-start gap-4 p-4 transition-colors ${
        isRead ? 'bg-transparent' : 'bg-green-50/60'
      }`}
    >
      {/* Unread indicator */}
      <div className="flex-shrink-0 flex items-center justify-center mt-1">
        {!isRead && <span className="w-2 h-2 rounded-full bg-green-500 mr-1" />}
        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full ${cfg.bg} ${cfg.ring}`}>
          {cfg.icon}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${isRead ? 'text-ink-soft font-medium' : 'text-ink font-bold'}`}>
          {item.title}
        </p>
        <p className="text-sm text-ink-muted mt-0.5 leading-relaxed">{item.body}</p>
        <p className="text-xs text-ink-muted mt-1.5">
          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ar })}
        </p>
      </div>

      {/* Mark single read */}
      {!isRead && (
        <button
          onClick={() => onMarkRead(item.id)}
          title="تحديد كمقروء"
          className="flex-shrink-0 mt-1 text-ink-muted hover:text-green-600 transition-colors p-1 rounded-lg hover:bg-green-50"
        >
          <Check size={15} />
        </button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [items,      setItems]      = useState<Notification[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [page,       setPage]       = useState(1);
  const [hasMore,    setHasMore]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  const unreadCount = items.filter((n) => !n.readAt).length;

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchPage = useCallback(async (p: number, replace = false) => {
    try {
      const res = await apiClient.get<{
        data: { items: Notification[]; total: number };
      }>('/notifications', { params: { page: p, limit: 30 } });

      const incoming = res.data.data.items;
      setItems((prev) => replace ? incoming : [...prev, ...incoming]);
      setHasMore(incoming.length === 30);
      setPage(p);
      setError(null);
    } catch {
      setError('تعذّر تحميل الإشعارات');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPage(1, true).finally(() => setLoading(false));
  }, [fetchPage]);

  // ── Mark single read (optimistic) ──────────────────────────────────────────

  const handleMarkRead = useCallback(async (id: string) => {
    setItems((prev) =>
      prev.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n),
    );
    try {
      await apiClient.patch('/notifications/read', { id });
    } catch {
      setItems((prev) => prev.map((n) => n.id === id ? { ...n, readAt: null } : n));
    }
  }, []);

  // ── Mark all read ──────────────────────────────────────────────────────────

  const handleMarkAllRead = useCallback(async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));
    try {
      await apiClient.patch('/notifications/read', {});
    } catch {
      await fetchPage(1, true);
    } finally {
      setMarkingAll(false);
    }
  }, [unreadCount, fetchPage]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-ink" />
            <h1 className="text-xl font-bold text-ink">الإشعارات</h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-green-500 text-white text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              loading={markingAll}
              onClick={handleMarkAllRead}
            >
              <CheckCheck size={15} />
              تحديد الكل كمقروء
            </Button>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <Card className="divide-y divide-border overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4 animate-pulse">
                <div className="w-9 h-9 rounded-full bg-sand-dark flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-sand-dark rounded w-2/3" />
                  <div className="h-3 bg-sand-dark rounded w-full" />
                  <div className="h-3 bg-sand-dark rounded w-1/4" />
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* Error */}
        {!loading && error && (
          <Card className="p-8 flex flex-col items-center gap-3 text-center">
            <BellOff size={36} className="text-ink-muted" />
            <p className="text-sm text-ink-muted">{error}</p>
            <Button size="sm" onClick={() => fetchPage(1, true)}>إعادة المحاولة</Button>
          </Card>
        )}

        {/* Empty */}
        {!loading && !error && items.length === 0 && (
          <Card className="p-12 flex flex-col items-center gap-3 text-center">
            <BellOff size={44} className="text-ink-muted" />
            <p className="text-base font-semibold text-ink">لا توجد إشعارات</p>
            <p className="text-sm text-ink-muted">ستظهر إشعاراتك هنا عند وصولها</p>
          </Card>
        )}

        {/* Notification list */}
        {!loading && items.length > 0 && (
          <Card className="overflow-hidden divide-y divide-border">
            {items.map((item) => (
              <NotifRow key={item.id} item={item} onMarkRead={handleMarkRead} />
            ))}

            {/* Load more */}
            {hasMore && (
              <div className="p-4 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchPage(page + 1)}
                >
                  تحميل المزيد
                </Button>
              </div>
            )}
          </Card>
        )}
      </div>
    </AppShell>
  );
}

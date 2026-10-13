'use client';
import { useEffect, useState } from 'react';
import { Check, X, UserPlus, Users, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { AppShell } from '@/components/layout/AppShell';
import { Avatar, Card, Badge, Button, EmptyState } from '@/components/ui';
import { InlineLoader } from '@/components/ui/Skeletons';
import { friendsApi } from '@/lib/api';
import type { Friend } from '@/types';

interface PendingRequest {
  id: string;
  from: { id: string; displayName: string; avatarUrl: string | null };
  at: string;
}

export default function FriendsPage() {
  const [friends, setFriends]   = useState<Friend[]>([]);
  const [pending, setPending]   = useState<PendingRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<'friends' | 'pending'>('friends');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [fl, pl] = await Promise.all([
        friendsApi.list(),
        friendsApi.pending(),
      ]);
      setFriends(fl.items);
      setPending(pl.received as PendingRequest[]);
    } catch { toast.error('Failed to load friends'); }
    finally { setLoading(false); }
  };

  const respond = async (friendshipId: string, action: 'accept' | 'decline') => {
    try {
      await friendsApi.respond(friendshipId, action);
      toast.success(action === 'accept' ? 'Friend request accepted!' : 'Request declined');
      loadAll();
    } catch { toast.error('Failed to respond'); }
  };

  const TABS = [
    { key: 'friends', label: `Friends (${friends.length})` },
    { key: 'pending', label: `طلبات الصداقة (${pending.length})` },
  ];

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-xl font-bold text-ink">Friends</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-sand-dark p-1 rounded-xl">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === t.key
                  ? 'bg-surface text-ink shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <InlineLoader />
        ) : tab === 'friends' ? (
          friends.length === 0 ? (
            <EmptyState
              icon={<Users size={20} />}
              title="No friends yet"
              description="Join events and connect with people"
            />
          ) : (
            <Card className="divide-y divide-border">
              {friends.map((f) => (
                <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar src={f.friend.avatarUrl} name={f.friend.displayName} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">{f.friend.displayName}</p>
                    <p className="text-xs text-ink-muted">أصدقاء منذ {new Date(f.since).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </Card>
          )
        ) : pending.length === 0 ? (
          <EmptyState icon={<Mail size={32} />} title="لا توجد طلبات معلّقة" />
        ) : (
          <Card className="divide-y divide-border">
            {pending.map((req) => (
              <div key={req.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar src={req.from.avatarUrl} name={req.from.displayName} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">{req.from.displayName}</p>
                  <p className="text-xs text-ink-muted">wants to be your friend</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => respond(req.id, 'accept')}
                    className="w-8 h-8 rounded-full bg-brand-green-light text-brand-green flex items-center justify-center hover:bg-brand-green hover:text-white transition"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => respond(req.id, 'decline')}
                    className="w-8 h-8 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </AppShell>
  );
}

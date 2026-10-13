'use client';
import { useRouter } from 'next/navigation';
import { MessageCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { AppShell } from '@/components/layout/AppShell';
import { Avatar, Card, EmptyState } from '@/components/ui';
import { InlineLoader } from '@/components/ui/Skeletons';
import { useInbox } from '@/hooks/useMessages';
import { useAuthStore } from '@/store/authStore';
import { clsx } from 'clsx';

export default function MessagesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { inbox, loading, reload } = useInbox();

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-ink">Messages</h1>
          <button
            onClick={reload}
            className="text-xs text-ink-muted hover:text-ink transition"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <InlineLoader />
        ) : inbox.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={20} />}
            title="No conversations yet"
            description="Add friends and start chatting after joining events together"
          />
        ) : (
          <Card className="divide-y divide-border overflow-hidden">
            {inbox.map((conv) => (
              <button
                key={conv.partner.id}
                onClick={() => router.push(`/messages/${conv.partner.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-sand transition-colors text-left"
              >
                <div className="relative flex-shrink-0">
                  <Avatar
                    src={conv.partner.avatarUrl}
                    name={conv.partner.displayName}
                    size="md"
                  />
                  {!conv.lastMessage.isRead && conv.lastMessage.senderId !== user?.id && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-brand-green rounded-full border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={clsx(
                      'text-sm',
                      !conv.lastMessage.isRead && conv.lastMessage.senderId !== user?.id
                        ? 'font-bold text-ink'
                        : 'font-medium text-ink',
                    )}>
                      {conv.partner.displayName}
                    </span>
                    <span className="text-xs text-ink-muted flex-shrink-0">
                      {format(new Date(conv.lastMessage.createdAt), 'HH:mm')}
                    </span>
                  </div>
                  <p className={clsx(
                    'text-xs truncate mt-0.5',
                    !conv.lastMessage.isRead && conv.lastMessage.senderId !== user?.id
                      ? 'text-ink font-medium'
                      : 'text-ink-muted',
                  )}>
                    {conv.lastMessage.senderId === user?.id ? 'You: ' : ''}
                    {conv.lastMessage.content}
                  </p>
                </div>

                {!conv.lastMessage.isRead && conv.lastMessage.senderId !== user?.id && (
                  <span className="w-2 h-2 bg-brand-green rounded-full flex-shrink-0" />
                )}
              </button>
            ))}
          </Card>
        )}
      </div>
    </AppShell>
  );
}

'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { AppShell } from '@/components/layout/AppShell';
import { Avatar, Spinner } from '@/components/ui';
import { useMessages } from '@/hooks/useMessages';
import { useAuthStore } from '@/store/authStore';
import { usersApi } from '@/lib/api';
import type { User } from '@/types';

export default function ConversationPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { messages, loading, sending, send, hasMore, loadMore } = useMessages(userId);

  const [input, setInput] = useState('');
  const [partner, setPartner] = useState<User | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textRef   = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    usersApi.getUserById(userId).then(setPartner).catch(() => {});
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content) return;
    setInput('');
    await send(content);
    textRef.current?.focus();
  }, [input, send]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col h-screen md:h-[calc(100vh)]">

        {/* Header */}
        <div className="bg-surface border-b border-border px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => router.back()} className="text-ink-muted hover:text-ink transition">
            <ArrowLeft size={20} />
          </button>
          {partner ? (
            <>
              <Avatar src={partner.avatarUrl} name={partner.displayName} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink">{partner.displayName}</p>
                <p className="text-xs text-ink-muted">
                  {partner.isVerified ? '✓ Verified' : 'Member'}
                </p>
              </div>
            </>
          ) : (
            <div className="w-32 h-4 bg-sand-dark rounded animate-pulse" />
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {hasMore && (
            <button
              onClick={loadMore}
              className="w-full text-center text-xs text-brand-blue hover:underline py-2"
            >
              Load older messages
            </button>
          )}

          {loading && messages.length === 0 ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              
              <p className="text-sm text-ink-muted">
                Start a conversation with {partner?.displayName ?? '...'}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={clsx('flex gap-2 items-end', isMe && 'flex-row-reverse')}>
                  {!isMe && partner && (
                    <Avatar src={partner.avatarUrl} name={partner.displayName} size="sm" />
                  )}
                  <div className={clsx('max-w-[75%] space-y-0.5', isMe && 'items-end flex flex-col')}>
                    <div className={clsx(
                      'px-3 py-2 rounded-2xl text-sm leading-relaxed',
                      isMe
                        ? 'bg-brand-green text-white rounded-tr-sm'
                        : 'bg-surface text-ink border border-border rounded-tl-sm',
                    )}>
                      {msg.content}
                    </div>
                    <p className="text-[10px] text-ink-muted px-1">
                      {format(new Date(msg.createdAt), 'HH:mm')}
                      {msg.readAt && isMe ? ' · Read' : ''}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="bg-surface border-t border-border px-4 py-3 flex gap-2 items-end flex-shrink-0">
          <textarea
            ref={textRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Message..."
            rows={1}
            maxLength={2000}
            className="flex-1 resize-none bg-sand-dark rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green placeholder:text-ink-muted max-h-32 overflow-y-auto"
            style={{ minHeight: 40 }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0',
              input.trim() && !sending
                ? 'bg-brand-green text-white hover:bg-brand-green-dark active:scale-95'
                : 'bg-sand text-ink-muted',
            )}
          >
            {sending
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Send size={16} />
            }
          </button>
        </div>
      </div>
    </AppShell>
  );
}

'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, Users, Wifi, WifiOff } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { AppShell } from '@/components/layout/AppShell';
import { Avatar, Spinner } from '@/components/ui';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { useChat } from '@/hooks/useChat';
import type { ChatMessage } from '@/types';

export default function ChatPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { messages, members, eventTitle, connected, typingUsers, activeRoom } = useChatStore();
  const { sendMessage, sendTyping } = useChat(roomId);

  const [input, setInput] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
    sendTyping(false);
    inputRef.current?.focus();
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    sendTyping(e.target.value.length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const typingNames = Object.values(typingUsers).map((u) => u.displayName);
  const isExpired = activeRoom !== roomId;

  return (
    <AppShell>
      <div className="flex flex-col h-screen md:h-[calc(100vh-0px)]">
        {/* Header */}
        <div className="bg-surface border-b border-border px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => router.back()} className="text-ink-muted hover:text-ink">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-ink text-sm truncate">{eventTitle || 'Event chat'}</h2>
            <div className="flex items-center gap-1.5 text-xs text-ink-muted">
              {connected
                ? <><Wifi size={11} className="text-brand-green" /> Live</>
                : <><WifiOff size={11} className="text-red-400" /> Reconnecting...</>
              }
            </div>
          </div>
          <button
            onClick={() => setShowMembers(!showMembers)}
            className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink transition"
          >
            <Users size={16} />
            <span>{members.length}</span>
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && !connected && (
              <div className="flex items-center justify-center py-12">
                <Spinner />
              </div>
            )}

            {messages.length === 0 && connected && (
              <div className="text-center py-12 text-ink-muted text-sm">
                
                <p>No messages yet. Say hello!</p>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble key={msg.id ?? msg.localId} msg={msg} isMe={msg.senderId === user?.id} />
            ))}

            {typingNames.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <div className="flex gap-0.5">
                  {[0,1,2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-brand-green animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <span>{typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing...</span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Members sidebar (desktop) */}
          {showMembers && (
            <div className="w-56 border-l border-border bg-surface hidden md:block overflow-y-auto p-3 space-y-2 flex-shrink-0">
              <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide px-1 mb-3">
                Members ({members.length})
              </p>
              {members.map((m) => (
                <div key={m.userId} className="flex items-center gap-2">
                  <Avatar src={m.avatarUrl} name={m.displayName} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-ink truncate">{m.displayName}</p>
                    {m.role === 'organizer' && (
                      <p className="text-[10px] text-brand-green">Organizer</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="bg-surface border-t border-border px-4 py-3 flex gap-3 items-center flex-shrink-0">
          <input
            ref={inputRef}
            className="flex-1 bg-sand-dark rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green placeholder:text-ink-muted"
            placeholder={connected ? 'Message...' : 'Connecting...'}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={!connected}
            maxLength={1000}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !connected}
            className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
              input.trim() && connected
                ? 'bg-brand-green text-white hover:bg-brand-green-dark active:scale-95'
                : 'bg-sand text-ink-muted',
            )}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </AppShell>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

const MessageBubble = ({ msg, isMe }: { msg: ChatMessage; isMe: boolean }) => (
  <div className={clsx('flex gap-2', isMe && 'flex-row-reverse')}>
    {!isMe && (
      <Avatar src={msg.avatarUrl} name={msg.displayName} size="sm" />
    )}
    <div className={clsx('max-w-[75%] space-y-0.5', isMe && 'items-end flex flex-col')}>
      {!isMe && (
        <p className="text-[11px] text-ink-muted font-medium px-1">{msg.displayName}</p>
      )}
      <div className={clsx(
        'px-3 py-2 rounded-2xl text-sm leading-relaxed',
        isMe
          ? 'bg-brand-green text-white rounded-tr-sm'
          : 'bg-surface text-ink border border-border rounded-tl-sm',
        msg.pending && 'opacity-60',
      )}>
        {msg.content}
      </div>
      <p className="text-[10px] text-ink-muted px-1">
        {format(new Date(msg.createdAt), 'HH:mm')}
        {msg.pending && ' · sending...'}
      </p>
    </div>
  </div>
);

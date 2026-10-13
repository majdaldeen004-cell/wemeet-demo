'use client';
import { useState, useCallback, useEffect } from 'react';
import { messagesApi } from '@/lib/api';
import { useNotificationStore } from '@/store/notificationStore';
import toast from 'react-hot-toast';
import type { DirectMessage } from '@/types';

interface ConversationState {
  messages: DirectMessage[];
  loading:  boolean;
  sending:  boolean;
  hasMore:  boolean;
  page:     number;
}

export const useMessages = (targetUserId: string) => {
  const { setUnreadMessages } = useNotificationStore();
  const [state, setState] = useState<ConversationState>({
    messages: [], loading: true, sending: false, hasMore: false, page: 1,
  });

  const load = useCallback(async (page = 1, prepend = false) => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await messagesApi.conversation(targetUserId, page);
      setState((s) => ({
        ...s,
        loading: false,
        page,
        hasMore: res.meta.hasPrev,
        messages: prepend
          ? [...res.items, ...s.messages]
          : res.items,
      }));
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [targetUserId]);

  useEffect(() => { load(1); }, [targetUserId]);

  const send = useCallback(async (content: string): Promise<boolean> => {
    setState((s) => ({ ...s, sending: true }));
    try {
      const msg = await messagesApi.send(targetUserId, content);
      setState((s) => ({ ...s, sending: false, messages: [...s.messages, msg] }));
      return true;
    } catch {
      toast.error('Failed to send message');
      setState((s) => ({ ...s, sending: false }));
      return false;
    }
  }, [targetUserId]);

  const loadMore = useCallback(() => {
    if (!state.hasMore || state.loading) return;
    load(state.page + 1, true);
  }, [state.hasMore, state.loading, state.page, load]);

  // Refresh unread count
  const refreshUnread = useCallback(async () => {
    try {
      const { count } = await messagesApi.unreadCount();
      setUnreadMessages(count);
    } catch { /* silent */ }
  }, [setUnreadMessages]);

  return { ...state, send, loadMore, reload: () => load(1), refreshUnread };
};

export const useInbox = () => {
  const [inbox, setInbox] = useState<{
    partner: { id: string; displayName: string; avatarUrl: string | null };
    lastMessage: { content: string; senderId: string; createdAt: string; isRead: boolean };
  }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await messagesApi.inbox();
      setInbox(data as typeof inbox);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  return { inbox, loading, reload: load };
};

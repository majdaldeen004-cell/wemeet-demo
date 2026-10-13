'use client';
import { useEffect, useCallback } from 'react';
import { messagesApi, friendsApi } from '@/lib/api';
import { useNotificationStore } from '@/store/notificationStore';
import { socketManager } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const POLL_INTERVAL_MS = 30_000;

export const useNotifications = () => {
  const { isAuthenticated } = useAuthStore();
  const {
    addNotification, setUnreadMessages, setUnreadFriends,
    unreadMessages, unreadFriends, notifications,
  } = useNotificationStore();

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [{ count }, pending] = await Promise.all([
        messagesApi.unreadCount(),
        friendsApi.pending(),
      ]);
      setUnreadMessages(count);
      setUnreadFriends((pending.received as unknown[]).length);
    } catch { /* silent */ }
  }, [isAuthenticated, setUnreadMessages, setUnreadFriends]);

  // Initial + polling
  useEffect(() => {
    if (!isAuthenticated) return;
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isAuthenticated, refresh]);

  // Socket: real-time DM notification while NOT in chat
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = socketManager.getSocket();
    if (!socket) return;

    const handleNewMsg = (msg: { senderId: string; displayName: string; content: string }) => {
      setUnreadMessages(useNotificationStore.getState().unreadMessages + 1);
      addNotification({
        type:  'message',
        title: `New message from ${msg.displayName}`,
        body:  msg.content.slice(0, 60),
        href:  `/messages/${msg.senderId}`,
      });
      toast(`${msg.displayName}: ${msg.content.slice(0, 40)}`, {
        duration: 4000,
        style: { background: '#0f172a', color: '#fff' },
      });
    };

    socket.on('msg:received', handleNewMsg as never);
    return () => { socket.off('msg:received', handleNewMsg as never); };
  }, [isAuthenticated, addNotification, setUnreadMessages]);

  return { unreadMessages, unreadFriends, notifications, refresh };
};

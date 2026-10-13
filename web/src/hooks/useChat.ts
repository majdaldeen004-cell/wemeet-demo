'use client';
import { useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { socketManager } from '@/lib/socket';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import type { ChatMessage } from '@/types';

export const useChat = (eventId: string) => {
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const store = useChatStore();
  const user  = useAuthStore((s) => s.user);

  useEffect(() => {
    const socket = socketManager.connect();
    store.setConnected(socket.connected);

    socket.on('connect',    () => store.setConnected(true));
    socket.on('disconnect', () => store.setConnected(false));

    // Join room
    socket.emit('room:join', { eventId });

    socket.on('room:joined', (payload) => {
      store.setRoom(payload.eventId, payload.eventTitle, payload.expiresAt);
      store.setHistory(payload.history as ChatMessage[]);
      store.setMembers(payload.members);
      store.setConnected(true);
    });

    socket.on('msg:received', (msg) => {
      store.addMessage(msg as ChatMessage);
    });

    socket.on('msg:ack', ({ localId, serverMsgId, createdAt }) => {
      store.ackMessage(localId, serverMsgId, createdAt);
    });

    socket.on('room:member_join', (member) => {
      store.addMember(member);
    });

    socket.on('room:member_left', ({ userId }) => {
      store.removeMember(userId);
    });

    socket.on('msg:typing', ({ userId, displayName, isTyping }) => {
      if (userId !== user?.id) store.setTyping(userId, displayName, isTyping);
    });

    socket.on('room:expired', () => {
      store.clearRoom();
    });

    socket.on('error', (err) => {
      console.error('[Chat error]', err);
    });

    return () => {
      socket.emit('room:leave', { eventId });
      socket.off('room:joined');
      socket.off('msg:received');
      socket.off('msg:ack');
      socket.off('room:member_join');
      socket.off('room:member_left');
      socket.off('msg:typing');
      socket.off('room:expired');
      socket.off('error');
      store.clearRoom();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return;
    const socket = socketManager.getSocket();
    if (!socket) return;

    const localId = uuidv4();

    // Optimistic update
    const optimistic: ChatMessage = {
      id:          localId,
      eventId,
      senderId:    user?.id ?? '',
      displayName: user?.displayName ?? '',
      avatarUrl:   user?.avatarUrl ?? null,
      content:     content.trim(),
      createdAt:   new Date().toISOString(),
      localId,
      pending:     true,
    };
    store.addMessage(optimistic);

    socket.emit('msg:send', { eventId, content: content.trim(), localId });
  }, [eventId, user, store]);

  const sendTyping = useCallback((isTyping: boolean) => {
    const socket = socketManager.getSocket();
    if (!socket) return;
    socket.emit('msg:typing', { eventId, isTyping });

    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (isTyping) {
      typingTimer.current = setTimeout(() => {
        socket.emit('msg:typing', { eventId, isTyping: false });
      }, 2500);
    }
  }, [eventId]);

  return { sendMessage, sendTyping };
};

import { create } from 'zustand';
import type { ChatMessage, RoomMember } from '@/types';

interface ChatStore {
  activeRoom:   string | null;
  eventTitle:   string;
  messages:     ChatMessage[];
  members:      RoomMember[];
  roomExpiry:   string | null;
  connected:    boolean;
  typingUsers:  Record<string, { displayName: string; timeout: ReturnType<typeof setTimeout> }>;

  setRoom:         (eventId: string, title: string, expiry: string) => void;
  setHistory:      (msgs: ChatMessage[]) => void;
  addMessage:      (msg: ChatMessage) => void;
  ackMessage:      (localId: string, serverId: string, createdAt: string) => void;
  setMembers:      (members: RoomMember[]) => void;
  addMember:       (member: RoomMember) => void;
  removeMember:    (userId: string) => void;
  setConnected:    (v: boolean) => void;
  setTyping:       (userId: string, displayName: string, isTyping: boolean) => void;
  clearRoom:       () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  activeRoom:   null,
  eventTitle:   '',
  messages:     [],
  members:      [],
  roomExpiry:   null,
  connected:    false,
  typingUsers:  {},

  setRoom: (eventId, title, expiry) =>
    set({ activeRoom: eventId, eventTitle: title, roomExpiry: expiry }),

  setHistory: (msgs) => set({ messages: msgs }),

  addMessage: (msg) => {
    const existing = get().messages.find((m) => m.id === msg.id || m.localId === msg.id);
    if (existing) return;
    set({ messages: [...get().messages, msg] });
  },

  ackMessage: (localId, serverId, createdAt) => {
    set({
      messages: get().messages.map((m) =>
        m.localId === localId
          ? { ...m, id: serverId, createdAt, pending: false, localId: undefined }
          : m,
      ),
    });
  },

  setMembers:   (members) => set({ members }),
  addMember:    (member)  => set({ members: [...get().members.filter((m) => m.userId !== member.userId), member] }),
  removeMember: (userId)  => set({ members: get().members.filter((m) => m.userId !== userId) }),
  setConnected: (v)       => set({ connected: v }),

  setTyping: (userId, displayName, isTyping) => {
    const current = { ...get().typingUsers };
    if (current[userId]) clearTimeout(current[userId].timeout);
    if (!isTyping) {
      delete current[userId];
    } else {
      const timeout = setTimeout(() => {
        const next = { ...get().typingUsers };
        delete next[userId];
        set({ typingUsers: next });
      }, 3000);
      current[userId] = { displayName, timeout };
    }
    set({ typingUsers: current });
  },

  clearRoom: () => set({
    activeRoom: null, eventTitle: '', messages: [],
    members: [], roomExpiry: null, connected: false, typingUsers: {},
  }),
}));

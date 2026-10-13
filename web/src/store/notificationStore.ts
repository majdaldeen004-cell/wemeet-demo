import { create } from 'zustand';

export interface AppNotification {
  id:        string;
  type:      'friend_request' | 'event_approved' | 'message' | 'red_flag' | 'system';
  title:     string;
  body:      string;
  href?:     string;
  read:      boolean;
  createdAt: string;
}

interface NotificationStore {
  notifications: AppNotification[];
  unreadMessages: number;
  unreadFriends:  number;

  addNotification:   (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void;
  markRead:          (id: string) => void;
  markAllRead:       () => void;
  setUnreadMessages: (n: number) => void;
  setUnreadFriends:  (n: number) => void;
  clear:             () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications:  [],
  unreadMessages: 0,
  unreadFriends:  0,

  addNotification: (n) =>
    set({
      notifications: [
        {
          ...n,
          id:        crypto.randomUUID(),
          read:      false,
          createdAt: new Date().toISOString(),
        },
        ...get().notifications,
      ].slice(0, 50), // cap at 50
    }),

  markRead: (id) =>
    set({
      notifications: get().notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    }),

  markAllRead: () =>
    set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) }),

  setUnreadMessages: (n) => set({ unreadMessages: n }),
  setUnreadFriends:  (n) => set({ unreadFriends: n }),
  clear:             ()  => set({ notifications: [], unreadMessages: 0, unreadFriends: 0 }),
}));

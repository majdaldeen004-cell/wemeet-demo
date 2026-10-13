'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Home, MapPin, PlusCircle, User, Users, Settings, MessageCircle, Bell } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';

const NAV_BOTTOM = [
  { label: 'الرئيسية',   href: '/home',           icon: Home },
  { label: 'الخريطة',   href: '/events/map',      icon: MapPin },
  { label: 'إنشاء',     href: '/create-event',    icon: PlusCircle },
  { label: 'الرسائل',   href: '/messages',        icon: MessageCircle, badge: 'messages' as const },
  { label: 'الإشعارات', href: '/notifications',   icon: Bell,          badge: 'notifications' as const },
  { label: 'حسابي',     href: '/profile',         icon: User },
];

const SIDEBAR_NAV = [
  { label: 'الرئيسية',    href: '/home',            icon: Home },
  { label: 'الخريطة',    href: '/events/map',       icon: MapPin },
  { label: 'إنشاء فعالية', href: '/create-event',  icon: PlusCircle },
  { label: 'الرسائل',    href: '/messages',         icon: MessageCircle, badge: 'messages' as const },
  { label: 'الأصدقاء',   href: '/friends',          icon: Users,         badge: 'friends' as const },
  { label: 'حسابي',      href: '/profile',          icon: User },
  { label: 'الإشعارات',  href: '/notifications',    icon: Bell,          badge: 'notifications' as const },
  { label: 'Game Hub',   href: '/gaming',            icon: MapPin },
  { label: 'الإعدادات',  href: '/settings',          icon: Settings },
];

export const BottomNav = () => {
  const path = usePathname();
  const { unreadMessages, unreadFriends, notifications } = useNotificationStore();
  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const badgeCount = (badge?: string) => {
    if (badge === 'messages')      return unreadMessages;
    if (badge === 'notifications') return unreadNotifications;
    return 0;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-sm border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {NAV_BOTTOM.map(({ label, href, icon: Icon, badge }) => {
          const active = path === href || (href !== '/home' && path.startsWith(href));
          const count  = badgeCount(badge);
          return (
            <Link key={label} href={href}
              className={clsx(
                'relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors',
                active ? 'text-brand-green' : 'text-ink-muted hover:text-ink',
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              {count > 0 && (
                <span className="absolute -top-0.5 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {count > 99 ? '99+' : count}
                </span>
              )}
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export const Sidebar = () => {
  const path = usePathname();
  const { unreadMessages, unreadFriends, notifications } = useNotificationStore();

  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const badgeCount = (badge?: string) => {
    if (badge === 'messages')      return unreadMessages;
    if (badge === 'friends')       return unreadFriends;
    if (badge === 'notifications') return unreadNotifications;
    return 0;
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-surface border-r border-border px-4 py-8 gap-1 z-40">
      <div className="mb-8 px-2">
        <span className="text-2xl font-bold text-brand-green">We</span>
        <span className="text-2xl font-bold text-ink">Meet</span>
      </div>

      <div className="flex-1 space-y-1">
        {SIDEBAR_NAV.map(({ label, href, icon: Icon, badge }) => {
          const active = path === href || (href !== '/home' && path.startsWith(href));
          const count  = badgeCount(badge);
          return (
            <Link key={label} href={href}
              className={clsx(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-green-light text-brand-green-dark'
                  : 'text-ink-soft hover:bg-sand hover:text-ink',
              )}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              {label}
              {count > 0 && (
                <span className="ml-auto min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
};

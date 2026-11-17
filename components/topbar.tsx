'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from './ui/Icon';
import { createClient } from '@/lib/supabase/client';
import { getNotificationsAction, markNotificationsReadAction } from '@/app/actions';

type Notification = {
  id: string;
  title: string;
  body?: string | null;
  type: string;
  read: boolean;
  time: string;
  projectCode?: string | null;
};

function relativeTime(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d}d ago` : new Date(iso).toLocaleDateString();
}

export default function Topbar({
  onMenuToggle,
  onOpenSearch,
  isDark,
  onToggleTheme,
}: {
  onMenuToggle?: () => void;
  onOpenSearch?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}) {
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      const u = data.user;
      setEmail(u?.email ?? '');
      setName((u?.user_metadata?.full_name as string) || u?.email?.split('@')[0] || 'User');
    });
  }, []);

  useEffect(() => {
    if (notifOpen) {
      getNotificationsAction().then((rows) => setNotifications(rows as Notification[]));
    }
  }, [notifOpen]);

  const unread = notifications.filter((n) => !n.read).length;

  async function markAllRead() {
    try {
      await markNotificationsReadAction();
      setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
    } catch { /* keep existing state on failure */ }
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="bg-surface border-b border-border h-14 flex items-center px-4 md:px-6 gap-3 shrink-0">
      <button
        onClick={onMenuToggle}
        className="md:hidden p-2 rounded hover:bg-surface-2 transition-colors focus-ring"
        aria-label="Open sidebar"
      >
        <Icon name="menu" size={20} className="text-text-dim" />
      </button>

      {/* Command palette trigger — replaces the previous dead search box */}
      <button
        onClick={onOpenSearch}
        className="flex items-center gap-2 w-full max-w-md text-left px-3 py-2 rounded-md bg-surface-2 border border-border text-text-faint hover:border-blue/50 transition-colors focus-ring"
      >
        <Icon name="search" size={15} className="shrink-0" />
        <span className="flex-1 text-sm truncate">Search projects, actions...</span>
        <span className="kbd hidden sm:inline-flex">⌘ K</span>
      </button>

      <div className="ml-auto flex items-center gap-1 md:gap-2">
        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded hover:bg-surface-2 text-text-dim transition-colors focus-ring"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          <Icon name={isDark ? 'sun' : 'moon'} size={18} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }}
            className="p-2 rounded hover:bg-surface-2 text-text-dim transition-colors focus-ring relative"
            aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
          >
            <Icon name="bell" size={18} />
            {unread > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-red text-white text-[10px] font-bold flex items-center justify-center tabnums">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-11 z-40 w-[min(380px,calc(100vw-2rem))] bg-surface border border-border rounded-lg shadow-popover slide-up overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="font-semibold text-sm">Notifications</span>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-xs text-blue hover:underline focus-ring">
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 && (
                    <p className="px-4 py-10 text-center text-sm text-text-faint">You're all caught up.</p>
                  )}
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        setNotifOpen(false);
                        if (n.projectCode) {
                          router.push(`/projects?q=${encodeURIComponent(n.projectCode)}`);
                        } else router.push('/dashboard');
                      }}
                      className={`w-full flex gap-3 px-4 py-3 text-left border-b border-border last:border-0 hover:bg-surface-2 transition-colors ${
                        !n.read ? 'bg-blue/5' : ''
                      }`}
                    >
                      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-transparent' : 'bg-blue'}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm leading-snug">{n.title}</span>
                        {n.body && <span className="block text-xs text-text-dim mt-0.5 truncate">{n.body}</span>}
                        <span className="block text-[11px] text-text-faint mt-1">{relativeTime(n.time)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-md hover:bg-surface-2 transition-colors focus-ring"
            title="Account menu"
          >
            <span className="hidden md:block text-xs text-text-dim max-w-32 truncate">{name}</span>
            <span className="w-8 h-8 rounded-full bg-blue text-white flex items-center justify-center text-xs font-bold">
              {initials}
            </span>
          </button>
          {userOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setUserOpen(false)} />
              <div className="absolute right-0 top-11 z-40 w-60 bg-surface border border-border rounded-lg shadow-popover slide-up p-2">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-sm font-medium truncate">{name}</p>
                  <p className="text-xs text-text-faint truncate">{email}</p>
                </div>
                <button
                  onClick={() => { setUserOpen(false); router.push('/settings'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm hover:bg-surface-2 text-left"
                >
                  <Icon name="settings" size={15} /> Settings
                </button>
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm hover:bg-red-soft text-red text-left"
                >
                  <Icon name="logout" size={15} /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

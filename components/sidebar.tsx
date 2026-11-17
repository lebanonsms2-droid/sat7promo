'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './ui/Icon';

const sidebarLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { name: 'Projects', href: '/projects', icon: 'projects' },
  { name: 'New Request', href: '/new', icon: 'plus' },
  { name: 'Programs', href: '/programs', icon: 'programs' },
  { name: 'Channels', href: '/channels', icon: 'channels' },
  { name: 'Production Board', href: '/production', icon: 'calendar' },
  { name: 'Calendar', href: '/calendar', icon: 'calendar' },
  { name: 'Team & Workload', href: '/users', icon: 'users' },
  { name: 'Reports & Analytics', href: '/reports', icon: 'reports' },
  { name: 'Settings', href: '/settings', icon: 'settings' },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`bg-sidebar text-sidebar-text w-64 shrink-0 flex flex-col h-screen transition-all duration-300 ${
        isCollapsed ? 'hidden' : 'flex'
      }`}
    >
      <div className="flex items-center justify-between h-16 border-b border-border px-4">
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded bg-blue flex items-center justify-center shrink-0">
            <Icon name="dashboard" size={20} className="text-blue" />
          </div>
          <span className="text-lg font-display font-bold truncate">SAT-7 Promo Desk</span>
        </Link>
        <button
          onClick={onToggle}
          className="p-2 rounded hover:bg-surface-2 transition-colors"
          aria-label="Close sidebar"
        >
          <Icon name="minus" size={20} />
        </button>
      </div>

      <nav className="flex-1 flex flex-col p-2 overflow-y-auto">
        <ul className="flex flex-col space-y-1">
          {sidebarLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== '/dashboard' && pathname.startsWith(link.href + '/'));
            return (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-2 ${
                    isActive ? 'bg-surface-2 text-white' : 'text-sidebar-text'
                  }`}
                >
                  <Icon name={link.icon} size={16} className="shrink-0" />
                  <span className="truncate">{link.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto flex flex-col gap-2 p-2 border-t border-border">
        <div className="text-xs text-text-faint uppercase tracking-wider">SAT-7 Promo Desk</div>
      </div>
    </aside>
  );
}

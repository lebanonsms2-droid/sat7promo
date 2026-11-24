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
  { name: 'People', href: '/people', icon: 'users' },
  { name: 'Users', href: '/users', icon: 'users' },
  { name: 'Reports & Analytics', href: '/reports', icon: 'reports' },
  { name: 'Settings', href: '/settings', icon: 'settings' },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  onOpenSearch?: () => void;
}

export default function Sidebar({ isCollapsed = false, onToggle, onOpenSearch }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`bg-sidebar text-sidebar-text shrink-0 flex-col h-screen transition-[width] duration-200 overflow-hidden ${
        isCollapsed ? 'hidden md:flex md:w-16' : 'flex w-64'
      }`}
    >
      <div className="flex items-center h-14 border-b border-white/10 px-3 gap-2 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0" title="SAT-7 Promo Desk">
          <div className="w-8 h-8 rounded bg-red flex items-center justify-center shrink-0">
            <Icon name="dashboard" size={18} className="text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-sm font-display font-bold text-white truncate">SAT-7 Promo Desk</span>
          )}
        </Link>
        {!isCollapsed && (
          <button
            onClick={onToggle}
            className="ml-auto p-1.5 rounded hover:bg-white/10 transition-colors focus-ring"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <Icon name="minus" size={16} />
          </button>
        )}
      </div>

      {isCollapsed && (
        <button
          onClick={onToggle}
          className="mx-auto mt-3 p-2 rounded hover:bg-white/10 text-sidebar-text transition-colors focus-ring"
          aria-label="Expand sidebar"
          title="Expand sidebar"
        >
          <Icon name="menu" size={18} />
        </button>
      )}

      <nav className="flex-1 flex flex-col p-2 overflow-y-auto">
        <ul className="flex flex-col space-y-0.5">
          {sidebarLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== '/dashboard' && pathname.startsWith(link.href + '/'));
            return (
              <li key={link.name}>
                <Link
                  href={link.href}
                  title={isCollapsed ? link.name : undefined}
                  className={`relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-ring ${
                    isCollapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-sidebar-active text-white'
                      : 'hover:bg-white/[.06] hover:text-white'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-red" />
                  )}
                  <Icon name={link.icon} size={16} className="shrink-0" />
                  {!isCollapsed && <span className="truncate">{link.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-2 border-t border-white/10 space-y-1">
        <button
          onClick={onOpenSearch}
          title="Quick search (Ctrl+K)"
          className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-xs text-sidebar-text hover:bg-white/[.06] hover:text-white transition-colors focus-ring ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <Icon name="search" size={15} className="shrink-0" />
          {!isCollapsed && (
            <>
              <span>Quick search</span>
              <span className="ml-auto kbd border-white/15 bg-white/5 text-sidebar-text">⌘K</span>
            </>
          )}
        </button>
        {!isCollapsed && (
          <div className="px-3 py-2 text-[10px] text-sidebar-text uppercase tracking-widest">
            SAT-7 · Promo Department
          </div>
        )}
      </div>
    </aside>
  );
}

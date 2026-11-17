import * as React from 'react';
import { Icon } from './Icon';

const sidebarLinks = [
  { name: 'Dashboard', href: '/(app)', icon: 'dashboard', disabled: false },
  { name: 'Projects', href: '/(app)/projects', icon: 'projects', disabled: false },
  { name: 'New Request', href: '/(app)/new', icon: 'plus', disabled: false },
  { name: 'Programs', href: '/(app)/programs', icon: 'programs', disabled: false },
  { name: 'Channels', href: '/(app)/channels', icon: 'channels', disabled: false },
  { name: 'Production Board', href: '/(app)/production', icon: 'calendar', disabled: false },
  { name: 'Calendar', href: '/(app)/calendar', icon: 'calendar', disabled: false },
  { name: 'Team & Workload', href: '/(app)/users', icon: 'users', disabled: false },
  { name: 'Communication', href: '/(app)/communication', icon: 'mail', disabled: false },
  { name: 'Reports & Analytics', href: '/(app)/reports', icon: 'reports', disabled: false },
  { name: 'Notifications', href: '/(app)/notifications', icon: 'bell', disabled: false },
  { name: 'Settings', href: '/(app)/settings', icon: 'settings', disabled: false },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  return (
    <aside className={`bg-sidebar text-sidebar-text min-w-64 max-w-64 flex flex-col h-screen p-0 transition-all duration-300 ${isCollapsed ? 'pl-0 pr-2' : 'pl-4'}`}>
      <div className="flex items-center justify-between h-16 border-b border-border px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue flex items-center justify-center shrink-0">
            <Icon name="dashboard" size={20} className="text-blue" />
          </div>
          <span className="text-xl font-display font-bold">SAT-7 Promo Desk</span>
        </div>
        <button
          onClick={onToggle}
          className="p-2 rounded hover:bg-surface-2 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Icon name={isCollapsed ? 'plus' : 'minus'} size={20} />
        </button>
      </div>

      <nav className="flex-1 flex flex-col p-2 overflow-y-auto">
        <ul className="flex-flex flex flex-col space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = false; // Would need active path tracking
            return (
              <li
                key={link.name}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-text text-sm font-medium transition-colors hover:bg-surface-2 ${isActive ? 'bg-surface-2' : ''}`}
              >
                <Icon name={link.icon} size={16} className="text-sidebar-text mr-3" />
                <span>{link.name}</span>
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
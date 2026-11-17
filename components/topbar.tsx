import * as React from 'react';
import { Icon } from './ui/Icon';

export default function Topbar({ onMenuToggle }: { onMenuToggle?: () => void }) {
  return (
    <header className="bg-surface border-b border-border h-16 flex items-center px-6 shadow-sm">
      <button
        onClick={onMenuToggle}
        className="md:hidden p-2 rounded hover:bg-surface-2 transition-colors"
        aria-label="Open sidebar"
      >
        <Icon name="menu" size={24} className="text-sidebar-text" />
      </button>

      <div className="flex items-center gap-6 flex-1">
        <div className="relative">
          <Icon name="search" size={16} className="text-text-faint absolute left-3 top-1/2 -translate-y-1" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-8 pr-4 py-2 bg-surface-2 rounded text-input placeholder-text-text-dim font-medium w-64"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Icon name="bell" size={20} className="text-text-fant" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded w-2 h-2 flex items-center justify-center">
              3
            </span>
          </div>

          <div className="relative">
            <Icon name="mail" size={20} className="text-text-faint" />
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded w-2 h-2 flex items-center justify-center">
              5
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Icon name="moon" size={18} className="text-sidebar-text cursor-pointer" />
          <span className="absolute -bottom-1 -right-1 text-xs text-text-faint">Dark mode</span>
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded hover:bg-surface-2 transition-colors">
          <span className="text-text-dim text-xs">Hi, Admin</span>
          <Icon name="users" size={16} className="text-text-faint" />
        </div>
      </div>
    </header>
  );
}
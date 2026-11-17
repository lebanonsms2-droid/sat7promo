'use client';

import Sidebar from '@/components/sidebar';
import Topbar from '@/components/topbar';
import CommandPalette from '@/components/command-palette';
import { useEffect, useState } from 'react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    // Theme is applied pre-paint in root layout; hydrate React state from it.
    setIsDark(document.documentElement.classList.contains('dark'));
    setIsCollapsed(localStorage.getItem('sat7-sidebar-collapsed') === '1');

    // Global command palette shortcut (Cmd+K / Ctrl+K).
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function toggleSidebar() {
    setIsCollapsed((v) => {
      localStorage.setItem('sat7-sidebar-collapsed', v ? '0' : '1');
      return !v;
    });
  }

  function toggleTheme() {
    setIsDark((v) => {
      const next = !v;
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('sat7-theme', next ? 'dark' : 'light');
      return next;
    });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={toggleSidebar}
        onOpenSearch={() => setPaletteOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          onMenuToggle={toggleSidebar}
          onOpenSearch={() => setPaletteOpen(true)}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

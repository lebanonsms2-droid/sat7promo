'use client';

import Sidebar from '@/components/sidebar';
import Topbar from '@/components/topbar';
import { useEffect, useState } from 'react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuToggle={() => setIsCollapsed(true)} />

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

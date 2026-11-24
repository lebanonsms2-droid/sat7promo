'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from './ui/Icon';
import { getProjects } from '@/lib/queries';

export type PaletteItem = {
  id: string;
  label: string;
  hint: string;
  group: 'Recent' | 'Navigation' | 'Actions' | 'Projects';
  icon: string;
  href?: string;
};

export const NAV_ITEMS: PaletteItem[] = [
  { id: 'dashboard', label: 'Dashboard', hint: 'Overview and KPIs', group: 'Navigation', icon: 'dashboard', href: '/dashboard' },
  { id: 'projects', label: 'Projects', hint: 'All promo requests', group: 'Navigation', icon: 'projects', href: '/projects' },
  { id: 'new', label: 'New Request', hint: 'Create a promo request', group: 'Actions', icon: 'plus', href: '/new' },
  { id: 'programs', label: 'Programs', hint: 'Manage programs', group: 'Navigation', icon: 'programs', href: '/programs' },
  { id: 'channels', label: 'Channels', hint: 'Manage channels', group: 'Navigation', icon: 'channels', href: '/channels' },
  { id: 'production', label: 'Production Board', hint: 'Production workflow', group: 'Navigation', icon: 'calendar', href: '/production' },
  { id: 'calendar', label: 'Calendar', hint: 'Schedule view', group: 'Navigation', icon: 'calendar', href: '/calendar' },
  { id: 'people', label: 'People', hint: 'Team directory — edit & remove members', group: 'Navigation', icon: 'users', href: '/people' },
  { id: 'users', label: 'Users', hint: 'Manage accounts', group: 'Navigation', icon: 'users', href: '/users' },
  { id: 'reports', label: 'Reports & Analytics', hint: 'Insights and exports', group: 'Navigation', icon: 'reports', href: '/reports' },
  { id: 'settings', label: 'Settings', hint: 'Organization settings', group: 'Navigation', icon: 'settings', href: '/settings' },
];

const GROUP_ORDER: PaletteItem['group'][] = ['Recent', 'Actions', 'Navigation', 'Projects'];

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [projectItems, setProjectItems] = useState<PaletteItem[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem('sat7-recent') || '[]'));
    } catch { /* ignore malformed storage */ }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    const t = setTimeout(() => inputRef.current?.focus(), 20);
    if (!projectItems.length) {
      getProjects().then((rows) => {
        setProjectItems(rows.map((p: any) => ({
          id: 'project-' + p.id,
          label: p.project_code,
          hint: `${p.program?.name || p.requesting_dept || 'Project'} · ${p.status}`,
          group: 'Projects' as const,
          icon: 'file',
          href: `/projects?q=${encodeURIComponent(p.project_code)}`,
        })));
      });
    }
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all: PaletteItem[] = [
      ...recent
        .map((id) => NAV_ITEMS.find((i) => i.id === id))
        .filter((i): i is PaletteItem => !!i)
        .map((i) => ({ ...i, group: 'Recent' as const })),
      ...NAV_ITEMS.filter((i) => !recent.includes(i.id)),
      ...projectItems,
    ];
    const matches = q
      ? all.filter((i) => (i.label + ' ' + i.hint).toLowerCase().includes(q))
      : all;
    return matches.slice(0, 40);
  }, [query, recent, projectItems]);

  useEffect(() => { setActive(0); }, [query]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  function select(item: PaletteItem) {
    try {
      const next = [item.id, ...recent.filter((id) => id !== item.id && !id.startsWith('project-'))].slice(0, 5);
      localStorage.setItem('sat7-recent', JSON.stringify(next));
    } catch { /* storage unavailable */ }
    onClose();
    if (item.href) router.push(item.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (items[active]) select(items[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  }

  if (!open) return null;

  let lastGroup = '';
  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/55 p-4 pt-[12vh] fade-in"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-xl bg-surface border border-border rounded-lg shadow-popover overflow-hidden slide-up"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Icon name="search" size={18} className="text-text-faint shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages, actions or projects..."
            className="flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-text-faint"
          />
          <button onClick={onClose} className="kbd focus-ring" aria-label="Close">ESC</button>
        </div>

        <div ref={listRef} className="max-h-[55vh] overflow-y-auto p-2">
          {items.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-text-faint">No matches for “{query}”</p>
          )}
          {items.map((item, idx) => {
            const showGroup = item.group !== lastGroup;
            lastGroup = item.group;
            return (
              <div key={item.id}>
                {showGroup && (
                  <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-text-faint">
                    {item.group}
                  </div>
                )}
                <button
                  data-idx={idx}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => select(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors focus-ring ${
                    idx === active ? 'bg-surface-2 text-text' : 'text-text-dim hover:bg-surface-2'
                  }`}
                >
                  <span className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${
                    idx === active ? 'bg-blue/15 text-blue' : 'bg-surface-2 text-text-faint'
                  }`}>
                    <Icon name={item.icon} size={14} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate">{item.label}</span>
                    <span className="block text-xs text-text-faint truncate">{item.hint}</span>
                  </span>
                  {idx === active && <span className="kbd">↵</span>}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 px-4 py-2 border-t border-border text-[11px] text-text-faint">
          <span><span className="kbd">↑</span> <span className="kbd">↓</span> navigate</span>
          <span><span className="kbd">↵</span> open</span>
          <span className="ml-auto">SAT-7 Promo Desk</span>
        </div>
      </div>
    </div>
  );
}

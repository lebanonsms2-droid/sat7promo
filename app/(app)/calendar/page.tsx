'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getProjects } from '@/lib/queries';
import { PriorityBadge, StatusBadge, Icon, Button } from '@/components/ui';

type View = 'month' | 'week' | 'day';

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setDate(x.getDate() - x.getDay());
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState(new Date());
  const [projects, setProjects] = useState<any[]>([]);
  const [selected, setSelected] = useState(ymd(new Date()));

  useEffect(() => { getProjects().then(setProjects); }, []);

  const byDate = useMemo(() => {
    const map = new Map<string, any[]>();
    projects.forEach((p) => {
      if (!p.due_date) return;
      const list = map.get(p.due_date) || [];
      list.push(p);
      map.set(p.due_date, list);
    });
    return map;
  }, [projects]);

  const monthCells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return projects
      .filter((p) => p.due_date && p.due_date >= today && p.status !== 'Completed')
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 8);
  }, [projects]);

  const todayStr = ymd(new Date());

  function navigate(dir: number) {
    const d = new Date(cursor);
    if (view === 'month') d.setMonth(d.getMonth() + dir);
    else if (view === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCursor(d);
  }

  function label(): string {
    if (view === 'month') return cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (view === 'week') {
      const end = addDays(weekDays[0], 6);
      return `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return cursor.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  function goToday() {
    setCursor(new Date());
    setSelected(todayStr);
  }

  function openProject(code: string) {
    router.push(`/projects?q=${encodeURIComponent(code)}`);
  }

  function renderEvent(p: any, compact = false) {
    return (
      <button
        key={p.id}
        onClick={() => openProject(p.project_code)}
        className={`w-full text-left px-1.5 py-1 rounded text-[10px] truncate transition-colors focus-ring ${
          p.status === 'Completed'
            ? 'bg-teal-soft text-teal'
            : p.priority === 'Urgent'
              ? 'bg-red-soft text-red'
              : p.priority === 'High'
                ? 'bg-amber-soft text-amber'
                : 'bg-blue-soft text-blue'
        } ${compact ? '' : 'hover:brightness-95'}`}
        title={`${p.project_code} · ${p.program?.name || ''} · ${p.status}`}
      >
        {p.project_code}
      </button>
    );
  }

  return (
    <section className="p-4 md:p-6 max-w-[1600px] mx-auto fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="panel-head mb-1">Workspace · Calendar</p>
          <h1 className="text-2xl font-display font-bold">Calendar</h1>
          <p className="text-xs text-text-faint mt-0.5">Project deadlines and milestones across all channels.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
          <Link href="/new" className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-red text-white text-sm font-medium hover:bg-red/90 transition-colors focus-ring">
            <Icon name="plus" size={15} /> New request
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">
        <div className="panel overflow-hidden">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(-1)} className="p-2 rounded hover:bg-surface-2 text-text-dim focus-ring" aria-label="Previous"><Icon name="minus" size={16} /></button>
              <h2 className="text-lg font-display font-semibold min-w-[200px] text-center">{label()}</h2>
              <button onClick={() => navigate(1)} className="p-2 rounded hover:bg-surface-2 text-text-dim focus-ring" aria-label="Next"><Icon name="plus" size={16} /></button>
            </div>
            <div className="flex gap-1 p-1 rounded-md bg-surface-2">
              {(['month', 'week', 'day'] as View[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded text-sm capitalize transition-colors focus-ring ${
                    view === v ? 'bg-surface text-text font-semibold shadow-card' : 'text-text-dim hover:text-text'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Month grid */}
          {view === 'month' && (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-7 min-w-[760px]">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="p-2 text-center text-[11px] font-bold uppercase tracking-wider text-text-dim border-b border-border bg-surface-2/40">{d}</div>
                ))}
                {monthCells.map((d) => {
                  const key = ymd(d);
                  const events = byDate.get(key) || [];
                  const outside = d.getMonth() !== cursor.getMonth();
                  return (
                    <button
                      key={key}
                      onClick={() => { setSelected(key); if (!(view === 'month')) setCursor(d); }}
                      className={`min-h-[104px] p-1.5 text-left border-b border-r border-border align-top transition-colors hover:bg-surface-2/50 focus-ring ${
                        outside ? 'opacity-40' : ''
                      } ${key === selected ? 'bg-blue/5' : ''}`}
                    >
                      <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs tabnums mb-1 ${
                        key === todayStr ? 'bg-red text-white font-bold' : 'text-text-dim'
                      }`}>{d.getDate()}</span>
                      <div className="space-y-0.5">
                        {events.slice(0, 3).map((p) => renderEvent(p, true))}
                        {events.length > 3 && <p className="text-[10px] text-text-faint px-1">+{events.length - 3} more</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Week view */}
          {view === 'week' && (
            <div className="divide-y divide-border">
              {weekDays.map((d) => {
                const key = ymd(d);
                const events = byDate.get(key) || [];
                return (
                  <div key={key} className="p-4 grid grid-cols-[90px_1fr] gap-4">
                    <div className={`text-sm font-semibold ${key === todayStr ? 'text-red' : 'text-text-dim'}`}>
                      {d.toLocaleDateString('en-US', { weekday: 'short' })}
                      <span className="block text-2xl font-display tabnums">{d.getDate()}</span>
                    </div>
                    <div className="space-y-2">
                      {events.length === 0 && <p className="text-xs text-text-faint py-2">No deadlines</p>}
                      {events.map((p) => (
                        <button key={p.id} onClick={() => openProject(p.project_code)} className="w-full flex flex-wrap items-center gap-3 p-2.5 rounded-md border border-border hover:bg-surface-2 text-left transition-colors focus-ring">
                          <span className="font-mono text-xs font-semibold">{p.project_code}</span>
                          <span className="text-xs text-text-dim flex-1 truncate">{p.program?.name || p.promo_type}</span>
                          <PriorityBadge priority={p.priority} />
                          <StatusBadge status={p.status} />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Day view */}
          {view === 'day' && (
            <div className="p-6">
              <p className="panel-head mb-4">Deadlines on {cursor.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
              {(byDate.get(ymd(cursor)) || []).length === 0 && (
                <div className="text-center py-16 text-text-faint text-sm">No projects are due on this day.</div>
              )}
              <div className="space-y-3">
                {(byDate.get(ymd(cursor)) || []).map((p) => (
                  <button key={p.id} onClick={() => openProject(p.project_code)} className="w-full flex flex-wrap items-center gap-3 p-4 rounded-md border border-border hover:bg-surface-2 text-left transition-colors focus-ring">
                    <span className="font-mono text-sm font-semibold">{p.project_code}</span>
                    <span className="text-sm text-text-dim flex-1 truncate">{p.program?.name || p.promo_type}</span>
                    <PriorityBadge priority={p.priority} />
                    <StatusBadge status={p.status} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <div className="panel p-5">
            <h2 className="panel-head mb-4">Upcoming deadlines</h2>
            {upcoming.length === 0 && <p className="text-sm text-text-faint py-6 text-center">Nothing due soon.</p>}
            <div className="space-y-1">
              {upcoming.map((p) => (
                <button key={p.id} onClick={() => openProject(p.project_code)} className="w-full flex items-center gap-3 p-2 -mx-2 rounded hover:bg-surface-2 text-left transition-colors focus-ring">
                  <span className="w-10 h-10 rounded-md bg-amber/15 text-amber flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] uppercase font-bold leading-none">{new Date(p.due_date).toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-sm font-bold tabnums leading-tight">{new Date(p.due_date).getDate()}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-xs font-semibold truncate">{p.project_code}</span>
                    <span className="block text-xs text-text-faint truncate">{p.program?.name || p.promo_type}</span>
                  </span>
                  <PriorityBadge priority={p.priority} />
                </button>
              ))}
            </div>
          </div>

          <div className="panel p-5">
            <h2 className="panel-head mb-4">Legend</h2>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red" /> Urgent deadline</div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber" /> High priority</div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue" /> Normal priority</div>
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-teal" /> Completed</div>
            </div>
            <p className="text-[11px] text-text-faint mt-4">Click any event to open the project in the Projects list.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getProjects, getChannels, getPrograms, getUsers } from '@/lib/queries';
import { PRIORITIES, STATUSES } from '@/lib/types';
import type { Priority, PromoStatus } from '@/lib/types';
import { updateProjectStatusAction } from '@/app/actions';
import { StatusBadge, PriorityBadge, Icon, Button, Input, Select, SelectItem, SelectTrigger, SelectContent, SelectValue } from '@/components/ui';

const PAGE_SIZE = 15;
const emptyFilters = { search: '', status: '', programId: '', channelId: '', userId: '', priority: '' };

function initials(name: string): string {
  return (name || '?').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload(f = filters) {
    setProjects(await getProjects(f as any));
  }

  useEffect(() => {
    (async () => {
      const [c, p, u] = await Promise.all([getChannels(), getPrograms(), getUsers()]);
      setChannels(c); setPrograms(p); setUsers(u);
      const q = new URLSearchParams(window.location.search).get('q') || '';
      if (q) {
        setFilters({ ...emptyFilters, search: q });
        await reload({ ...emptyFilters, search: q });
      } else await reload();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function change(key: keyof typeof filters, value: string) {
    const next = { ...filters, [key]: value };
    setFilters(next);
    setPage(1);
    reload(next);
  }

  function clearFilters() {
    setFilters(emptyFilters);
    setPage(1);
    reload(emptyFilters);
  }

  const filtered = useMemo(() => projects, [projects]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const kpis = [
    { label: 'Total projects', value: filtered.length, tone: '' },
    { label: 'In progress', value: filtered.filter((p) => p.status === 'In Progress').length, tone: 'text-amber' },
    { label: 'Overdue', value: filtered.filter((p) => p.due_date && p.due_date < new Date().toISOString().split('T')[0] && p.status !== 'Completed').length, tone: 'text-red' },
    { label: 'Completed', value: filtered.filter((p) => p.status === 'Completed').length, tone: 'text-teal' },
  ];

  async function changeStatus(id: string, status: PromoStatus) {
    setBusy(true); setError(null);
    try {
      await updateProjectStatusAction(id, status);
      await reload();
      setDetail((d: any) => (d?.id === id ? { ...d, status } : d));
    } catch (err: any) { setError(err?.message ?? 'Status update failed.'); }
    finally { setBusy(false); }
  }

  return (
    <section className="p-4 md:p-6 max-w-[1600px] mx-auto fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="panel-head mb-1">Workspace · Projects</p>
          <h1 className="text-2xl font-display font-bold">Projects</h1>
          <p className="text-xs text-text-faint mt-0.5">Track every promo request from intake through delivery.</p>
        </div>
        <Link href="/new" className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-red text-white text-sm font-medium hover:bg-red/90 transition-colors focus-ring">
          <Icon name="plus" size={15} /> New request
        </Link>
      </div>

      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-5 text-sm">{error}</div>}

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {kpis.map((k) => (
          <div key={k.label} className="panel p-3.5">
            <p className="text-[11px] text-text-dim truncate">{k.label}</p>
            <p className={`text-2xl font-display font-bold tabnums mt-0.5 ${k.tone}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="panel p-4 md:p-5 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
          <div className="relative sm:col-span-2 xl:col-span-2">
            <Icon name="search" size={15} className="text-text-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input aria-label="Search projects" value={filters.search} onChange={(e) => change('search', e.target.value)} placeholder="Search code, requester…" className="pl-9 bg-transparent" />
          </div>
          <Select ariaLabel="Filter by status" value={filters.status} onValueChange={(v) => change('status', v)} placeholder="All statuses">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select ariaLabel="Filter by program" value={filters.programId} onValueChange={(v) => change('programId', v)} placeholder="All programs">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {programs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select ariaLabel="Filter by channel" value={filters.channelId} onValueChange={(v) => change('channelId', v)} placeholder="All channels">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {channels.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select ariaLabel="Filter by priority" value={filters.priority} onValueChange={(v) => change('priority', v)} placeholder="All priorities">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-text-faint tabnums">{filtered.length} matching project(s)</span>
          <button onClick={clearFilters} className="text-xs text-blue hover:underline focus-ring">Clear filters</button>
        </div>
      </div>

      {/* Table */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="border-b border-border bg-surface-2/50">
                {['Project ID', 'Program / Title', 'Status', 'Priority', 'Channels', 'Requester', 'Assigned', 'Due Date', ''].map((h, i) => (
                  <th key={i} className="p-3 text-left text-[11px] font-bold uppercase tracking-wider text-text-dim whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-2/60 transition-colors">
                  <td className="p-3">
                    <button onClick={() => setDetail(p)} className="font-mono text-xs font-semibold text-blue hover:underline focus-ring">{p.project_code}</button>
                  </td>
                  <td className="p-3 max-w-[240px]">
                    <p className="font-medium text-sm truncate">{p.program?.name || '—'}</p>
                    <p className="text-[11px] text-text-faint truncate">{p.title || p.promo_type}</p>
                  </td>
                  <td className="p-3"><StatusBadge status={p.status} /></td>
                  <td className="p-3"><PriorityBadge priority={p.priority} /></td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1 max-w-[140px]">
                      {p.channels?.map((c: any) => <span key={c.id} className="badge text-[10px]">{c.code}</span>)}
                      {!p.channels?.length && <span className="text-xs text-text-faint">—</span>}
                    </div>
                  </td>
                  <td className="p-3 text-xs text-text-dim max-w-[160px] truncate">{p.requester_email || '—'}</td>
                  <td className="p-3">
                    {p.assigned_user_ids?.length ? (
                      <div className="flex -space-x-1.5">
                        {p.assigned_user_ids.slice(0, 3).map((uid: string) => {
                          const u = users.find((x) => x.id === uid);
                          return (
                            <span key={uid} title={u?.name || 'User'} className="w-6 h-6 rounded-full border-2 border-surface flex items-center justify-center text-[9px] font-bold text-white" style={{ background: u?.color || '#4763c6' }}>
                              {initials(u?.name || 'U')}
                            </span>
                          );
                        })}
                        {p.assigned_user_ids.length > 3 && <span className="w-6 h-6 rounded-full border-2 border-surface bg-surface-2 flex items-center justify-center text-[9px] text-text-dim">+{p.assigned_user_ids.length - 3}</span>}
                      </div>
                    ) : <span className="text-xs text-text-faint">Unassigned</span>}
                  </td>
                  <td className="p-3 text-xs tabnums whitespace-nowrap">
                    {p.due_date ? new Date(p.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '—'}
                  </td>
                  <td className="p-3">
                    <Button size="sm" variant="outline" onClick={() => setDetail(p)}>View</Button>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={9} className="p-10 text-center text-sm text-text-faint">No projects match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border">
          <span className="text-xs text-text-faint tabnums">
            Showing {filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
            <span className="text-xs text-text-dim tabnums px-2">Page {page} of {pages}</span>
            <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages}>Next</Button>
          </div>
        </div>
      </div>

      {/* Detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onMouseDown={() => setDetail(null)}>
          <div className="h-full w-full max-w-lg bg-surface border-l border-border shadow-popover overflow-y-auto slide-up" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 p-6 border-b border-border">
              <div>
                <p className="panel-head mb-1">Project detail</p>
                <h2 className="text-xl font-display font-bold">{detail.project_code}</h2>
                <p className="text-sm text-text-dim mt-0.5">{detail.title || detail.program?.name || 'Promo request'}</p>
              </div>
              <button onClick={() => setDetail(null)} className="p-2 rounded hover:bg-surface-2 text-text-dim focus-ring" aria-label="Close detail"><Icon name="x" size={18} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="panel p-3"><p className="panel-head mb-1">Status</p><StatusBadge status={detail.status} /></div>
                <div className="panel p-3"><p className="panel-head mb-1">Priority</p><PriorityBadge priority={detail.priority} /></div>
              </div>
              <div className="panel p-4">
                <h3 className="panel-head mb-3">Change status</h3>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button key={s} type="button" disabled={busy} onClick={() => changeStatus(detail.id, s)}
                      className={`px-2.5 py-1.5 rounded-md border text-xs transition-colors focus-ring disabled:opacity-50 ${
                        detail.status === s ? 'border-blue bg-blue/10 text-text font-semibold' : 'border-border text-text-dim hover:bg-surface-2'
                      }`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="panel p-4 space-y-2.5 text-sm">
                <h3 className="panel-head mb-3">Details</h3>
                <div className="flex justify-between gap-3"><span className="text-text-dim">Program</span><span className="font-medium text-right">{detail.program?.name || '—'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-text-dim">Promo type</span><span className="font-medium text-right">{detail.promo_type}</span></div>
                <div className="flex justify-between gap-3"><span className="text-text-dim">Requester</span><span className="font-medium text-right max-w-[60%] truncate">{detail.requester_email || '—'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-text-dim">Department</span><span className="font-medium text-right">{detail.requesting_dept}</span></div>
                <div className="flex justify-between gap-3"><span className="text-text-dim">Request date</span><span className="font-medium tabnums">{detail.request_date || '—'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-text-dim">Due date</span><span className="font-medium tabnums">{detail.due_date || '—'}</span></div>
                <div className="pt-2 border-t border-border">
                  <p className="panel-head mb-2">Channels</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.channels?.map((c: any) => <span key={c.id} className="badge">{c.code} · {c.name}</span>)}
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="panel-head mb-2">Assigned team</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.assigned_user_ids?.map((uid: string) => {
                      const u = users.find((x) => x.id === uid);
                      return <span key={uid} className="badge">{u?.name || 'User'}</span>;
                    })}
                    {!detail.assigned_user_ids?.length && <span className="text-xs text-text-faint">Unassigned</span>}
                  </div>
                </div>
                {detail.notes && (
                  <div className="pt-2 border-t border-border">
                    <p className="panel-head mb-2">Notes</p>
                    <p className="text-sm text-text-dim whitespace-pre-wrap">{detail.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

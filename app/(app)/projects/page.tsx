'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getProjects, getChannels, getPrograms, getUsers, getDepartments } from '@/lib/queries';
import { PRIORITIES, STATUSES, PROMO_TYPES } from '@/lib/types';
import type { Priority, PromoStatus, PromoType, Department } from '@/lib/types';
import { updateProjectStatusAction, updateProjectAction, deleteProjectAction } from '@/app/actions';
import { createClient } from '@/lib/supabase/client';
import { StatusBadge, PriorityBadge, Icon, Button, Input, Select, SelectItem, SelectTrigger, SelectContent, SelectValue, Label } from '@/components/ui';

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
  const [notice, setNotice] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [depts, setDepts] = useState<Department[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    program_id: '', channel_ids: [] as string[], promo_type: 'TV Promo' as PromoType,
    priority: 'Normal' as Priority, assigned_user_ids: [] as string[], requested_by: '',
    requesting_dept: 'Broadcast' as Department, requester_email: '', requester_phone: '',
    request_date: '', due_date: '', notes: '',
  });
  const [deleting, setDeleting] = useState<any | null>(null);

  async function reload(f = filters) {
    setProjects(await getProjects(f as any));
  }

  useEffect(() => {
    (async () => {
      const [c, p, u] = await Promise.all([getChannels(), getPrograms(), getUsers()]);
      setChannels(c); setPrograms(p); setUsers(u);
      setDepts(getDepartments());
      const { data } = await createClient().auth.getUser();
      const me = u.find((x: any) => x.id === data.user?.id);
      setIsAdmin(me?.role === 'Administrator');
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

  function openEdit(p: any) {
    setError(null); setNotice(null);
    setEditing(p);
    setEditForm({
      program_id: p.program_id || '',
      channel_ids: (p.channel_ids || []).slice(),
      promo_type: p.promo_type || 'TV Promo',
      priority: p.priority || 'Normal',
      assigned_user_ids: (p.assigned_user_ids || []).slice(),
      requested_by: p.requested_by || '',
      requesting_dept: (p.requesting_dept || 'Broadcast') as Department,
      requester_email: p.requester_email || '',
      requester_phone: p.requester_phone || '',
      request_date: p.request_date || '',
      due_date: p.due_date || '',
      notes: p.notes || '',
    });
    setDetail(null);
  }

  function toggleId(field: 'channel_ids' | 'assigned_user_ids', id: string) {
    setEditForm((f) => ({
      ...f,
      [field]: f[field].includes(id) ? f[field].filter((x) => x !== id) : [...f[field], id],
    }));
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      await updateProjectAction(editing.id, editForm);
      await reload();
      setEditing(null);
      setNotice(`${editing.project_code} was updated.`);
    } catch (err: any) { setError(err?.message ?? 'Could not save project.'); }
    finally { setBusy(false); }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true); setError(null);
    try {
      await deleteProjectAction(deleting.id);
      await reload();
      setDeleting(null);
      setDetail(null);
      setNotice(`${deleting.project_code} was deleted.`);
    } catch (err: any) { setError(err?.message ?? 'Could not delete project.'); setDeleting(null); }
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
      {notice && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded mb-5 text-sm flex justify-between gap-3"><span>{notice}</span><button onClick={() => setNotice(null)} className="font-bold hover:underline">Dismiss</button></div>}

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
          <table className="w-full min-w-[1250px]">
            <thead>
              <tr className="border-b border-border bg-surface-2/50">
                {['Project ID', 'Program / Title', 'Status', 'Priority', 'Channels', 'Requester', 'Assigned', 'Due Date', 'Actions'].map((h, i) => (
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
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => setDetail(p)}>View</Button>
                      {isAdmin && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => openEdit(p)}>Edit</Button>
                          <Button size="sm" variant="outline" onClick={() => setDeleting(p)}>Delete</Button>
                        </>
                      )}
                    </div>
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
              {isAdmin && (
                <div className="flex gap-2">
                  <Button onClick={() => openEdit(detail)} className="flex-1">Edit project</Button>
                  <Button variant="outline" onClick={() => { setDeleting(detail); setDetail(null); }}>Delete</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit drawer (admin only) */}
      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onMouseDown={() => setEditing(null)}>
          <form onSubmit={saveEdit} className="h-full w-full max-w-xl bg-surface border-l border-border shadow-popover overflow-y-auto slide-up" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 p-6 border-b border-border sticky top-0 bg-surface z-10">
              <div>
                <p className="panel-head mb-1">Administrator · Edit project</p>
                <h2 className="text-xl font-display font-bold">{editing.project_code}</h2>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="p-2 rounded hover:bg-surface-2 text-text-dim focus-ring" aria-label="Close editor"><Icon name="x" size={18} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label>Program</Label>
                  <Select ariaLabel="Program" value={editForm.program_id} onValueChange={(v) => setEditForm({ ...editForm, program_id: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{programs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Promo type</Label>
                  <Select ariaLabel="Promo type" value={editForm.promo_type} onValueChange={(v) => setEditForm({ ...editForm, promo_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PROMO_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select ariaLabel="Priority" value={editForm.priority} onValueChange={(v) => setEditForm({ ...editForm, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Requested by</Label>
                  <Input aria-label="Requested by" value={editForm.requested_by} onChange={(e) => setEditForm({ ...editForm, requested_by: e.target.value })} className="bg-transparent" />
                </div>
                <div>
                  <Label>Department</Label>
                  <Select ariaLabel="Department" value={editForm.requesting_dept} onValueChange={(v) => setEditForm({ ...editForm, requesting_dept: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {depts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      {!depts.includes(editForm.requesting_dept) && <SelectItem value={editForm.requesting_dept}>{editForm.requesting_dept} (legacy)</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Requester email</Label>
                  <Input aria-label="Requester email" type="email" value={editForm.requester_email} onChange={(e) => setEditForm({ ...editForm, requester_email: e.target.value })} className="bg-transparent" />
                </div>
                <div>
                  <Label>Requester phone</Label>
                  <Input aria-label="Requester phone" value={editForm.requester_phone} onChange={(e) => setEditForm({ ...editForm, requester_phone: e.target.value })} className="bg-transparent" />
                </div>
                <div>
                  <Label>Request date</Label>
                  <Input aria-label="Request date" type="date" value={editForm.request_date} onChange={(e) => setEditForm({ ...editForm, request_date: e.target.value })} className="bg-transparent" />
                </div>
                <div>
                  <Label>Due date</Label>
                  <Input aria-label="Due date" type="date" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} className="bg-transparent" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Notes</Label>
                  <textarea aria-label="Notes" rows={3} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-input placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>

              <div className="panel p-4">
                <div className="flex justify-between mb-3"><h3 className="panel-head">Channels</h3><span className="text-xs text-text-faint tabnums">{editForm.channel_ids.length} selected</span></div>
                <div className="flex flex-wrap gap-2">
                  {channels.map((c) => (
                    <button key={c.id} type="button" aria-pressed={editForm.channel_ids.includes(c.id)} onClick={() => toggleId('channel_ids', c.id)}
                      className={`badge border transition-colors ${editForm.channel_ids.includes(c.id) ? 'border-blue bg-blue/10 text-blue' : 'border-border text-text-dim'}`}>
                      {c.code} · {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel p-4">
                <div className="flex justify-between mb-3"><h3 className="panel-head">Assigned team</h3><span className="text-xs text-text-faint tabnums">{editForm.assigned_user_ids.length} assigned</span></div>
                <div className="flex flex-wrap gap-2">
                  {users.map((u) => (
                    <button key={u.id} type="button" aria-pressed={editForm.assigned_user_ids.includes(u.id)} onClick={() => toggleId('assigned_user_ids', u.id)}
                      className={`badge border transition-colors ${editForm.assigned_user_ids.includes(u.id) ? 'border-blue bg-blue/10 text-blue' : 'border-border text-text-dim'}`}>
                      {u.name || u.email}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 sticky bottom-0 bg-surface py-4 border-t border-border">
                <Button type="submit" disabled={busy} className="flex-1">{busy ? 'Saving…' : 'Save changes'}</Button>
                <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirmation */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={() => setDeleting(null)}>
          <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-md shadow-popover slide-up" onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-display font-bold mb-2">Delete project?</h3>
            <p className="text-sm text-text-dim mb-3">
              <strong>{deleting.project_code}</strong> and its history, notifications and files will be permanently removed. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleting(null)} disabled={busy}>Cancel</Button>
              <Button onClick={confirmDelete} disabled={busy}>{busy ? 'Deleting…' : 'Delete project'}</Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

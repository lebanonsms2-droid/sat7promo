'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getUsers, getProjects, getDepartments } from '@/lib/queries';
import { createClient } from '@/lib/supabase/client';
import { updateUserAction, deleteUserAction } from '@/app/actions';
import { ROLES } from '@/lib/types';
import type { Profile, UserRole, Department } from '@/lib/types';
import { Icon, Button, Input, Select, SelectItem, SelectTrigger, SelectContent, SelectValue, Label } from '@/components/ui';

type EditForm = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  dept: Department;
  phone: string;
  active: boolean;
};

function initials(name: string): string {
  return (name || '?').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

const ROLE_TONE: Record<string, string> = {
  Administrator: 'bg-red-soft text-red',
  'Promo Manager': 'bg-violet-soft text-violet',
  'Promo Producer': 'bg-amber-soft text-amber',
  Editor: 'bg-blue-soft text-blue',
  Designer: 'bg-violet-soft text-violet',
  Viewer: 'bg-surface-2 text-text-dim',
};

export default function PeoplePage() {
  const [people, setPeople] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [edit, setEdit] = useState<EditForm | null>(null);
  const [remove, setRemove] = useState<Profile | null>(null);
  const [detail, setDetail] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function reload() {
    const [p, j] = await Promise.all([getUsers(), getProjects()]);
    setPeople(p);
    setProjects(j);
  }

  useEffect(() => {
    reload();
    setDepts(getDepartments());
    createClient().auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  const isAdmin = people.some((p) => p.id === currentUserId && p.role === 'Administrator');

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return people.filter((p) => {
      if (q && !(p.name + ' ' + p.email + ' ' + (p.phone || '')).toLowerCase().includes(q)) return false;
      if (roleFilter && p.role !== roleFilter) return false;
      if (deptFilter && p.dept !== deptFilter) return false;
      if (statusFilter === 'Active' && !p.active) return false;
      if (statusFilter === 'Inactive' && p.active) return false;
      return true;
    });
  }, [people, search, roleFilter, deptFilter, statusFilter]);

  const assigned = (id: string) => projects.filter((p) => (p.assigned_user_ids || []).includes(id));
  const activePeople = people.filter((p) => p.active).length;
  const admins = people.filter((p) => p.role === 'Administrator' && p.active).length;
  const deptCount = new Set(people.map((p) => p.dept).filter(Boolean)).size;

  function flash(message: string) { setError(null); setNotice(message); }

  function startEdit(p: Profile) {
    setNotice(null); setError(null);
    setEdit({
      id: p.id, name: p.name || '', email: p.email, role: p.role,
      dept: (p.dept || 'Programming') as Department, phone: p.phone || '', active: p.active,
    });
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setBusy(true); setError(null);
    try {
      await updateUserAction(edit.id, {
        name: edit.name, role: edit.role, dept: edit.dept, phone: edit.phone, active: edit.active,
      });
      await reload();
      setEdit(null);
      flash(`${edit.name} was updated.`);
    } catch (err: any) { setError(err?.message ?? 'Could not save changes.'); }
    finally { setBusy(false); }
  }

  async function confirmDelete() {
    if (!remove) return;
    setBusy(true); setError(null);
    try {
      await deleteUserAction(remove.id);
      await reload();
      setRemove(null);
      flash(`${remove.name || remove.email} was removed from the team.`);
    } catch (err: any) { setError(err?.message ?? 'Could not delete this person.'); setRemove(null); }
    finally { setBusy(false); }
  }

  function clearFilters() {
    setSearch(''); setRoleFilter(''); setDeptFilter(''); setStatusFilter('');
  }

  return (
    <section className="p-4 md:p-6 max-w-[1600px] mx-auto fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="panel-head mb-1">Workspace · People</p>
          <h1 className="text-2xl font-display font-bold">People</h1>
          <p className="text-xs text-text-faint mt-0.5">Your team directory — edit member details, roles and access, or remove a member.</p>
        </div>
        <Link href="/users" className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm hover:bg-surface-2 transition-colors focus-ring">
          <Icon name="users" size={15} /> Manage accounts
        </Link>
      </div>

      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-5 text-sm flex justify-between gap-3"><span>{error}</span><button onClick={() => setError(null)} className="font-bold hover:underline">Dismiss</button></div>}
      {notice && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded mb-5 text-sm">{notice}</div>}
      {!isAdmin && (
        <div className="bg-surface border-l-4 border-amber p-4 rounded mb-5 text-sm text-text-dim">
          You can browse the directory. Only administrators can edit or remove team members.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="panel p-3.5"><p className="text-[11px] text-text-dim">Team members</p><p className="text-2xl font-display font-bold tabnums">{people.length}</p></div>
        <div className="panel p-3.5"><p className="text-[11px] text-text-dim">Active</p><p className="text-2xl font-display font-bold tabnums text-teal">{activePeople}</p></div>
        <div className="panel p-3.5"><p className="text-[11px] text-text-dim">Administrators</p><p className="text-2xl font-display font-bold tabnums text-red">{admins}</p></div>
        <div className="panel p-3.5"><p className="text-[11px] text-text-dim">Departments</p><p className="text-2xl font-display font-bold tabnums text-violet">{deptCount}</p></div>
      </div>

      {/* Filters */}
      <div className="panel p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="relative xl:col-span-1">
            <Icon name="search" size={15} className="text-text-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input aria-label="Search people" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone…" className="pl-9 bg-transparent" />
          </div>
          <Select ariaLabel="Filter by role" value={roleFilter} onValueChange={setRoleFilter} placeholder="All roles">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
          <Select ariaLabel="Filter by department" value={deptFilter} onValueChange={setDeptFilter} placeholder="All departments">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{depts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
          <Select ariaLabel="Filter by status" value={statusFilter} onValueChange={setStatusFilter} placeholder="All statuses">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-text-faint tabnums">{visible.length} of {people.length} people</span>
          <button onClick={clearFilters} className="text-xs text-blue hover:underline focus-ring">Clear filters</button>
        </div>
      </div>

      {/* Directory cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visible.map((p) => {
          const count = assigned(p.id).length;
          return (
            <div key={p.id} className="panel p-5">
              <div className="flex items-start gap-3">
                <span className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: p.color || '#4763c6' }}>
                  {initials(p.name || p.email)}
                </span>
                <div className="min-w-0 flex-1">
                  <button onClick={() => setDetail(p)} className="block text-left font-display font-semibold text-base truncate hover:text-blue focus-ring">
                    {p.name || p.email}
                  </button>
                  <p className="text-xs text-text-faint truncate">{p.email}</p>
                </div>
                <span className={`badge ${p.active ? 'st-Active' : 'st-Inactive'}`}>{p.active ? 'Active' : 'Inactive'}</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-4">
                <span className={`badge ${ROLE_TONE[p.role] || 'bg-surface-2 text-text-dim'}`}>{p.role}</span>
                <span className="badge">{p.dept || 'No department'}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border text-xs">
                <div className="min-w-0">
                  <p className="panel-head mb-1">Phone</p>
                  <p className="truncate text-text-dim">{p.phone || '—'}</p>
                </div>
                <div>
                  <p className="panel-head mb-1">Assigned projects</p>
                  <p className="font-semibold tabnums">{count}</p>
                </div>
              </div>

              {isAdmin && (
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => startEdit(p)}>Edit</Button>
                  <Button
                    size="sm" variant="outline"
                    onClick={() => setRemove(p)}
                    disabled={p.id === currentUserId}
                    title={p.id === currentUserId ? 'You cannot remove yourself.' : 'Remove this person'}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        {visible.length === 0 && (
          <div className="panel p-10 text-center text-sm text-text-faint xl:col-span-3">No people match your filters.</div>
        )}
      </div>

      {/* Edit modal */}
      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={() => setEdit(null)}>
          <form onSubmit={saveEdit} className="bg-surface border border-border rounded-lg p-6 w-full max-w-lg shadow-popover slide-up" onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-display font-bold mb-1">Edit team member</h3>
            <p className="text-xs text-text-faint mb-5">{edit.email}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="sm:col-span-2">
                <Label>Full name</Label>
                <Input aria-label="Full name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className="bg-transparent" required />
              </div>
              <div>
                <Label>Role</Label>
                <Select ariaLabel="Role" value={edit.role} onValueChange={(v) => setEdit({ ...edit, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Department</Label>
                <Select ariaLabel="Department" value={edit.dept} onValueChange={(v) => setEdit({ ...edit, dept: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{depts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Phone</Label>
                <Input aria-label="Phone" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} className="bg-transparent" />
              </div>
              <div>
                <Label>Status</Label>
                <Select ariaLabel="Status" value={edit.active ? 'Active' : 'Inactive'} onValueChange={(v) => setEdit({ ...edit, active: v === 'Active' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setEdit(null)} disabled={busy}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button>
            </div>
          </form>
        </div>
      )}

      {/* Delete modal */}
      {remove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={() => setRemove(null)}>
          <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-md shadow-popover slide-up" onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-display font-bold mb-2">Remove team member?</h3>
            <p className="text-sm text-text-dim mb-3">
              <strong>{remove.name || remove.email}</strong> will be permanently removed from the team and will no longer be able to sign in.
            </p>
            <p className="text-sm text-red mb-4">
              This cannot be undone. History entries attributed to this person will show as unknown afterwards.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setRemove(null)} disabled={busy}>Cancel</Button>
              <Button onClick={confirmDelete} disabled={busy}>{busy ? 'Removing…' : 'Remove person'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onMouseDown={() => setDetail(null)}>
          <div className="h-full w-full max-w-md bg-surface border-l border-border shadow-popover overflow-y-auto slide-up" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: detail.color || '#4763c6' }}>
                  {initials(detail.name || detail.email)}
                </span>
                <div>
                  <p className="panel-head mb-1">Team member</p>
                  <h2 className="text-lg font-display font-bold">{detail.name || detail.email}</h2>
                </div>
              </div>
              <button onClick={() => setDetail(null)} className="p-2 rounded hover:bg-surface-2 text-text-dim focus-ring" aria-label="Close details"><Icon name="x" size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="panel p-4 space-y-2.5 text-sm">
                <div className="flex justify-between gap-3"><span className="text-text-dim">Email</span><span className="truncate max-w-[65%]">{detail.email}</span></div>
                <div className="flex justify-between gap-3"><span className="text-text-dim">Phone</span><span>{detail.phone || '—'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-text-dim">Role</span><span className={`badge ${ROLE_TONE[detail.role] || ''}`}>{detail.role}</span></div>
                <div className="flex justify-between gap-3"><span className="text-text-dim">Department</span><span>{detail.dept || '—'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-text-dim">Status</span><span className={`badge ${detail.active ? 'st-Active' : 'st-Inactive'}`}>{detail.active ? 'Active' : 'Inactive'}</span></div>
              </div>
              <div className="panel p-4">
                <h3 className="panel-head mb-3">Assigned projects ({assigned(detail.id).length})</h3>
                {assigned(detail.id).length === 0 && <p className="text-sm text-text-faint">No active assignments.</p>}
                <div className="space-y-2">
                  {assigned(detail.id).map((p) => (
                    <Link key={p.id} href={`/projects?q=${encodeURIComponent(p.project_code)}`} className="flex items-center justify-between gap-3 p-2 -mx-2 rounded hover:bg-surface-2 text-sm focus-ring">
                      <span className="font-mono text-xs font-semibold">{p.project_code}</span>
                      <span className="text-xs text-text-faint truncate">{p.status}</span>
                    </Link>
                  ))}
                </div>
              </div>
              {isAdmin && <Button onClick={() => { startEdit(detail); setDetail(null); }} className="w-full">Edit this person</Button>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

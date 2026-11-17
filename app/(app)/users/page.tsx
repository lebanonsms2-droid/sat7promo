'use client';

import { useState, useEffect } from 'react';
import { getUsers, getDepartments } from '@/lib/queries';
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
  resetPasswordAction,
} from '@/app/actions';
import { createClient } from '@/lib/supabase/client';
import {
  Input, Select, SelectItem, SelectTrigger, SelectContent, SelectValue,
  Label, Table, TableRow, TableCell, TableHeader,
} from '@/components/ui';
import { Button } from '@/components/ui';
import type { Profile, UserRole, Department } from '@/lib/types';

const ROLES: UserRole[] = [
  'Administrator', 'Promo Manager', 'Promo Producer', 'Editor', 'Designer', 'Viewer',
];

const emptyForm = {
  id: null as string | null,
  name: '',
  email: '',
  role: 'Viewer' as UserRole,
  dept: 'Programming' as Department,
  phone: '',
  active: true,
};

type FormState = typeof emptyForm;
type Modal =
  | { kind: 'delete'; user: Profile }
  | { kind: 'reset'; user: Profile; password?: string };

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null);
  const [modal, setModal] = useState<Modal | null>(null);
  const [busy, setBusy] = useState(false);

  const isAdmin = (() => {
    const me = users.find((u) => u.id === currentUserId);
    return me?.role === 'Administrator';
  })();

  async function reload() {
    setUsers(await getUsers());
  }

  useEffect(() => {
    setDepartments(getDepartments());
    reload();
    createClient().auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  function flash(message: string) {
    setError(null);
    setNotice(message);
    setCreatedCreds(null);
  }

  /* ---------------- create / update ---------------- */

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    setError(null);
    setCreatedCreds(null);
    try {
      if (!form.name.trim()) throw new Error('Name is required.');

      if (form.id) {
        await updateUserAction(form.id, {
          name: form.name,
          role: form.role,
          dept: form.dept,
          phone: form.phone,
          active: form.active,
        });
        flash(`Changes saved for ${form.name}.`);
      } else {
        if (!form.email.trim()) throw new Error('Email is required.');
        const creds = await createUserAction({
          name: form.name,
          email: form.email,
          role: form.role,
          dept: form.dept,
          phone: form.phone,
        });
        setCreatedCreds(creds);
        setNotice(null);
        setError(null);
      }

      await reload();
      setForm(emptyForm);
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  function startEdit(user: Profile) {
    setCreatedCreds(null);
    setNotice(null);
    setError(null);
    setForm({
      id: user.id,
      name: user.name ?? '',
      email: user.email ?? '',
      role: user.role,
      dept: (user.dept ?? 'Programming') as Department,
      phone: user.phone ?? '',
      active: user.active,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------- delete ---------------- */

  async function handleDelete(user: Profile) {
    setBusy(true);
    setError(null);
    try {
      await deleteUserAction(user.id);
      setModal(null);
      await reload();
      flash(`${user.name ?? user.email} was deleted.`);
    } catch (err: any) {
      setError(err?.message ?? 'Delete failed.');
      setModal(null);
    } finally {
      setBusy(false);
    }
  }

  /* ---------------- reset password ---------------- */

  async function handleReset(user: Profile) {
    setBusy(true);
    setError(null);
    try {
      const { password } = await resetPasswordAction(user.id);
      setModal({ kind: 'reset', user, password });
    } catch (err: any) {
      setError(err?.message ?? 'Password reset failed.');
      setModal(null);
    } finally {
      setBusy(false);
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice('Copied to clipboard.');
    } catch {
      /* clipboard unavailable — password stays visible for manual copy */
    }
  }

  const editing = form.id !== null;

  return (
    <section className="p-4 md:p-6 max-w-[1600px] mx-auto fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="panel-head mb-1">Administration · Users</p>
          <h1 className="text-2xl font-display font-bold">Users</h1>
          <p className="text-xs text-text-faint mt-0.5">Manage accounts, roles, departments and access.</p>
        </div>
        {users.length > 0 && (
          <span className="text-xs text-text-faint tabnums">{users.length} accounts</span>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      {notice && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded mb-4">
          <p>{notice}</p>
        </div>
      )}

      {/* Temporary password for a newly created account */}
      {createdCreds && (
        <div className="bg-surface border-2 border-green-500 p-4 rounded mb-6">
          <p className="text-sm font-semibold mb-1">
            Account created for {createdCreds.email}
          </p>
          <p className="text-xs text-text-dim mb-3">
            Share this temporary password with the user — it cannot be retrieved later.
            They can change it from Settings.
          </p>
          <div className="flex items-center gap-3">
            <code className="bg-surface-2 px-3 py-2 rounded text-sm font-mono select-all">
              {createdCreds.password}
            </code>
            <Button size="sm" variant="outline" onClick={() => copyText(createdCreds.password)}>
              Copy
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setCreatedCreds(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {isAdmin ? (
        /* ---------------- create / edit form ---------------- */
        <div className="panel p-6 mb-6">
          <h2 className="panel-head mb-4">
            {editing ? 'Edit User' : 'Create New User'}
          </h2>
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label>Name</Label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="bg-transparent"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required={!editing}
                  disabled={editing}
                  placeholder={editing ? 'Email cannot be changed' : 'name@sat7.org'}
                  className="bg-transparent"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  name="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="bg-transparent"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v: UserRole) => setForm({ ...form, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Department</Label>
                <Select
                  value={form.dept}
                  onValueChange={(v: Department) => setForm({ ...form, dept: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={form.active ? 'Active' : 'Inactive'}
                  onValueChange={(v) => setForm({ ...form, active: v === 'Active' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={busy}>
                {busy ? 'Please wait…' : editing ? 'Save Changes' : 'Create User'}
              </Button>
              {editing && (
                <Button type="button" variant="outline" onClick={() => setForm(emptyForm)}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-surface border-l-4 border-border p-4 rounded mb-6 text-sm text-text-dim">
          Only administrators can create, modify, or delete users.
        </div>
      )}

      {/* ---------------- users table ---------------- */}
      <div className="panel p-6">
        <h2 className="panel-head mb-4">
          All Users
        </h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Dept</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHeader>
            {users.map((user) => (
              <TableRow key={user.id} className="border-b hover:bg-surface-2">
                <TableCell>{user.name || '—'}</TableCell>
                <TableCell>
                  <span className="text-xs font-medium">{user.role || '—'}</span>
                </TableCell>
                <TableCell>{user.dept || '—'}</TableCell>
                <TableCell>{user.email || '—'}</TableCell>
                <TableCell>
                  <span className={`badge ${user.active ? 'st-Active' : 'st-Inactive'}`}>
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell>
                  {isAdmin ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(user)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setModal({ kind: 'reset', user })}
                        disabled={busy}
                      >
                        Reset Password
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setModal({ kind: 'delete', user })}
                        disabled={busy || user.id === currentUserId}
                        title={
                          user.id === currentUserId
                            ? 'You cannot delete your own account.'
                            : 'Delete this user'
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-text-faint">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="p-6 text-center text-text-faint">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </Table>
        </div>
      </div>

      {/* ---------------- modals ---------------- */}
      {modal?.kind === 'delete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-lg p-6 w-full max-w-md shadow-card">
            <h3 className="text-lg font-display font-bold mb-2">Delete user?</h3>
            <p className="text-sm text-text-dim mb-2">
              <strong>{modal.user.name || modal.user.email}</strong> ({modal.user.email}) will be
              removed and will no longer be able to sign in.
            </p>
            <p className="text-sm text-red-600 mb-4">
              This cannot be undone. History entries created by this user will lose their
              attribution (the author is shown as unknown afterwards).
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setModal(null)} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={() => handleDelete(modal.user)} disabled={busy}>
                {busy ? 'Deleting…' : 'Delete User'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {modal?.kind === 'reset' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-lg p-6 w-full max-w-md shadow-card">
            <h3 className="text-lg font-display font-bold mb-2">
              {modal.password ? 'New password generated' : 'Reset password?'}
            </h3>
            {modal.password ? (
              <>
                <p className="text-sm text-text-dim mb-3">
                  The password for <strong>{modal.user.email}</strong> is now:
                </p>
                <code className="block bg-surface-2 px-3 py-2 rounded text-sm font-mono select-all mb-4">
                  {modal.password}
                </code>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => copyText(modal.password!)}>
                    Copy
                  </Button>
                  <Button onClick={() => setModal(null)}>Done</Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-text-dim mb-4">
                  A new password will be generated for <strong>{modal.user.email}</strong>. The
                  current password stops working immediately — share the new one with the user.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setModal(null)} disabled={busy}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleReset(modal.user)} disabled={busy}>
                    {busy ? 'Generating…' : 'Generate New Password'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

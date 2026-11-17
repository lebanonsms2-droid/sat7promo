'use client';

import { useState, useEffect } from 'react';
import { getUsers, getDepartments } from '@/lib/queries';
import { createUserAction } from '@/app/actions';
import { Input, Select, SelectItem, SelectTrigger, SelectContent, SelectValue, FormControl, Label, Table, TableRow, TableCell, TableHeader } from '@/components/ui';
import { Button } from '@/components/ui';

export default function TeamPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'Viewer' as const,
    department: 'Programming' as const,
    phone: '',
    active: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      const allUsers = await getUsers();
      const allDepts = await getDepartments();
      setUsers(allUsers);
      setDepartments(allDepts);
    }
    loadData();
  }, []);

  const handleSave = async () => {
    try {
      if (!form.name) throw new Error('Name is required');
      if (!form.email) throw new Error('Email is required');

      await createUserAction({
        name: form.name,
        email: form.email,
        role: form.role,
        dept: form.department,
        phone: form.phone,
      });

      setUsers(await getUsers());
      setSuccess(true);
      setError(null);

      // Reset form
      setForm({
        name: '',
        email: '',
        role: 'Viewer' as const,
        department: 'Programming' as const,
        phone: '',
        active: true,
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-display font-bold mb-6">Team & Workload</h1>

      {/* User Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-surface rounded-lg p-6">
          <h2 className="text-sm uppercase tracking-wide font-semibold text-text-dim mb-4">
            Add User
          </h2>
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">
              <p>{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded mb-4">
              <p>User saved successfully</p>
            </div>
          )}
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Name</Label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
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
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  required
                  className="bg-transparent"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select
                  onValueChange={(v) =>
                    setForm({ ...form, role: v })
                  }
                  disabled
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administrator">Administrator</SelectItem>
                    <SelectItem value="Promo Manager">Promo Manager</SelectItem>
                    <SelectItem value="Promo Producer">Promo Producer</SelectItem>
                    <SelectItem value="Editor">Editor</SelectItem>
                    <SelectItem value="Designer">Designer</SelectItem>
                    <SelectItem value="Viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Department</Label>
                <Select
                  onValueChange={(v) =>
                    setForm({ ...form, department: v })
                  }
                  disabled
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Programming">Programming</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Production">Production</SelectItem>
                    <SelectItem value="Digital Media">Digital Media</SelectItem>
                    <SelectItem value="Channel Management">Channel Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Phone</Label>
                <Input
                  name="phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  className="bg-transparent"
                />
              </div>
              <div>
                <Label>Active</Label>
                <Select
                  onValueChange={(v) =>
                    setForm({ ...form, active: v === 'Active' })
                  }
                  disabled
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

            <div className="mt-6 flex gap-3">
              <Button type="submit">Save User</Button>
              <Button
                type="button"
                onClick={() =>
                  setForm({
                    name: '',
                    email: '',
                    role: 'Viewer' as const,
                    department: 'Programming' as const,
                    phone: '',
                    active: true,
                  })
                }
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>

        {/* Users Table */}
        <div className="bg-surface rounded-lg p-6">
          <h2 className="text-sm uppercase tracking-wide font-semibold text-text-dim mb-4">Team Members</h2>
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
                  <span className="text-xs font-medium">
                    {user.role || '—'}
                  </span>
                </TableCell>
                <TableCell>{user.dept || '—'}</TableCell>
                <TableCell>{user.email || '—'}</TableCell>
                <TableCell>
                  <span className={`badge ${user.active ? 'st-Active' : 'st-Inactive'}`}>
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline">Edit</Button>
                  <Button size="sm" variant="outline">Delete</Button>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="p-6 text-center text-text-faint">
                  No team members found
                </TableCell>
              </TableRow>
            )}
          </Table>
        </div>
      </div>
    </div>
  );
}
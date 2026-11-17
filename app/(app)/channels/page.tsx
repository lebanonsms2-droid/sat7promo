'use client';

import { useState, useEffect } from 'react';
import { getChannels } from '@/lib/queries';
import {
  createChannelAction, updateChannelAction, deleteChannelAction, getChannelUsageAction,
} from '@/app/actions';
import { Input, Select, SelectItem, SelectTrigger, SelectContent, SelectValue, Label, Table, TableRow, TableCell, TableHeader, Button } from '@/components/ui';

interface FormValues {
  name: string;
  code: string;
  language: string;
  region: string;
  active: boolean;
}

const emptyForm: FormValues = { name: '', code: '', language: 'Arabic', region: '', active: true };

type DeleteTarget = { channel: any; usage: number };

export default function ChannelsPage() {
  const [channels, setChannels] = useState<any[]>([]);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() { setChannels(await getChannels()); }

  useEffect(() => { reload(); }, []);

  function flash(message: string) { setError(null); setNotice(message); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setNotice(null);
    try {
      if (!form.name.trim()) throw new Error('Channel name is required.');
      if (!form.code.trim()) throw new Error('Channel code is required.');
      const values = { name: form.name, code: form.code, language: form.language, region: form.region };
      if (editingId) {
        await updateChannelAction(editingId, { ...values, active: form.active });
        flash('Channel updated.');
      } else {
        await createChannelAction(values);
        flash('Channel created.');
      }
      await reload();
      setForm(emptyForm); setEditingId(null);
    } catch (err: any) { setError(err?.message ?? 'Save failed.'); }
    finally { setBusy(false); }
  }

  function startEdit(c: any) {
    setError(null); setNotice(null);
    setEditingId(c.id);
    setForm({
      name: c.name ?? '', code: c.code ?? '', language: c.language ?? 'Arabic',
      region: c.region ?? '', active: !!c.active,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() { setEditingId(null); setForm(emptyForm); }

  async function toggleActive(c: any) {
    setBusy(true); setError(null);
    try {
      await updateChannelAction(c.id, {
        name: c.name, code: c.code, language: c.language, region: c.region, active: !c.active,
      });
      await reload();
      flash(c.active ? 'Channel deactivated.' : 'Channel activated.');
    } catch (err: any) { setError(err?.message ?? 'Update failed.'); }
    finally { setBusy(false); }
  }

  async function openDelete(c: any) {
    setBusy(true); setError(null);
    try {
      const usage = await getChannelUsageAction(c.id);
      setDeleteTarget({ channel: c, usage });
    } catch (err: any) { setError(err?.message ?? 'Could not check usage.'); }
    finally { setBusy(false); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true); setError(null);
    try {
      await deleteChannelAction(deleteTarget.channel.id);
      await reload();
      setDeleteTarget(null);
      flash('Channel deleted and removed from its projects.');
    } catch (err: any) { setError(err?.message ?? 'Delete failed.'); setDeleteTarget(null); }
    finally { setBusy(false); }
  }

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="panel-head mb-1">Reference data</p>
          <h1 className="text-2xl font-display font-bold">Channels</h1>
        </div>
        <span className="text-xs text-text-faint">{channels.length} channels</span>
      </div>

      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4 text-sm">{error}</div>}
      {notice && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded mb-4 text-sm">{notice}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="panel p-6">
          <h2 className="panel-head mb-4">{editingId ? 'Edit Channel' : 'Add Channel'}</h2>
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Channel Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="bg-transparent" />
              </div>
              <div>
                <Label>Channel Code</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required className="bg-transparent" />
              </div>
              <div>
                <Label>Language</Label>
                <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Arabic', 'Turkish', 'Farsi', 'English', 'Multi'].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Region</Label>
                <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="bg-transparent" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.active ? 'Active' : 'Inactive'} onValueChange={(v) => setForm({ ...form, active: v === 'Active' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={busy}>{busy ? 'Please wait…' : editingId ? 'Save Changes' : 'Add Channel'}</Button>
              {editingId && <Button type="button" variant="outline" onClick={cancelEdit}>Cancel</Button>}
            </div>
          </form>
        </div>

        <div className="panel p-6">
          <h2 className="panel-head mb-4">All Channels</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Channel</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Language</TableCell>
                  <TableCell>Region</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHeader>
              {channels.map((c) => (
                <TableRow key={c.id} className="border-b hover:bg-surface-2">
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell><code className="text-xs">{c.code}</code></TableCell>
                  <TableCell>{c.language || '—'}</TableCell>
                  <TableCell>{c.region || '—'}</TableCell>
                  <TableCell>
                    <span className={`badge ${c.active ? 'st-Active' : 'st-Inactive'}`}>
                      {c.active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(c)} disabled={busy}>Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => toggleActive(c)} disabled={busy}>
                        {c.active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openDelete(c)} disabled={busy}>Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {channels.length === 0 && (
                <TableRow><TableCell colSpan={6} className="p-6 text-center text-text-faint">No channels found</TableCell></TableRow>
              )}
            </Table>
          </div>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={() => setDeleteTarget(null)}>
          <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-md shadow-popover slide-up" onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-display font-bold mb-2">Delete channel?</h3>
            <p className="text-sm text-text-dim mb-3">
              <strong>{deleteTarget.channel.name}</strong> ({deleteTarget.channel.code}) will be permanently removed.
            </p>
            {deleteTarget.usage > 0 && (
              <p className="text-sm text-amber mb-3">
                This channel is used by <strong>{deleteTarget.usage}</strong> project(s). It will be removed from their channel lists; the projects themselves stay intact.
              </p>
            )}
            <p className="text-xs text-text-faint mb-3">This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={busy}>Cancel</Button>
              <Button onClick={confirmDelete} disabled={busy}>{busy ? 'Deleting…' : 'Delete Channel'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

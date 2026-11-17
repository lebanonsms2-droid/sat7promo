'use client';

import { useState, useEffect } from 'react';
import { getPrograms } from '@/lib/queries';
import {
  createProgramAction, updateProgramAction, deleteProgramAction, getProgramUsageAction,
} from '@/app/actions';
import { Input, Select, SelectItem, SelectTrigger, SelectContent, SelectValue, Label, Table, TableRow, TableCell, TableHeader, Button } from '@/components/ui';

interface FormValues {
  name: string;
  code: string;
  desc: string;
  season: string;
  episodes: string;
  language: string;
  presenter: string;
  prodCompany: string;
  contact: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

const emptyForm: FormValues = {
  name: '', code: '', desc: '', season: '', episodes: '', language: 'Arabic',
  presenter: '', prodCompany: '', contact: '', startDate: '', endDate: '', active: true,
};

type DeleteTarget = { program: any; usage: number; reassignTo: string };

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() { setPrograms(await getPrograms()); }

  useEffect(() => { reload(); }, []);

  function flash(message: string) { setError(null); setNotice(message); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setNotice(null);
    try {
      if (!form.name.trim()) throw new Error('Program name is required.');
      if (!form.code.trim()) throw new Error('Program code is required.');
      const values = {
        name: form.name, code: form.code, description: form.desc, season: form.season,
        episodes: form.episodes, language: form.language, presenter: form.presenter,
        prod_company: form.prodCompany, contact: form.contact,
        start_date: form.startDate, end_date: form.endDate,
      };
      if (editingId) {
        await updateProgramAction(editingId, { ...values, active: form.active });
        flash('Program updated.');
      } else {
        await createProgramAction(values);
        flash('Program created.');
      }
      await reload();
      setForm(emptyForm); setEditingId(null);
    } catch (err: any) {
      setError(err?.message ?? 'Save failed.');
    } finally { setBusy(false); }
  }

  function startEdit(p: any) {
    setError(null); setNotice(null);
    setEditingId(p.id);
    setForm({
      name: p.name ?? '', code: p.code ?? '', desc: p.desc ?? '', season: p.season ?? '',
      episodes: p.episodes ?? '', language: p.language ?? 'Arabic', presenter: p.presenter ?? '',
      prodCompany: p.prod_company ?? '', contact: p.contact ?? '',
      startDate: p.start_date ?? '', endDate: p.end_date ?? '', active: p.active !== false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() { setEditingId(null); setForm(emptyForm); }

  async function toggleActive(p: any) {
    setBusy(true); setError(null);
    try {
      await updateProgramAction(p.id, {
        name: p.name, code: p.code, description: p.desc, season: p.season, episodes: p.episodes,
        language: p.language, presenter: p.presenter, prod_company: p.prod_company,
        contact: p.contact, start_date: p.start_date, end_date: p.end_date,
        active: p.active === false,
      });
      await reload();
      flash(p.active === false ? 'Program activated.' : 'Program deactivated.');
    } catch (err: any) { setError(err?.message ?? 'Update failed.'); }
    finally { setBusy(false); }
  }

  async function openDelete(p: any) {
    setBusy(true); setError(null);
    try {
      const usage = await getProgramUsageAction(p.id);
      setDeleteTarget({ program: p, usage, reassignTo: '' });
    } catch (err: any) { setError(err?.message ?? 'Could not check usage.'); }
    finally { setBusy(false); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true); setError(null);
    try {
      await deleteProgramAction(deleteTarget.program.id, deleteTarget.reassignTo || undefined);
      await reload();
      setDeleteTarget(null);
      flash('Program deleted.');
    } catch (err: any) { setError(err?.message ?? 'Delete failed.'); setDeleteTarget(null); }
    finally { setBusy(false); }
  }

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="panel-head mb-1">Reference data</p>
          <h1 className="text-2xl font-display font-bold">Programs</h1>
        </div>
        <span className="text-xs text-text-faint">{programs.length} programs</span>
      </div>

      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4 text-sm">{error}</div>}
      {notice && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded mb-4 text-sm">{notice}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="panel p-6">
          <h2 className="panel-head mb-4">{editingId ? 'Edit Program' : 'Add Program'}</h2>
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Program Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="bg-transparent" />
              </div>
              <div>
                <Label>Program Code</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required className="bg-transparent" />
              </div>
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <Input value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} className="bg-transparent" />
              </div>
              <div>
                <Label>Season</Label>
                <Input value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} className="bg-transparent" />
              </div>
              <div>
                <Label>Episodes</Label>
                <Input value={form.episodes} onChange={(e) => setForm({ ...form, episodes: e.target.value })} className="bg-transparent" />
              </div>
              <div>
                <Label>Language</Label>
                <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Arabic', 'Turkish', 'Farsi', 'Multi'].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
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
              <div>
                <Label>Presenter</Label>
                <Input value={form.presenter} onChange={(e) => setForm({ ...form, presenter: e.target.value })} className="bg-transparent" />
              </div>
              <div>
                <Label>Production Company</Label>
                <Input value={form.prodCompany} onChange={(e) => setForm({ ...form, prodCompany: e.target.value })} className="bg-transparent" />
              </div>
              <div>
                <Label>Contact</Label>
                <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="bg-transparent" />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="bg-transparent" />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="bg-transparent" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={busy}>{busy ? 'Please wait…' : editingId ? 'Save Changes' : 'Add Program'}</Button>
              {editingId && <Button type="button" variant="outline" onClick={cancelEdit}>Cancel</Button>}
            </div>
          </form>
        </div>

        <div className="panel p-6">
          <h2 className="panel-head mb-4">All Programs</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell>Program</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Language</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHeader>
              {programs.map((p) => (
                <TableRow key={p.id} className="border-b hover:bg-surface-2">
                  <TableCell>
                    <div className="font-medium">{p.name}</div>
                    {p.season && <div className="text-xs text-text-faint">{p.season}</div>}
                  </TableCell>
                  <TableCell><code className="text-xs">{p.code}</code></TableCell>
                  <TableCell>{p.language || '—'}</TableCell>
                  <TableCell>
                    <span className={`badge ${p.active !== false ? 'st-Active' : 'st-Inactive'}`}>
                      {p.active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(p)} disabled={busy}>Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => toggleActive(p)} disabled={busy}>
                        {p.active === false ? 'Activate' : 'Deactivate'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openDelete(p)} disabled={busy}>Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {programs.length === 0 && (
                <TableRow><TableCell colSpan={5} className="p-6 text-center text-text-faint">No programs found</TableCell></TableRow>
              )}
            </Table>
          </div>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={() => setDeleteTarget(null)}>
          <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-md shadow-popover slide-up" onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-display font-bold mb-2">Delete program?</h3>
            <p className="text-sm text-text-dim mb-3">
              <strong>{deleteTarget.program.name}</strong> ({deleteTarget.program.code}) will be permanently removed.
            </p>
            {deleteTarget.usage > 0 ? (
              <>
                <p className="text-sm text-amber mb-3">
                  This program is used by <strong>{deleteTarget.usage}</strong> project(s). Choose a program to reassign them to:
                </p>
                <Select
                  value={deleteTarget.reassignTo}
                  placeholder="Select replacement program"
                  onValueChange={(v) => setDeleteTarget({ ...deleteTarget, reassignTo: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {programs.filter((p) => p.id !== deleteTarget.program.id).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            ) : (
              <p className="text-xs text-text-faint mb-3">No projects use this program, so it can be deleted directly.</p>
            )}
            <div className="flex gap-3 justify-end mt-5">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={busy}>Cancel</Button>
              <Button onClick={confirmDelete} disabled={busy || (deleteTarget.usage > 0 && !deleteTarget.reassignTo)}>
                {busy ? 'Deleting…' : 'Delete Program'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

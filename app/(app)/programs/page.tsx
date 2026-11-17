'use client';

import { useState, useEffect } from 'react';
import { getPrograms, getChannels } from '@/lib/queries';
import { createProgramAction, deactivateProgramAction } from '@/app/actions';
import { Input, Select, SelectItem, SelectTrigger, SelectContent, SelectValue, FormControl, Label, Table, TableRow, TableCell, TableHeader } from '@/components/ui';
import { Button } from '@/components/ui';

interface ProgramFormValues {
  name: string;
  code: string;
  desc: string;
  season: string;
  episodes: string;
  language: string;
  presenter: string | null;
  prodCompany: string | null;
  contact: string | null;
  startDate: string | null;
  endDate: string | null;
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProgramFormValues>({
    name: '',
    code: '',
    desc: '',
    season: '',
    episodes: '',
    language: '',
    presenter: null,
    prodCompany: null,
    contact: null,
    startDate: null,
    endDate: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      const allPrograms = await getPrograms();
      setPrograms(allPrograms);
    }
    loadData();
  }, []);

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!form.name) throw new Error('Program name is required');
      if (!form.code) throw new Error('Program code is required');

      await createProgramAction({
        name: form.name,
        code: form.code,
        description: form.desc,
        season: form.season,
        episodes: form.episodes,
        language: form.language || 'Arabic',
        presenter: form.presenter ?? undefined,
        prod_company: form.prodCompany ?? undefined,
        contact: form.contact ?? undefined,
        start_date: form.startDate ?? undefined,
        end_date: form.endDate ?? undefined,
      });

      setPrograms(await getPrograms());
      setSuccess(true);
      setError(null);
      
      // Reset form
      setForm({
        name: '',
        code: '',
        desc: '',
        season: '',
        episodes: '',
        language: '',
        presenter: null,
        prodCompany: null,
        contact: null,
        startDate: null,
        endDate: null,
      });
      setIsEditing(false);
      setEditingId(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this program?')) {
      try {
        await deactivateProgramAction(id);
        setPrograms(await getPrograms());
        setSuccess(true);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-display font-bold mb-6">Programs</h1>

      {/* Toolbar / Form area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Program Form */}
        <div className="bg-surface rounded-lg p-6">
          <h2 className="text-sm uppercase tracking-wide font-semibold text-text-dim mb-4">
            {editingId ? 'Edit Program' : 'Add Program'}
          </h2>
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">
              <p>{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded mb-4">
              <p>Program saved successfully</p>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Program Name</Label>
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
                <Label>Program Code</Label>
                <Input
                  name="code"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value })
                  }
                  required
                  className="bg-transparent"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  name="desc"
                  value={form.desc}
                  onChange={(e) =>
                    setForm({ ...form, desc: e.target.value })
                  }
                  className="bg-transparent"
                />
              </div>
              <div>
                <Label>Season</Label>
                <Input
                  name="season"
                  value={form.season}
                  onChange={(e) =>
                    setForm({ ...form, season: e.target.value })
                  }
                  className="bg-transparent"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Episodes</Label>
                <Input
                  name="episodes"
                  value={form.episodes}
                  onChange={(e) =>
                    setForm({ ...form, episodes: e.target.value })
                  }
                  className="bg-transparent"
                />
              </div>
              <div>
                <Label>Language</Label>
                <Select
                  onValueChange={(v) =>
                    setForm({ ...form, language: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arabic">Arabic</SelectItem>
                    <SelectItem value="Turkish">Turkish</SelectItem>
                    <SelectItem value="Farsi">Farsi</SelectItem>
                    <SelectItem value="Multi">Multi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Presenter</Label>
                <Input
                  name="presenter"
                  value={form.presenter || ''}
                  onChange={(e) =>
                    setForm({ ...form, presenter: e.target.value || null })
                  }
                  className="bg-transparent"
                />
              </div>
              <div>
                <Label>Production Company</Label>
                <Input
                  name="prodCompany"
                  value={form.prodCompany || ''}
                  onChange={(e) =>
                    setForm({ ...form, prodCompany: e.target.value || null })
                  }
                  className="bg-transparent"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Contact</Label>
                <Input
                  name="contact"
                  value={form.contact || ''}
                  onChange={(e) =>
                    setForm({ ...form, contact: e.target.value || null })
                  }
                  className="bg-transparent"
                />
              </div>
              <div>
                <Label>Contact Email</Label>
                <Input
                  name="contactEmail"
                  type="email"
                  value={form.contact || ''}
                  onChange={(e) =>
                    setForm({ ...form, contact: e.target.value || '' })
                  }
                  className="bg-transparent"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  name="startDate"
                  type="date"
                  value={form.startDate || ''}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value || null })
                  }
                  className="bg-transparent"
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  name="endDate"
                  type="date"
                  value={form.endDate || ''}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value || null })
                  }
                  className="bg-transparent"
                />
              </div>
            </div>

          <div className="mt-6 flex gap-3">
            <Button type="submit" disabled={isEditing}>
              {editingId ? 'Update' : 'Save'}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setForm({
                  name: '',
                  code: '',
                  desc: '',
                  season: '',
                  episodes: '',
                  language: '',
                  presenter: null,
                  prodCompany: null,
                  contact: null,
                  startDate: null,
                  endDate: null,
                });
                setIsEditing(false);
                setEditingId(null);
              }}
            >
              Cancel
            </Button>
          </div>
          </form>
        </div>

        {/* Programs Table */}
        <div className="bg-surface rounded-lg p-6">
          <h2 className="text-sm uppercase tracking-wide font-semibold text-text-dim mb-4">Programs List</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Program</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHeader>
            {programs.map((program) => (
              <TableRow key={program.id} className="border-b hover:bg-surface-2">
                <TableCell>
                  <div>{program.name}</div>
                  <div className="text-xs text-text-faint">{program.code}</div>
                </TableCell>
                <TableCell>{program.code || '—'}</TableCell>
                <TableCell>
                  <span className={`badge ${program.active !== false ? 'st-Active' : 'st-Inactive'}`}>
                    {program.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => program.active !== false && handleDelete(program.id)}
                  >
                    Deactivate
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {programs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="p-6 text-center text-text-faint">
                  No programs found
                </TableCell>
              </TableRow>
            )}
          </Table>
        </div>
      </div>
    </div>
  );
}
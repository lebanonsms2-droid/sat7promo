'use client';

import { useState, useEffect } from 'react';
import { getChannels } from '@/lib/queries';
import { createChannelAction, deactivateChannelAction } from '@/app/actions';
import { Input, Select, SelectItem, SelectTrigger, SelectContent, SelectValue, FormControl, Label, Table, TableRow, TableCell, TableHeader } from '@/components/ui';
import { Button } from '@/components/ui';

interface ChannelFormValues {
  name: string;
  code: string;
  language: string;
  region: string;
  description: string;
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<any[]>([]);
  const [form, setForm] = useState<ChannelFormValues>({
    name: '',
    code: '',
    language: 'Arabic',
    region: '',
    description: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      const allChannels = await getChannels();
      setChannels(allChannels);
    }
    loadData();
  }, []);

  const handleSave = async () => {
    try {
      if (!form.name) throw new Error('Channel name is required');
      if (!form.code) throw new Error('Channel code is required');

      await createChannelAction({
        name: form.name,
        code: form.code,
        language: form.language,
        region: form.region,
        description: form.description,
      });

      setChannels(await getChannels());
      setSuccess(true);
      setError(null);

      // Reset form
      setForm({
        name: '',
        code: '',
        language: 'Arabic',
        region: '',
        description: '',
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this channel?')) {
      try {
        await deactivateChannelAction(id);
        setChannels(await getChannels());
        setSuccess(true);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-display font-bold mb-6">Channels</h1>

      {/* Form area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-surface rounded-lg p-6">
          <h2 className="text-sm uppercase tracking-wide font-semibold text-text-dim mb-4">
            {channels.length > 0 ? 'Channel Details' : 'Add Channel'}
          </h2>
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">
              <p>{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded mb-4">
              <p>Channel saved successfully</p>
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
                <Label>Channel Name</Label>
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
                <Label>Channel Code</Label>
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
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Multi">Multi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Region</Label>
                <Input
                  name="region"
                  value={form.region}
                  onChange={(e) =>
                    setForm({ ...form, region: e.target.value })
                  }
                  className="bg-transparent"
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <textarea
                name="description"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Channel description..."
                className="bg-transparent w-full rounded p-2 text-input"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <Button type="submit">Save Channel</Button>
              <Button
                type="button"
                onClick={() => setForm({ name: '', code: '', language: 'Arabic', region: '', description: '' })}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>

        {/* Channels Table */}
        <div className="bg-surface rounded-lg p-6">
          <h2 className="text-sm uppercase tracking-wide font-semibold text-text-dim mb-4">Channels List</h2>
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
            {channels.map((channel) => (
              <TableRow key={channel.id} className="border-b hover:bg-surface-2">
                <TableCell>
                  <div>{channel.name}</div>
                  <div className="text-xs text-text-faint">{channel.code}</div>
                </TableCell>
                <TableCell>{channel.language || '—'}</TableCell>
                <TableCell>{channel.region || '—'}</TableCell>
                <TableCell>
                  <span className={`badge ${channel.active ? 'st-Active' : 'st-Inactive'}`}>
                    {channel.active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(channel.id)}>
                    Deactivate
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {channels.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="p-6 text-center text-text-faint">
                  No channels found
                </TableCell>
              </TableRow>
            )}
          </Table>
        </div>
      </div>
    </div>
  );
}
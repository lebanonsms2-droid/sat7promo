'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PRIORITIES, PROMO_TYPES } from '@/lib/types';
import type { Priority, PromoType, Department } from '@/lib/types';
import { getChannels, getPrograms, getUsers, getDepartments } from '@/lib/queries';
import { createProjectAction } from '@/app/actions';
import { Icon, PriorityBadge } from '@/components/ui';
import { Input, Select, SelectItem, SelectTrigger, SelectContent, SelectValue, Label, Button } from '@/components/ui';

const SOURCES = ['Email', 'Manual Entry', 'Internal Communication', 'Other'] as const;

const emptyForm = {
  requestDate: new Date().toISOString().split('T')[0],
  requestedBy: '',
  requestingDept: 'Broadcast' as Department,
  requestSource: 'Email' as (typeof SOURCES)[number],
  requesterEmail: '',
  requesterPhone: '',
  promoType: 'TV Promo' as PromoType,
  priority: 'Normal' as Priority,
  deadline: '',
  notes: '',
};

function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

function daysUntil(date: string): number | null {
  if (!date) return null;
  const d = new Date(date + 'T00:00:00').getTime() - new Date(new Date().toDateString()).getTime();
  return Math.ceil(d / 86400000);
}

export default function NewRequestForm() {
  const [formData, setFormData] = useState(emptyForm);
  const [programs, setPrograms] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [assignedUsers, setAssignedUsers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    Promise.all([getPrograms(), getChannels(), getUsers()]).then(([p, c, u]) => {
      setPrograms(p);
      setChannels((c as any[]).filter((x) => x.active !== false));
      setDepts(getDepartments());
      setUsers((u as any[]).filter((x) => x.active !== false));
    });
  }, []);

  const set = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) => {
    setFormData((f) => ({ ...f, [key]: value }));
  };

  const toggle = (list: string[], id: string, setter: (v: string[]) => void) => {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const program = useMemo(() => programs.find((p) => p.id === selectedProgram), [programs, selectedProgram]);
  const chosenChannels = useMemo(() => channels.filter((c) => selectedChannels.includes(c.id)), [channels, selectedChannels]);
  const chosenUsers = useMemo(() => users.filter((u) => assignedUsers.includes(u.id)), [users, assignedUsers]);
  const days = daysUntil(formData.deadline);

  function reset() {
    setFormData(emptyForm);
    setSelectedProgram(null);
    setSelectedChannels([]);
    setAssignedUsers([]);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage('');

    if (!formData.requesterEmail.trim()) { setError('Requester email is required.'); return; }
    if (!formData.requesterPhone.trim()) { setError('Requester phone is required.'); return; }
    if (!selectedProgram) { setError('Select a program.'); return; }
    if (selectedChannels.length === 0) { setError('Select at least one channel.'); return; }
    if (!formData.deadline) { setError('Deadline is required.'); return; }

    setIsSubmitting(true);
    try {
      const created = await createProjectAction({
        program_id: selectedProgram,
        channel_ids: selectedChannels,
        promo_type: formData.promoType,
        priority: formData.priority,
        assigned_user_ids: assignedUsers,
        requested_by: formData.requestedBy,
        requesting_dept: formData.requestingDept,
        requester_email: formData.requesterEmail,
        requester_phone: formData.requesterPhone,
        request_date: formData.requestDate,
        due_date: formData.deadline,
        notes: formData.notes,
      });
      setSuccessMessage(`Project ${created.project_code} created successfully.`);
      reset();
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="p-4 md:p-6 max-w-[1600px] mx-auto fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="panel-head mb-1">Workspace · New request</p>
          <h1 className="text-2xl font-display font-bold">New Promo Request</h1>
          <p className="text-xs text-text-faint mt-0.5">
            Register a new promo request and route it to the right program, channels and team.
          </p>
        </div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm hover:bg-surface-2 transition-colors focus-ring"
        >
          <Icon name="projects" size={15} /> All projects
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-5 text-sm flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="font-bold hover:underline">Dismiss</button>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded mb-5 text-sm flex items-center justify-between gap-3">
          <span>{successMessage}</span>
          <Link href="/projects" className="font-medium underline whitespace-nowrap">View project</Link>
        </div>
      )}

      <form onSubmit={onSubmit} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
        {/* ============ LEFT: form sections ============ */}
        <div className="space-y-5 min-w-0">
          {/* 1. Requester */}
          <div className="panel p-5 md:p-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-7 h-7 rounded-full bg-blue/15 text-blue flex items-center justify-center text-xs font-bold">1</span>
              <div>
                <h2 className="font-display font-semibold text-base">Requester details</h2>
                <p className="text-xs text-text-faint">Who is requesting this promo and how we received it.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <div>
                <Label>Requested By</Label>
                <Input aria-label="Requested By" value={formData.requestedBy} onChange={(e) => set('requestedBy', e.target.value)} placeholder="John Doe" className="bg-transparent" />
              </div>
              <div>
                <Label>Department</Label>
                <Select ariaLabel="Department" value={formData.requestingDept} onValueChange={(v) => set('requestingDept', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{depts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Request Source</Label>
                <Select ariaLabel="Request Source" value={formData.requestSource} onValueChange={(v) => set('requestSource', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Requester Email <span className="text-red">*</span></Label>
                <Input aria-label="Requester Email" type="email" value={formData.requesterEmail} onChange={(e) => set('requesterEmail', e.target.value)} placeholder="requester@sat7.org" required className="bg-transparent" />
              </div>
              <div>
                <Label>Requester Phone <span className="text-red">*</span></Label>
                <Input aria-label="Requester Phone" type="tel" value={formData.requesterPhone} onChange={(e) => set('requesterPhone', e.target.value)} placeholder="+212 5xx xxxxxxx" required className="bg-transparent" />
              </div>
              <div>
                <Label>Request Date</Label>
                <Input aria-label="Request Date" type="date" value={formData.requestDate} onChange={(e) => set('requestDate', e.target.value)} className="bg-transparent" />
              </div>
            </div>
          </div>

          {/* 2. Promo details */}
          <div className="panel p-5 md:p-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-7 h-7 rounded-full bg-blue/15 text-blue flex items-center justify-center text-xs font-bold">2</span>
              <div>
                <h2 className="font-display font-semibold text-base">Promo details</h2>
                <p className="text-xs text-text-faint">What is being produced, for which program and by when.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Program <span className="text-red">*</span></Label>
                <Select ariaLabel="Program" value={selectedProgram ?? ''} placeholder="Select a program" onValueChange={setSelectedProgram}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {programs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {program && (
                  <p className="text-[11px] text-text-faint mt-1.5">
                    {program.language} · {program.season || 'No season'} · {program.presenter || 'No presenter listed'}
                  </p>
                )}
              </div>
              <div>
                <Label>Promo / Spot Type</Label>
                <Select ariaLabel="Promo / Spot Type" value={formData.promoType} onValueChange={(v) => set('promoType', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PROMO_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Deadline / Due Date <span className="text-red">*</span></Label>
                <Input aria-label="Deadline / Due Date" type="date" value={formData.deadline} onChange={(e) => set('deadline', e.target.value)} required className="bg-transparent" />
                {days !== null && (
                  <p className={`text-[11px] mt-1.5 ${days < 0 ? 'text-red' : days <= 3 ? 'text-amber' : 'text-text-faint'}`}>
                    {days < 0 ? `${Math.abs(days)} day(s) overdue` : days === 0 ? 'Due today' : `Due in ${days} day(s)`}
                  </p>
                )}
              </div>
              <div>
                <Label>Priority</Label>
                <div className="flex gap-2 pt-1">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => set('priority', p)}
                      className={`flex-1 px-3 py-2 rounded-md border text-sm transition-colors focus-ring ${
                        formData.priority === p
                          ? 'border-blue bg-blue/10 text-text font-semibold'
                          : 'border-border text-text-dim hover:bg-surface-2'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label>Additional Notes</Label>
                <textarea
                  aria-label="Additional Notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="Brief, target audience, specific requirements, client feedback…"
                  className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-input placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* 3. Channels */}
          <div className="panel p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-blue/15 text-blue flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <h2 className="font-display font-semibold text-base">Channels</h2>
                  <p className="text-xs text-text-faint">Select one or more channels for this promo.</p>
                </div>
              </div>
              <span className="text-xs text-text-faint tabnums">{selectedChannels.length} selected</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {channels.map((c) => {
                const on = selectedChannels.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggle(selectedChannels, c.id, setSelectedChannels)}
                    aria-pressed={on}
                    className={`relative text-left p-3 rounded-md border transition-all focus-ring ${
                      on ? 'border-blue bg-blue/10' : 'border-border hover:bg-surface-2'
                    }`}
                  >
                    <span className={`absolute top-2.5 right-2.5 w-4 h-4 rounded-full border flex items-center justify-center ${
                      on ? 'bg-blue border-blue text-white' : 'border-border'
                    }`}>
                      {on && <Icon name="check" size={10} />}
                    </span>
                    <span className="block font-medium text-sm pr-5 truncate">{c.name}</span>
                    <span className="block text-[11px] text-text-faint mt-0.5">{c.code} · {c.language}{c.region ? ` · ${c.region}` : ''}</span>
                  </button>
                );
              })}
              {channels.length === 0 && <p className="col-span-full text-sm text-text-faint py-4">No active channels available.</p>}
            </div>
          </div>

          {/* 4. Assignment */}
          <div className="panel p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-blue/15 text-blue flex items-center justify-center text-xs font-bold">4</span>
                <div>
                  <h2 className="font-display font-semibold text-base">Assignment</h2>
                  <p className="text-xs text-text-faint">Assign team members to this request (optional).</p>
                </div>
              </div>
              <span className="text-xs text-text-faint tabnums">{assignedUsers.length} assigned</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {users.map((u) => {
                const on = assignedUsers.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggle(assignedUsers, u.id, setAssignedUsers)}
                    aria-pressed={on}
                    className={`flex items-center gap-3 p-2.5 rounded-md border text-left transition-all focus-ring ${
                      on ? 'border-blue bg-blue/10' : 'border-border hover:bg-surface-2'
                    }`}
                  >
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ background: u.color || '#4763c6' }}
                    >
                      {initials(u.name || u.email)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm truncate">{u.name || u.email}</span>
                      <span className="block text-[11px] text-text-faint truncate">{u.role} · {u.dept || '—'}</span>
                    </span>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      on ? 'bg-blue border-blue text-white' : 'border-border'
                    }`}>
                      {on && <Icon name="check" size={10} />}
                    </span>
                  </button>
                );
              })}
              {users.length === 0 && <p className="col-span-full text-sm text-text-faint py-4">No active users available.</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting} className="xl:hidden">
              {isSubmitting ? 'Creating…' : 'Submit Request'}
            </Button>
            <button type="button" onClick={reset} className="text-sm text-text-dim hover:text-text hover:underline focus-ring">
              Reset form
            </button>
          </div>
        </div>

        {/* ============ RIGHT: live summary ============ */}
        <aside className="space-y-5 xl:sticky xl:top-4">
          <div className="panel p-5">
            <h2 className="panel-head mb-4">Request summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
                <span className="text-text-dim">Status</span>
                <span className="badge st-New">New</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-text-dim">Program</span>
                <span className="font-medium text-right truncate max-w-[60%]">{program ? `${program.code}` : '—'}</span>
              </div>
              {program && <p className="text-xs text-text-faint -mt-2 text-right">{program.name}</p>}
              <div className="flex items-center justify-between gap-3">
                <span className="text-text-dim">Type</span>
                <span className="font-medium text-right">{formData.promoType}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-text-dim">Priority</span>
                <PriorityBadge priority={formData.priority} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-text-dim">Deadline</span>
                <span className="font-medium tabnums">{formData.deadline ? new Date(formData.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '—'}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[11px] font-bold uppercase tracking-widest text-text-faint mb-2">
                Channels ({chosenChannels.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {chosenChannels.map((c) => (
                  <span key={c.id} className="badge bg-blue-soft text-blue">{c.code}</span>
                ))}
                {chosenChannels.length === 0 && <span className="text-xs text-text-faint">None selected</span>}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[11px] font-bold uppercase tracking-widest text-text-faint mb-2">
                Assigned ({chosenUsers.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {chosenUsers.map((u) => (
                  <span key={u.id} className="badge">{initials(u.name || u.email)}</span>
                ))}
                {chosenUsers.length === 0 && <span className="text-xs text-text-faint">Unassigned</span>}
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full mt-6 hidden xl:inline-flex">
              {isSubmitting ? 'Creating…' : 'Submit Request'}
            </Button>
            <p className="text-[11px] text-text-faint text-center mt-3">
              Project ID is generated automatically on submit.
            </p>
          </div>

          <div className="panel p-5">
            <h2 className="panel-head mb-3">Quick tips</h2>
            <ul className="space-y-2.5 text-xs text-text-dim">
              <li className="flex gap-2"><Icon name="check" size={13} className="text-teal shrink-0 mt-0.5" /> Add the requester's email and phone so we can follow up.</li>
              <li className="flex gap-2"><Icon name="check" size={13} className="text-teal shrink-0 mt-0.5" /> Select every channel the promo should air on.</li>
              <li className="flex gap-2"><Icon name="check" size={13} className="text-teal shrink-0 mt-0.5" /> Use notes for client feedback or specific requirements.</li>
            </ul>
          </div>
        </aside>
      </form>
    </section>
  );
}

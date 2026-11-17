'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { type PromoStatus } from '@/lib/types';
import { getProjects } from '@/lib/queries';
import { updateProjectStatusAction } from '@/app/actions';
import { PriorityBadge, Pipeline, Icon } from '@/components/ui';

const PIPELINE: PromoStatus[] = [
  'New', 'Pending', 'Assigned', 'In Progress', 'Review', 'Approved', 'Completed',
];

const TONE: Record<string, string> = {
  New: 'bg-blue', Pending: 'bg-blue', Assigned: 'bg-violet', 'In Progress': 'bg-amber',
  Review: 'bg-violet', 'Changes Required': 'bg-amber', Approved: 'bg-teal', Completed: 'bg-teal',
  'On Hold': 'bg-text-faint', Cancelled: 'bg-red',
};

export default function ProductionBoard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<PromoStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { getProjects().then(setProjects); }, []);

  async function move(id: string, status: PromoStatus) {
    setBusy(true); setError(null);
    try {
      await updateProjectStatusAction(id, status);
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    } catch (err: any) { setError(err?.message ?? 'Could not move project.'); }
    finally { setBusy(false); }
  }

  return (
    <section className="p-4 md:p-6 max-w-[1600px] mx-auto fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="panel-head mb-1">Workspace · Production</p>
          <h1 className="text-2xl font-display font-bold">Production Board</h1>
          <p className="text-xs text-text-faint mt-0.5">Drag projects between stages to update their status. Changes are saved automatically.</p>
        </div>
        <Link href="/new" className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm hover:bg-surface-2 transition-colors focus-ring">
          <Icon name="plus" size={15} /> New request
        </Link>
      </div>

      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-5 text-sm">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="panel p-3.5"><p className="text-[11px] text-text-dim">Total projects</p><p className="text-2xl font-display font-bold tabnums">{projects.length}</p></div>
        <div className="panel p-3.5"><p className="text-[11px] text-text-dim">In production</p><p className="text-2xl font-display font-bold tabnums text-amber">{projects.filter((p) => p.status === 'In Progress').length}</p></div>
        <div className="panel p-3.5"><p className="text-[11px] text-text-dim">Awaiting review</p><p className="text-2xl font-display font-bold tabnums text-violet">{projects.filter((p) => p.status === 'Review').length}</p></div>
        <div className="panel p-3.5"><p className="text-[11px] text-text-dim">Completed</p><p className="text-2xl font-display font-bold tabnums text-teal">{projects.filter((p) => p.status === 'Completed').length}</p></div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 items-start">
        {PIPELINE.map((status) => {
          const items = projects.filter((p) => p.status === status);
          return (
            <div
              key={status}
              onDragOver={(e) => { e.preventDefault(); setOver(status); }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/plain');
                if (id) move(id, status);
                setDragging(null); setOver(null);
              }}
              className={`panel p-3 w-[290px] shrink-0 min-h-[420px] transition-colors ${
                over === status ? 'border-blue bg-blue/5' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${TONE[status] || 'bg-text-faint'}`} />
                  <h2 className="text-sm font-semibold">{status}</h2>
                </div>
                <span className="text-xs text-text-faint tabnums badge">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((p) => (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData('text/plain', p.id); setDragging(p.id); }}
                    onDragEnd={() => { setDragging(null); setOver(null); }}
                    className={`bg-surface-2 border border-border rounded-md p-3 cursor-grab active:cursor-grabbing transition-opacity hover:border-blue/60 ${
                      dragging === p.id ? 'opacity-40' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-xs font-semibold truncate">{p.project_code}</span>
                      <PriorityBadge priority={p.priority} />
                    </div>
                    <p className="text-xs text-text-dim truncate mb-2">{p.program?.name || p.promo_type}</p>
                    <div className="flex items-center justify-between text-[11px] text-text-faint mb-2">
                      <span className="tabnums">{p.due_date ? new Date(p.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'No due date'}</span>
                      <span>{p.channels?.length || 0} channel(s)</span>
                    </div>
                    <Pipeline status={p.status} />
                    {busy && <div className="h-0.5 mt-2 rounded bg-blue/40 overflow-hidden"><div className="h-full w-1/2 bg-blue animate-pulse" /></div>}
                  </div>
                ))}
                {items.length === 0 && (
                  <div className={`border border-dashed rounded-md py-8 text-center text-xs transition-colors ${
                    over === status ? 'border-blue text-blue' : 'border-border text-text-faint'
                  }`}>
                    Drop projects here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-text-faint mt-1">
        Tip: you can also change a project's status from its detail view on the Projects page.
      </p>
    </section>
  );
}

'use client';

import { useEffect, useState } from 'react';
import {
  getDashboardStats, getProjectsByChannel, getProjectsByProgram, getRecentActivity,
  getStatusCounts, getUpcomingDeadlines, getUsers, getProjects,
} from '@/lib/queries';
import { STATUSES } from '@/lib/types';
import { StatusBadge, Icon } from '@/components/ui';

const CHANNEL_NAMES: Record<string, string> = {
  ARB: 'SAT-7 Arabic', PLS: 'SAT-7 PLUS', KID: 'SAT-7 KIDS',
  TRK: 'SAT-7 TÜRK', PRS: 'SAT-7 PARS', DIG: 'SAT-7 Digital',
};
const PROGRAM_NAMES: Record<string, string> = {
  NAH: 'Nour Al Hayat', KDC: 'Kids Corner', INS: 'Insights',
  YUF: 'Yeni Ufuklar', CHC: 'Chai & Chat', MNL: 'Music Night Live',
};
const TONE: Record<string, string> = {
  New: 'bg-blue', Pending: 'bg-blue', Assigned: 'bg-violet', Review: 'bg-violet',
  'In Progress': 'bg-amber', 'Changes Required': 'bg-amber', Approved: 'bg-teal',
  Completed: 'bg-teal', 'On Hold': 'bg-text-faint', Cancelled: 'bg-red',
};

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function BarRow({ label, value, max, tone = 'bg-blue' }: { label: string; value: number; max: number; tone?: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_120px_32px] items-center gap-3">
      <span className="text-sm text-text-dim truncate">{label}</span>
      <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
        <div className={`h-full rounded-full ${tone} transition-all duration-500`} style={{ width: `${max ? Math.max(2, (value / max) * 100) : 0}%` }} />
      </div>
      <span className="text-sm font-semibold tabnums text-right">{value}</span>
    </div>
  );
}

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [channels, setChannels] = useState<Record<string, number>>({});
  const [programs, setPrograms] = useState<Record<string, number>>({});
  const [statuses, setStatuses] = useState<Record<string, number>>({});
  const [activity, setActivity] = useState<any[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      getDashboardStats(), getProjectsByChannel(), getProjectsByProgram(), getStatusCounts(),
      getRecentActivity(10), getUpcomingDeadlines(6), getUsers(), getProjects(),
    ]).then(([s, ch, pr, st, ac, dl, us, pj]) => {
      setStats(s); setChannels(ch); setPrograms(pr); setStatuses(st);
      setActivity(ac as any[]); setDeadlines(dl as any[]);
      setUsers(us as any[]); setProjects(pj as any[]);
    });
  }, []);

  if (!stats) {
    return <div className="p-6 space-y-4"><div className="skeleton h-8 w-64" /><div className="grid grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24" />)}</div></div>;
  }

  const total = stats.totalProjects || 0;
  const completed = stats.completed || 0;
  const completionPct = total ? Math.round((completed / total) * 100) : 0;
  const channelEntries = Object.entries(channels).map(([c, n]) => [CHANNEL_NAMES[c] || c, n] as [string, number]).sort((a, b) => b[1] - a[1]);
  const programEntries = Object.entries(programs).map(([p, n]) => [PROGRAM_NAMES[p] || p, n] as [string, number]).sort((a, b) => b[1] - a[1]);
  const statusEntries = STATUSES.map((s) => [s, statuses[s] || 0] as [string, number]).filter(([, n]) => n > 0);
  const maxChannel = Math.max(...channelEntries.map((e) => e[1]), 1);
  const maxProgram = Math.max(...programEntries.map((e) => e[1]), 1);

  // Workload: count active assignments per user from live projects
  const workload = users.map((u) => ({
    user: u,
    count: projects.filter((p) => (p.assigned_user_ids || []).includes(u.id) && p.status !== 'Completed').length,
  })).sort((a, b) => b.count - a.count);
  const maxWorkload = Math.max(...workload.map((w) => w.count), 1);

  const kpis = [
    { label: 'Total requests', value: total, tone: '' },
    { label: 'Completed', value: completed, tone: 'text-teal' },
    { label: 'Overdue', value: stats.overdueProjects, tone: 'text-red' },
    { label: 'Due this week', value: stats.dueThisWeek, tone: 'text-amber' },
    { label: 'Completion rate', value: `${completionPct}%`, tone: 'text-blue' },
  ];

  return (
    <section className="p-4 md:p-6 max-w-[1600px] mx-auto fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="panel-head mb-1">Insights · Reports & analytics</p>
          <h1 className="text-2xl font-display font-bold">Reports & Analytics</h1>
          <p className="text-xs text-text-faint mt-0.5">Live overview of request volume, delivery and team workload.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-teal bg-teal-soft px-2.5 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-teal" /> Live data
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {kpis.map((k) => (
          <div key={k.label} className="panel p-3.5">
            <p className="text-[11px] text-text-dim truncate">{k.label}</p>
            <p className={`text-2xl font-display font-bold tabnums mt-0.5 ${k.tone}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
        {/* Completion donut */}
        <div className="panel p-5 flex flex-col items-center justify-center">
          <h2 className="panel-head mb-5 self-start">Delivery status</h2>
          <div
            className="w-44 h-44 rounded-full flex items-center justify-center"
            style={{ background: `conic-gradient(rgb(var(--teal)) 0 ${completionPct}%, rgb(var(--surface-2)) ${completionPct}% 100%)` }}
          >
            <div className="w-32 h-32 rounded-full bg-surface flex flex-col items-center justify-center">
              <span className="text-3xl font-display font-bold tabnums">{completionPct}%</span>
              <span className="text-[11px] text-text-faint">completed</span>
            </div>
          </div>
          <div className="flex gap-5 mt-5 text-xs">
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-teal" /> {completed} done</span>
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-surface-2 border border-border" /> {total - completed} open</span>
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="panel-head mb-5">Projects by channel</h2>
          <div className="space-y-3">
            {channelEntries.map(([label, n]) => <BarRow key={label} label={label} value={n} max={maxChannel} />)}
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="panel-head mb-5">Projects by program</h2>
          <div className="space-y-3">
            {programEntries.map(([label, n]) => <BarRow key={label} label={label} value={n} max={maxProgram} tone="bg-violet" />)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
        <div className="panel p-5 xl:col-span-2">
          <h2 className="panel-head mb-4">Pipeline distribution</h2>
          <div className="flex h-3 rounded-full overflow-hidden bg-surface-2 mb-5">
            {statusEntries.map(([s, n]) => (
              <div key={s} className={`${TONE[s] || 'bg-text-faint'} h-full`} style={{ width: `${(n / total) * 100}%` }} title={`${s}: ${n}`} />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2.5">
            {statusEntries.map(([s, n]) => (
              <div key={s} className="flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full shrink-0 ${TONE[s] || 'bg-text-faint'}`} />
                <span className="text-text-dim flex-1 truncate">{s}</span>
                <span className="font-semibold tabnums">{n}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="panel-head mb-4">Team workload</h2>
          <div className="space-y-3">
            {workload.map(({ user, count }) => (
              <div key={user.id} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: user.color || '#4763c6' }}>
                  {(user.name || user.email || '?').split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="truncate">{user.name || user.email}</span>
                    <span className="font-semibold tabnums">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                    <div className="h-full rounded-full bg-blue/80" style={{ width: `${(count / maxWorkload) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="panel p-5">
          <h2 className="panel-head mb-4">Upcoming deadlines</h2>
          {deadlines.length === 0 && <p className="py-8 text-center text-sm text-text-faint">No upcoming deadlines.</p>}
          <div className="divide-y divide-border">
            {deadlines.map((d) => (
              <div key={d.id} className="flex items-center gap-3 py-2.5">
                <span className="w-1 h-9 bg-amber rounded-full shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs font-semibold">{d.project_code}</p>
                  <p className="text-xs text-text-faint truncate">{d.programs?.[0]?.name || d.priority || 'Project'}</p>
                </div>
                <StatusBadge status={d.status} />
                <span className="text-xs text-text-dim tabnums">{new Date(d.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="panel-head mb-4">Recent activity</h2>
          <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
            {activity.map((a) => {
              const actor = a.profiles?.[0]?.full_name || 'System';
              return (
                <div key={a.id} className="flex items-start gap-3 py-2.5">
                  <span className="w-7 h-7 rounded-full bg-surface-2 border border-border flex items-center justify-center text-[10px] font-bold shrink-0">
                    {actor.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm"><span className="font-medium">{actor}</span> <span className="text-text-dim">→</span> <span className="font-mono text-xs">{a.projects?.project_code || 'project'}</span> <span className="text-text-dim">{a.to_status}</span></p>
                    {a.comment && <p className="text-xs text-text-faint truncate">{a.comment}</p>}
                  </div>
                  <span className="text-[11px] text-text-faint whitespace-nowrap">{timeAgo(a.created_at)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

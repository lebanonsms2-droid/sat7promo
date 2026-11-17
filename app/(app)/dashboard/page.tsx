'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { STATUSES } from '@/lib/types';
import {
  getDashboardStats, getRecentActivity, getProjectsByChannel, getProjectsByProgram,
  getUsers, getStatusCounts, getUpcomingDeadlines,
} from '@/lib/queries';
import { StatusBadge, Icon } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

type Stats = {
  totalProjects: number; newRequests: number; pendingProjects: number; assignedProjects: number;
  inProgress: number; awaitingReview: number; approved: number; completed: number;
  overdueProjects: number; dueThisWeek: number;
};

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

const statusTone: Record<string, string> = {
  New: 'bg-blue', Pending: 'bg-blue', Assigned: 'bg-violet', Review: 'bg-violet',
  'In Progress': 'bg-amber', 'Changes Required': 'bg-amber', Approved: 'bg-teal',
  Completed: 'bg-teal', 'On Hold': 'bg-text-faint', Cancelled: 'bg-red',
};

function DistributionBar({ counts, max }: { counts: [string, number][]; max: number }) {
  return (
    <div className="space-y-2.5">
      {counts.map(([label, value]) => (
        <div key={label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-text-dim truncate">{label}</span>
            <span className="font-semibold tabnums">{value}</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue/80 transition-all duration-500"
              style={{ width: `${max ? Math.max(3, (value / max) * 100) : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [channelCounts, setChannelCounts] = useState<Record<string, number>>({});
  const [programCounts, setProgramCounts] = useState<Record<string, number>>({});
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [activity, setActivity] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [myEmail, setMyEmail] = useState('');

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setMyEmail(data.user?.email ?? ''));
    Promise.all([
      getDashboardStats(), getProjectsByChannel(), getProjectsByProgram(),
      getStatusCounts(), getRecentActivity(6), getUsers(), getUpcomingDeadlines(5),
    ]).then(([s, ch, pr, st, ac, us, dl]) => {
      setStats(s as Stats);
      setChannelCounts(ch); setProgramCounts(pr); setStatusCounts(st);
      setActivity(ac as any[]); setUsers(us as any[]); setDeadlines(dl as any[]);
    });
  }, []);

  const firstName = (users.find((u) => u.email === myEmail)?.name || 'there').split(' ')[0];
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (!stats) {
    return (
      <div className="p-6 space-y-4">
        <div className="skeleton h-8 w-56" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton h-20" />)}
        </div>
      </div>
    );
  }

  const kpis: { label: string; value: number; tone?: string; icon: string }[] = [
    { label: 'Total Projects', value: stats.totalProjects, icon: 'projects' },
    { label: 'New Requests', value: stats.newRequests, tone: 'text-blue', icon: 'plus' },
    { label: 'In Progress', value: stats.inProgress, tone: 'text-amber', icon: 'dashboard' },
    { label: 'Awaiting Review', value: stats.awaitingReview, tone: 'text-violet', icon: 'reports' },
    { label: 'Completed', value: stats.completed, tone: 'text-teal', icon: 'check' },
    { label: 'Pending', value: stats.pendingProjects, icon: 'projects' },
    { label: 'Assigned', value: stats.assignedProjects, icon: 'users' },
    { label: 'Approved', value: stats.approved, tone: 'text-teal', icon: 'check' },
    { label: 'Overdue', value: stats.overdueProjects, tone: 'text-red', icon: 'alert' },
    { label: 'Due This Week', value: stats.dueThisWeek, tone: 'text-amber', icon: 'calendar' },
  ];

  const channelNames: Record<string, string> = {
    ARB: 'SAT-7 Arabic', PLS: 'SAT-7 PLUS', KID: 'SAT-7 KIDS',
    TRK: 'SAT-7 TÜRK', PRS: 'SAT-7 PARS', DIG: 'SAT-7 Digital',
  };
  const programNames: Record<string, string> = {
    NAH: 'Nour Al Hayat', KDC: 'Kids Corner', INS: 'Insights',
    YUF: 'Yeni Ufuklar', CHC: 'Chai & Chat',
  };
  const channelEntries: [string, number][] = Object.entries(channelCounts)
    .map(([code, n]): [string, number] => [channelNames[code] || code, n])
    .sort((a, b) => b[1] - a[1]);
  const programEntries: [string, number][] = Object.entries(programCounts)
    .map(([code, n]): [string, number] => [programNames[code] || code, n])
    .sort((a, b) => b[1] - a[1]);
  const statusEntries = STATUSES.map((s) => [s, statusCounts[s] || 0] as [string, number]).filter(([, n]) => n > 0);

  return (
    <section className="p-4 md:p-6 max-w-[1600px] mx-auto fade-in">
      {/* Header + quick actions */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="panel-head mb-1">Overview</p>
          <h1 className="text-2xl font-display font-bold">Good day, {firstName}</h1>
          <p className="text-xs text-text-faint mt-0.5">{today}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/projects" className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm hover:bg-surface-2 transition-colors focus-ring">
            <Icon name="projects" size={15} /> All projects
          </Link>
          <Link href="/new" className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-red text-white text-sm font-medium hover:bg-red/90 transition-colors focus-ring">
            <Icon name="plus" size={15} /> New request
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {kpis.map((k) => (
          <div key={k.label} className="panel p-3.5 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] text-text-dim truncate">{k.label}</p>
              <p className={`text-2xl font-display font-bold tabnums mt-0.5 ${k.tone || ''}`}>{k.value}</p>
            </div>
            <Icon name={k.icon} size={16} className="text-text-faint mt-0.5 shrink-0" />
          </div>
        ))}
      </div>

      {/* Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div className="panel p-4">
          <h2 className="panel-head mb-4">Pipeline status</h2>
          <div className="flex h-3 rounded-full overflow-hidden bg-surface-2 mb-4">
            {statusEntries.map(([status, n]) => (
              <div
                key={status}
                className={`${statusTone[status] || 'bg-text-faint'} h-full transition-all duration-500`}
                style={{ width: `${(n / stats.totalProjects) * 100}%` }}
                title={`${status}: ${n}`}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {statusEntries.map(([status, n]) => (
              <div key={status} className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full shrink-0 ${statusTone[status] || 'bg-text-faint'}`} />
                <span className="text-text-dim truncate flex-1">{status}</span>
                <span className="font-semibold tabnums">{n}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-4">
          <h2 className="panel-head mb-4">Projects by channel</h2>
          <DistributionBar counts={channelEntries} max={Math.max(...channelEntries.map((e) => e[1]), 1)} />
        </div>
        <div className="panel p-4">
          <h2 className="panel-head mb-4">Projects by program</h2>
          <DistributionBar counts={programEntries} max={Math.max(...programEntries.map((e) => e[1]), 1)} />
        </div>
      </div>

      {/* Activity + deadlines */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="panel p-4 xl:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="panel-head">Recent activity</h2>
            <Link href="/projects" className="text-xs text-blue hover:underline">View all</Link>
          </div>
          {activity.length === 0 && <p className="py-10 text-center text-sm text-text-faint">No activity yet.</p>}
          <div className="divide-y divide-border">
            {activity.map((a) => {
              const actor = a.profiles?.[0]?.full_name || 'System';
              const initials = actor.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();
              return (
                <div key={a.id} className="flex items-start gap-3 py-3 first:pt-2">
                  <span className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center text-[10px] font-bold text-text-dim shrink-0">
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">
                      <span className="font-medium">{actor}</span>
                      <span className="text-text-dim"> {a.from_status ? 'moved' : 'created'} </span>
                      <span className="font-mono text-xs">{a.projects?.project_code || 'project'}</span>
                      <span className="text-text-dim"> to </span>
                      <StatusBadge status={a.to_status} />
                    </p>
                    {a.comment && <p className="text-xs text-text-faint mt-0.5 truncate">{a.comment}</p>}
                  </div>
                  <span className="text-[11px] text-text-faint whitespace-nowrap mt-0.5">{timeAgo(a.created_at)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="panel-head">Upcoming deadlines</h2>
              <Icon name="calendar" size={15} className="text-text-faint" />
            </div>
            {deadlines.length === 0 && <p className="py-6 text-center text-sm text-text-faint">No deadlines ahead.</p>}
            <div className="space-y-2">
              {deadlines.map((d) => (
                <Link
                  key={d.id}
                  href={`/projects?q=${encodeURIComponent(d.project_code)}`}
                  className="flex items-center gap-3 p-2 -mx-2 rounded hover:bg-surface-2 transition-colors"
                >
                  <span className="w-1 h-9 rounded-full bg-amber shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-xs font-semibold">{d.project_code}</span>
                    <span className="block text-xs text-text-faint truncate">
                      {d.programs?.[0]?.code || d.priority || 'Project'}
                    </span>
                  </span>
                  <span className="text-xs text-text-dim whitespace-nowrap tabnums">
                    {new Date(d.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="panel p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="panel-head">Team</h2>
              <Link href="/users" className="text-xs text-blue hover:underline">Manage</Link>
            </div>
            <div className="space-y-2">
              {users.slice(0, 5).map((u) => (
                <div key={u.id} className="flex items-center gap-2.5">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ background: u.color || '#4763c6' }}
                  >
                    {(u.name || u.email || '?').split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm truncate">{u.name || u.email}</span>
                    <span className="block text-[11px] text-text-faint truncate">{u.dept || u.role}</span>
                  </span>
                  <span className={`badge ${u.active ? 'st-Active' : 'st-Inactive'}`}>{u.active ? 'Active' : 'Inactive'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

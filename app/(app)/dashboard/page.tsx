'use client';

import { STATUSES, PROMO_TYPES, PRIORITIES, DEPTS } from '@/lib/types';
import { getDashboardStats, getRecentActivity, getProjectsByChannel, getProjectsByProgram, getUsers, getStatusCounts } from '@/lib/queries';
import { StatusBadge, PriorityBadge, Pipeline, Icon } from '@/components/ui';
import { StatCard } from '@/components/ui/StatCard';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [stats, setStats] = useState<{
    totalProjects: number;
    newRequests: number;
    pendingProjects: number;
    assignedProjects: number;
    inProgress: number;
    awaitingReview: number;
    approved: number;
    completed: number;
    overdueProjects: number;
    dueThisWeek: number;
  } | null>(null);

  const [channelCounts, setChannelCounts] = useState<Record<string, number>>({});
  const [programCounts, setProgramCounts] = useState<Record<string, number>>({});
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const statsResult = await getDashboardStats();
      setStats(statsResult);
      setChannelCounts(await getProjectsByChannel());
      setProgramCounts(await getProjectsByProgram());
      setStatusCounts(await getStatusCounts());
      setRecentActivity(await getRecentActivity(5));
      setUsers(await getUsers());
    }
    loadData();
  }, []);

  if (!stats) return <div className="min-h-screen p-4">Loading...</div>;

  return (
    <section className="p-4">
      <h1 className="text-2xl font-display font-bold mb-6">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Projects" num={stats.totalProjects} />
        <StatCard label="New Requests" num={stats.newRequests} accent="blue" />
        <StatCard label="Pending" num={stats.pendingProjects} accent="amber" />
        <StatCard label="Assigned" num={stats.assignedProjects} accent="violet" />
        <StatCard label="In Progress" num={stats.inProgress} accent="amber" />
        <StatCard label="Awaiting Review" num={stats.awaitingReview} accent="blue" />
        <StatCard label="Approved" num={stats.approved} accent="teal" />
        <StatCard label="Completed" num={stats.completed} accent="teal" />
        <StatCard label="Overdue" num={stats.overdueProjects} accent="red" />
        <StatCard label="Due This Week" num={stats.dueThisWeek} accent="amber" />
      </div>

      {/* Visualizations row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Projects by Channel */}
        <div className="bg-surface rounded-lg p-6 h-full">
          <h2 className="text-sm uppercase tracking-wide font-semibold text-text-dim mb-4">Projects by Channel</h2>
          <div className="space-y-2">
            {Object.entries(channelCounts).map(([code, count]) => {
              const channelNames: Record<string, string> = {
                ARB: 'SAT-7 Arabic', PLS: 'SAT-7 PLUS', KID: 'SAT-7 KIDS',
                TRK: 'SAT-7 TÜRK', PRS: 'SAT-7 PARS', DIG: 'SAT-7 Digital',
              };
              return (
                <div key={code} className="flex justify-between items-center">
                  <span className="text-sm text-text-faint">{channelNames[code] || code}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Projects by Program */}
        <div className="bg-surface rounded-lg p-6 h-full">
          <h2 className="text-sm uppercase tracking-wide font-semibold text-text-dim mb-4">Projects by Program</h2>
          <div className="space-y-2">
            {Object.entries(programCounts).map(([code, count]) => {
              const programNames: Record<string, string> = {
                NAH: 'Nour Al Hayat', KDC: 'Kids Corner', INS: 'Insights',
                YUF: 'Yeni Ufuklar', CHC: 'Chai & Chat',
              };
              return (
                <div key={code} className="flex justify-between items-center">
                  <span className="text-sm text-text-faint">{programNames[code] || code}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-surface rounded-lg p-6 h-full">
          <h2 className="text-sm uppercase tracking-wide font-semibold text-text-dim mb-4">Status Distribution</h2>
          <div className="space-y-3">
            {STATUSES.map((status) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-text-faint">{status}</span>
                <span className={`text-sm font-bold st-${status.replace(/\s/g, '')}`}>
                  {statusCounts[status] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-surface rounded-lg p-6 mb-8">
        <h2 className="text-sm uppercase tracking-wide font-semibold text-text-dim mb-4">Recent Activity</h2>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {recentActivity.slice(0, 5).map((activity: any) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-surface-2 flex items-center justify-center flex-shrink-0">
                <Icon name="calendar" size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-faint">{activity.comment || 'Activity update'}</p>
                <p className="text-xs text-text-dim">{activity.created_at || ''}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Workload Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface rounded-lg p-6">
          <h2 className="text-sm uppercase tracking-wide font-semibold text-text-dim mb-4">Team Members</h2>
          <ul className="space-y-2 text-sm">
            {users.slice(0, 5).map((user: any) => (
              <li key={user.id} className="flex items-center gap-2">
                <Icon name="users" size={12} className="text-text-faint" />
                <span className="text-text-dim">{user.name || user.email}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-surface rounded-lg p-6">
          <h2 className="text-sm uppercase tracking-wide font-semibold text-text-dim mb-4">Upcoming Deadlines</h2>
          <p className="text-sm text-text-faint">No upcoming deadlines configured</p>
        </div>
      </div>
    </section>
  );
}
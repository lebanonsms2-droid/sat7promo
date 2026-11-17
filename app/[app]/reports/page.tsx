import { useState, useEffect } from 'react';
import { getDashboardStats, getProjectsByChannel, getProjectsByProgram, getRecentActivity } from '@/lib/queries';
import { Icon } from '@/components/ui/Icon';

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [channelCounts, setChannelCounts] = useState<Record<string, number>>({});
  const [programCounts, setProgramCounts] = useState<Record<string, number>>({});
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [filterMonth, setFilterMonth] = useState<'this-month' | 'last-month' | 'this-quarter' | 'this-year'>('this-month');

  useEffect(() => {
    async function loadData() {
      const statsResult = await getDashboardStats();
      setStats(statsResult);
      setChannelCounts(await getProjectsByChannel());
      setProgramCounts(await getProjectsByProgram());
      setRecentActivity(await getRecentActivity(10));
    }
    loadData();
  }, []);

  const totalRequestsByMonth = () => {
    // Would calculate from database
    return 124;
  };

  const completedVsIncomplete = () => {
    if (!stats) return {};
    return {
      completed: stats.completed,
      incomplete: (stats.totalProjects || 0) - stats.completed,
    };
  };

  const avgCompletionTime = () => {
    // Would calculate from database
    return '14 days';
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-display font-bold mb-6">Reports & Analytics</h1>

      {/* KPI Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-dim">Total Requests</p>
            <p className="text-2xl font-display font-bold">{stats.totalProjects}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-text-dim">Completed</p>
            <p className="text-2xl font-display font-bold teal">{stats.completed}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-text-dim">Overdue</p>
            <p className="text-2xl font-display font-bold red">{stats.overdueProjects}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-text-dim">Month</p>
            <p className="text-2xl font-display font-bold amber">{totalRequestsByMonth()}</p>
          </div>
        </div>
      )}

      {/* Projects by Channel */}
      {stats && (
        <div className="bg-surface rounded-lg p-6 mb-6">
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
                  <div className="w-24 h-2 bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: (count / 200) * 100 + '%' }}
                    /></div>
                  </div>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Projects by Program */}
      {stats && (
        <div className="bg-surface rounded-lg p-6 mb-6">
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
      )}

      {/* Recent Activity */}
      <div className="bg-surface rounded-lg p-6">
        <h2 className="text-sm uppercase tracking-wide font-semibold text-text-dim mb-4">Recent Activity</h2>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {recentActivity.slice(0, 5).map((activity: any) => (
            <div key={activity.id} className="flex items-start gap-2">
              <div className="w-4 h-4 rounded bg-primary flex items-center justify-center flex-shrink-0">
                <Icon name="alert" size={12} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-faint">{activity.comment || 'Activity'}</p>
                <p className="text-xs text-text-dim">{activity.created_at || ''}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-surface rounded-lg p-6">
          <h2 className="text-sm uppercase tracking-wide font-semibold text-text-dim mb-4">Completion Trend</h2>
          <p className="text-sm text-text-faint">Would show monthly completion rates chart</p>
        </div>
        <div className="bg-surface rounded-lg p-6">
          <h2 className="text-sm uppercase tracking-wide font-semibold text-text-dim mb-4">Avg Completion Time</h2>
          <p className="text-sm text-text-faint">{avgCompletionTime()}</p>
        </div>
      </div>
    </div>
  );
}
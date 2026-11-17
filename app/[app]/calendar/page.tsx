import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';

export default function CalendarPage() {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [events, setEvents] = useState<any[]>([]);

  // Sample events - would come from database
  const sampleEvents = [
    { id: 1, title: 'Project PR-2026-00123 Due', date: '2024-01-15', type: 'deadline', priority: 'high' },
    { id: 2, title: 'Project PR-2026-00456 Review', date: '2024-01-20', type: 'review', priority: 'normal' },
    { id: 3, title: 'Project PR-2026-00789 First Version', date: '2024-01-25', type: 'milestone', priority: 'urgent' },
    { id: 4, title: 'Project PR-2026-00123 Final Approval', date: '2024-02-01', type: 'approval', priority: 'high' },
  ];

  useEffect(() => {
    setEvents(sampleEvents);
  }, []);

  const prevMonth = () => {
    // Would navigate to previous month
  };

  const nextMonth = () => {
    // Would navigate to next month
  };

  const prevWeek = () => {
    // Would navigate to previous week
  };

  const nextWeek = () => {
    // Would navigate to next week
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-display font-bold mb-6">Calendar</h1>

      {/* View Switcher */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <button
          onClick={() => setView('month')}
          className={`px-3 py-1 rounded ${
            view === 'month' ? 'bg-primary text-primary-foreground' : 'bg-surface'
          }`}
          >Month</button
        >
        <button
          onClick={() => setView('week')}
          className={`px-3 py-1 rounded ${
            view === 'week' ? 'bg-primary text-primary-foreground' : 'bg-surface'
          }`}
        >
          Week</button
        >
        <button
          onClick={() => setView('day')}
          className={`px-3 py-1 rounded ${
            view === 'day' ? 'bg-primary text-primary-foreground' : 'bg-surface'
          }`}
        >
          Day</button
        >
      </div>

      {/* Calendar Grid */}
      <div className="bg-surface rounded-lg p-6">
        {/* Month view */}
        {view === 'month' && (
          <div className="grid grid-cols-7">
            <div className="font-semibold text-text-dim text-sm">Sun</div>
            <div className="font-semibold text-text-dim text-sm">Mon</div>
            <div className="font-semibold text-text-dim text-sm">Tue</div>
            <div className="font-semibold text-text-dim text-sm">Wed</div>
            <div className="font-semibold text-text-dim text-sm">Thu</div>
            <div className="font-semibold text-text-dim text-sm">Fri</div>
            <div className="font-semibold text-text-dim text-sm">Sat</div>
          </div>
        )}

        {/* Week view */}
        {view === 'week' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="font-medium">This Week</span>
              <button className="text-xs text-text-faint">prev</button>
              <button className="text-xs text-text-faint">next</button>
            </div>
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-primary text-primary-foreground rounded py-1 px-2 text-xs"
              >
                {event.title}
              </div>
            ))}
          </div>
        )}

        {/* Day view */}
        {view === 'day' && (
          <div className="space-y-4">
            <p className="text-sm text-text-faint">No events for today</p>
          </div>
        )}
      </div>
    </div>
  );
}
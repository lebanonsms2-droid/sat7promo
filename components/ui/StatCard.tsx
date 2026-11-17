import * as React from 'react';

const ACCENT: Record<string, string> = {
  red: 'text-red',
  amber: 'text-amber',
  teal: 'text-teal',
  blue: 'text-blue',
};

export function StatCard({
  label, num, sub, accent,
}: { label: string; num: React.ReactNode; sub?: string; accent?: 'red' | 'amber' | 'teal' | 'blue' }) {
  return (
    <div className="bg-surface border border-rounded-lg shadow-card p-4">
      <div className="text-[11.5px] uppercase tracking-wide font-semibold text-text-dim">{label}</div>
      <div className={`font-display font-bold text-[28px] mt-1.5 ${accent ? ACCENT[accent] : ''}`}>{num}</div>
      {sub && <div className="text-[11.5px] text-text-faint mt-1">{sub}</div>}
    </div>
  );
}
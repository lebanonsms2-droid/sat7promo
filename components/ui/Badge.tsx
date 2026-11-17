import * as React from 'react';
import { statusClass, priorityClass } from '@/lib/utils';
import type { PromoStatus, Priority } from '@/lib/types';

export function StatusBadge({ status, overdue }: { status: PromoStatus; overdue?: boolean }) {
  if (overdue) return <span className="badge overdue">Overdue</span>;
  return <span className={`badge ${statusClass(status)}`}>{status}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`badge ${priorityClass(priority)}`}>{priority}</span>;
}

export function Chip({ children }: { children: React.ReactNode }) {
  return <span className="chip">{children}</span>;
}
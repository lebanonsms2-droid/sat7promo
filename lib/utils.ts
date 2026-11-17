/* ---- Fixed option lists (must match the DB CHECK constraints / enums) ---- */
import type { PromoStatus, PromoType, Priority, UserRole, Department } from './types';

export const STATUSES: PromoStatus[] = [
  'New', 'Pending', 'Assigned', 'In Progress', 'Review',
  'Changes Required', 'Approved', 'Completed', 'On Hold', 'Cancelled',
];

export const PIPELINE_STATUSES: PromoStatus[] = [
  'New', 'Pending', 'Assigned', 'In Progress', 'Review', 'Approved', 'Completed',
];

export const PROMO_TYPES: PromoType[] = [
  'TV Promo', 'TV Spot', 'Program Promo', 'Program Launch Promo', 'Social/Channel Content',
];

export const PRIORITIES: Priority[] = ['Normal', 'High', 'Urgent'];

export const ROLES: UserRole[] = [
  'Administrator', 'Promo Manager', 'Promo Producer', 'Editor', 'Designer', 'Viewer',
];

export const DEPTS: Department[] = [
  'Programming', 'Marketing', 'Production', 'Digital Media', 'Channel Management',
];

/* ---- Class maps for badges ---- */
export function statusClass(s: PromoStatus): string {
  return 'st-' + s.replace(/\s/g, '');
}

export function priorityClass(p: Priority): string {
  return 'pr-' + p;
}

export const STATUS_STYLE: Record<PromoStatus, { bg: string; fg: string }> = {
  New: { bg: 'var(--blue-soft)', fg: 'var(--blue)' },
  Pending: { bg: 'var(--amber-soft)', fg: '#C97C0F' },
  Assigned: { bg: 'var(--violet-soft)', fg: 'var(--violet)' },
  'In Progress': { bg: 'var(--amber-soft)', fg: '#C97C0F' },
  Review: { bg: 'var(--blue-soft)', fg: 'var(--blue)' },
  'Changes Required': { bg: 'var(--red-soft)', fg: 'var(--red)' },
  Approved: { bg: 'var(--teal-soft)', fg: 'var(--teal)' },
  Completed: { bg: 'var(--teal-soft)', fg: 'var(--teal)' },
  'On Hold': { bg: 'var(--violet-soft)', fg: 'var(--violet)' },
  Cancelled: { bg: 'var(--gray-soft)', fg: 'var(--text-faint)' },
};

export const PRIORITY_STYLE: Record<Priority, { bg: string; fg: string }> = {
  Normal: { bg: 'var(--blue-soft)', fg: 'var(--blue)' },
  High: { bg: 'var(--amber-soft)', fg: '#C97C0F' },
  Urgent: { bg: 'var(--red-soft)', fg: 'var(--red)' },
};

/* ---- CN (className) helper ---- */
export function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

/* ---- Clamp CSS for responsive typography ---- */
export function clampText(min: string, max: string, size: string) {
  return `clamp(${min}, ${size}, ${max}`;
}
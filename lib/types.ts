// Shared domain types for SAT-7 Promo Desk

export type PromoStatus =
  | 'New'
  | 'Pending'
  | 'Assigned'
  | 'In Progress'
  | 'Review'
  | 'Changes Required'
  | 'Approved'
  | 'Completed'
  | 'On Hold'
  | 'Cancelled';

export type PromoType =
  | 'TV Promo'
  | 'TV Spot'
  | 'Program Promo'
  | 'Program Launch Promo'
  | 'Social/Channel Content';

export type Priority = 'Normal' | 'High' | 'Urgent';

export type UserRole =
  | 'Administrator'
  | 'Promo Manager'
  | 'Promo Producer'
  | 'Editor'
  | 'Designer'
  | 'Viewer';

export type Department =
  | 'Programming'
  | 'Marketing'
  | 'Production'
  | 'Digital Media'
  | 'Channel Management';

export interface Profile {
  id: string;
  name: string;
  email: string;
  dept: Department | null;
  role: UserRole;
  phone: string | null;
  color: string | null;
  active: boolean;
  created_at: string;
}

export interface Channel {
  id: string;
  name: string;
  code: string;
  language: string;
  region: string;
  active: boolean;
  created_at: string;
}

export interface Program {
  id: string;
  name: string;
  code: string;
  desc: string | null;
  season: string | null;
  episodes: string | null;
  language: string;
  presenter: string | null;
  prod_company: string | null;
  contact: string | null;
  start_date: string | null;
  end_date: string | null;
  active?: boolean;
  created_at: string;
}

export interface ProductionFlags {
  scriptReceived: boolean;
  scriptApproved: boolean;
  footageReceived: boolean;
  graphicsRequired: boolean;
  voiceOverRequired: boolean;
  musicRequired: boolean;
  editingStarted: boolean;
  firstVersion: boolean;
  review: boolean;
  clientFeedback: boolean;
  finalVersion: boolean;
  finalApproval: boolean;
}

export interface Project {
  id: string;
  project_code: string;
  program_id: string;
  channel_ids: string[];
  promo_type: PromoType;
  priority: Priority;
  status: PromoStatus;
  assigned_user_ids: string[];
  requested_by: string;
  requesting_dept: Department;
  requester_email: string;
  requester_phone: string;
  request_date: string;
  due_date: string;
  notes: string;
  production: ProductionFlags;
  created_at: string;
  updated_at: string;
}

export interface ProjectRow extends Project {
  program: { id: string; name: string; code: string } | null;
  channels: { id: string; code: string; name: string }[];
}

export interface ProjectHistory {
  id: string;
  project_id: string;
  changed_by: string;
  from_status: PromoStatus | null;
  to_status: PromoStatus | null;
  comment: string | null;
  created_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  name: string;
  kind: string;
  url: string;
  size_bytes: number | null;
  uploaded_by: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string | null;
  type: 'request' | 'assignment' | 'status' | 'approval' | 'deadline' | 'comment' | 'system';
  text: string;
  time: string;
  read: boolean;
  created_at: string;
  project_id: string | null;
}

export interface Settings {
  id: string;
  org_name: string;
  whatsapp_enabled: boolean;
  email_enabled: boolean;
  created_at: string;
  updated_at: string;
}

/* ---- Fixed option lists (must match the DB CHECK constraints / enums) ---- */
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
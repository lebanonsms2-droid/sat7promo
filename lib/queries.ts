import { createClient } from './supabase/server';
import type {
  PromoStatus, PromoType, Priority, UserRole, Department,
  Profile, Channel, Program, Project, ProjectRow, ProjectHistory, ProjectFile,
} from './types';

/* ---------- Reference data ---------- */
export async function getChannels(): Promise<Channel[]> {
  const sb = createClient();
  const { data } = await sb.from('channels').select('*').order('sort_order', { ascending: true });
  return (data as Channel[]) ?? [];
}

export async function getPrograms(): Promise<Program[]> {
  const sb = createClient();
  const { data } = await sb.from('programs').select('*').order('sort_order', { ascending: true });
  return (data as Program[]) ?? [];
}

export async function getUsers(): Promise<Profile[]> {
  const sb = createClient();
  const { data } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
  return (data as Profile[]) ?? [];
}

export async function getSettings(): Promise<Settings | null> {
  const sb = createClient();
  const { data } = await sb.from('settings').select('*').eq('id', 1).single();
  return (data as Settings) ?? null;
}

/* ---------- Projects ---------- */
export interface ProjectFilters {
  search?: string;
  status?: string;
  channelId?: string;
  userId?: string;
  priority?: string;
}

export async function getProjects(filters: ProjectFilters = {}): Promise<ProjectRow[]> {
  const sb = createClient();
  const { data } = await sb.from('projects')
    .select(`
      *,
      programs (
        id, name, code
      )
    `)
    .order('request_date', { ascending: false });

  let rows = ((data as any)?.projects || []) as Project[];

  // Filter by status
  if (filters.status) {
    rows = rows.filter((r: any) => r.status === filters.status);
  }

  // Filter by priority
  if (filters.priority) {
    rows = rows.filter((r: any) => r.priority === filters.priority);
  }

  // Filter by channel
  if (filters.channelId) {
    rows = rows.filter((r: any) => r.channel_ids.includes(filters.channelId));
  }

  // Filter by user assignment
  if (filters.userId) {
    rows = rows.filter((r: any) => r.assigned_user_ids.includes(filters.userId));
  }

  // Filter by search
  if (filters.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter((r: any) =>
      r.project_code.toLowerCase().includes(q) ||
      r.title?.toLowerCase().includes(q) ||
      r.requester_email.toLowerCase().includes(q)
    );
  }

  // Enrich with program and channels
  const programsMap = new Map((await getPrograms()).map((p: any) => [p.id, p]));
  const channelsMap = new Map((await getChannels()).map((c: any) => [c.id, c]));

  return rows.map((p: any) => ({
    ...p,
    program: programsMap.get(p.program_id) ?? null,
    channels: p.channel_ids.map(((cId: string) => channelsMap.get(cId) ?? { id: cId, name: '', code: '', language: '', region: '', active: false })),
  })) as ProjectRow[];
}

/* ---------- Dashboard Statistics ---------- */
export interface DashboardStats {
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
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const sb = createClient();
  const { data } = await sb.from('projects').select('*', { count: 'exact', head: true });
  const total = (data?.count ?? 0);

  // Count by status
  const { count: newReq } = await sb.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'New');
  const countPending = await sb.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
  const countAssigned = await sb.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'Assigned');
  const countInProgress = await sb.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'In Progress');
  const countReview = await sb.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'Review');
  const countApproved = await sb.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'Approved');
  const countCompleted = await sb.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'Completed');

  // Overdue projects (due date passed and not completed)
  const today = new Date().toISOString().split('T')[0];
  const { count: overdue } = await sb.from('projects').select('*', { count: 'exact', head: true }).lte('due_date', today).neq('status', 'Completed');

  // Due this week
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  const weekFromNowStr = weekFromNow.toISOString().split('T')[0];
  const { count: dueThisWeek } = await sb.from('projects').select('*', { count: 'exact', head: true }).gte('due_date', today).lte('due_date', weekFromNowStr).neq('status', 'Completed');

  return {
    totalProjects: total,
    newRequests: newReq ?? 0,
    pendingProjects: countPending ?? 0,
    assignedProjects: countAssigned ?? 0,
    inProgress: countInProgress ?? 0,
    awaitingReview: countReview ?? 0,
    approved: countApproved ?? 0,
    completed: countCompleted ?? 0,
    overdueProjects: overdue ?? 0,
    dueThisWeek: dueThisWeek ?? 0,
  };
}

/* ---------- Project Detail ---------- */
export async function getProjectDetail(id: string): Promise<{ project: ProjectRow | null; history: ProjectHistory[] }> {
  const sb = createClient();

  // Get project with program
  const { data: projectData, error } = await sb.from('projects')
    .select(`
      *,
      programs (
        id, name, code, desc, season, episodes, language, presenter, prod_company, contact, start_date, end_date
      )
    `)
    .eq('id', id)
    .single();

  if (error || !projectData) return { project: null, history: [] };

  const programsMap = new Map((await getPrograms()).map((p: any) => [p.id, p]));
  const channelsMap = new Map((await getChannels()).map((c: any) => [c.id, c]));

  const project: ProjectRow = {
    ...projectData,
    program: programsMap.get(projectData.program_id) ?? null,
    channels: projectData.channel_ids.map(((cId: string) => channelsMap.get(cId) ?? { id: cId, name: '', code: '', language: '', region: '', active: false })),
  };

  // Get project history
  const { data: history, error: histError } = await sb.from('project_history')
    .select('*, profiles!project_history_changed_by_fkey (name, email)')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  const hist = (history as ProjectHistory[]) ?? [];

  return { project, history: hist };
}

/* ---------- Recent activity ---------- */
export async function getRecentActivity(limit: number = 10) {
  const sb = createClient();
  const { data, error } = await sb.from('project_history')
    .select('*, projects(project_code, status), profiles!project_history_changed_by_fkey (name, email)')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data as any[]) ?? [];
}

/* ---------- Notifications ---------- */
export async function getNotifications(userId?: string, unreadOnly: boolean = false) {
  const sb = createClient();
  let query = sb.from('notifications').select('*, projects!notifications_project_id_fkey (project_code, status)');

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (unreadOnly) {
    query = query.is('read', null);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  return (data as any[]) ?? [];
}

/* ---------- Channel-based project counts ---------- */
export async function getProjectsByChannel() {
  const sb = createClient();
  const { data } = await sb.from('projects').select('channel_ids, status');
  const rows = (data as any[]) ?? [];

  const channels = await getChannels();
  const channelMap = new Map(channels.map((c: any) => [c.id, c.code]));

  // Initialize counts
  const counts: Record<string, number> = {};
  channels.forEach((c: any) => { counts[c.code] = 0; });

  // Count projects per channel
  rows.forEach((row: any) => {
    row.channel_ids.forEach(((cId: string) => {
      const code = channelMap.get(cId);
      if (code) {
        counts[code] = (counts[code] || 0) + 1;
      }
    }));
  });

  return counts;
}

/* ---------- Program-based project counts ---------- */
export async function getProjectsByProgram() {
  const sb = createClient();
  const { data } = await sb.from('projects').select('program_id, status');
  const rows = (data as any[]) ?? [];

  const programs = await getPrograms();
  const programMap = new Map(programs.map((p: any) => [p.id, p.code]));

  const counts: Record<string, number> = {};
  programs.forEach((p: any) => { counts[p.code] = 0; });

  rows.forEach((row: any) => {
    const progCode = programMap.get(row.program_id);
    if (progCode) {
      counts[progCode] = (counts[progCode] || 0) + 1;
    }
  });

  return counts;
}
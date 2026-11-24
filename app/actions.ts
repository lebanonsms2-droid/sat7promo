'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { PromoStatus, PromoType, Priority, Department, UserRole } from '@/lib/types';

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

async function requireUser() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error('You must be signed in to do that.');
  return { sb, user };
}

/**
 * Same as requireUser, but additionally enforces the Administrator role.
 * User management touches auth accounts, so it is admin-only by design.
 */
async function requireAdmin() {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) throw new Error('You must be signed in to do that.');

  const { data: profile } = await sb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'Administrator') {
    throw new Error('Only administrators can perform this action.');
  }
  return { sb, user };
}

async function nextProjectCode(sb: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await sb.from('projects').select('*', { count: 'exact', head: true });
  const base = (count ?? 0) + 1;

  for (let i = 0; i < 10; i++) {
    const code = `PR-${year}-${String(base + i).padStart(5, '0')}`;
    const { data } = await sb.from('projects').select('id').eq('project_code', code).maybeSingle();
    if (!data) return code;
  }
  return `PR-${year}-${Date.now().toString(36).toUpperCase()}`;
}

/* ------------------------------------------------------------------ */
/* Projects                                                           */
/* ------------------------------------------------------------------ */

export interface NewProjectInput {
  program_id: string;
  channel_ids: string[];
  promo_type: PromoType;
  priority: Priority;
  assigned_user_ids: string[];
  requested_by: string;
  requesting_dept: Department;
  requester_email: string;
  requester_phone: string;
  request_date: string;
  due_date: string;
  notes: string;
}

export async function createProjectAction(input: NewProjectInput): Promise<{ id: string; project_code: string }> {
  const { sb, user } = await requireUser();

  const project_code = await nextProjectCode(sb);
  const status: PromoStatus = input.assigned_user_ids.length ? 'Assigned' : 'New';

  const { data: project, error } = await sb
    .from('projects')
    .insert({
      project_code,
      program_id: input.program_id,
      channel_ids: input.channel_ids,
      promo_type: input.promo_type,
      priority: input.priority,
      status,
      assigned_user_ids: input.assigned_user_ids,
      requested_by: input.requested_by,
      requesting_dept: input.requesting_dept,
      requester_email: input.requester_email,
      requester_phone: input.requester_phone,
      request_date: input.request_date,
      due_date: input.due_date,
      notes: input.notes,
      production: {
        scriptReceived: false,
        scriptApproved: false,
        footageReceived: false,
        graphicsRequired: false,
        voiceOverRequired: false,
        musicRequired: false,
        editingStarted: false,
        firstVersion: false,
        review: false,
        clientFeedback: false,
        finalVersion: false,
        finalApproval: false,
      },
      created_by: user.id,
    })
    .select('id, project_code')
    .single();

  if (error || !project) {
    throw new Error(error?.message || 'Could not create the project.');
  }

  // Audit trail
  await sb.from('project_history').insert({
    project_id: project.id,
    changed_by: user.id,
    from_status: null,
    to_status: status,
    comment: `Request created by ${input.requested_by || user.email || 'a team member'}.`,
  });

  // Notify assignees
  if (input.assigned_user_ids.length) {
    await sb.from('notifications').insert(
      input.assigned_user_ids.map((uid) => ({
        user_id: uid,
        project_id: project.id,
        kind: 'assignment',
        title: `New ${input.promo_type} assigned: ${project_code}`,
        body: input.notes || null,
      })),
    );
  }

  revalidatePath('/projects');
  revalidatePath('/dashboard');
  return { id: project.id, project_code };
}

/** Admin-only edit of the editable fields of an existing project. */
export async function updateProjectAction(
  projectId: string,
  values: {
    program_id: string;
    channel_ids: string[];
    promo_type: PromoType;
    priority: Priority;
    assigned_user_ids: string[];
    requested_by: string;
    requesting_dept: Department;
    requester_email: string;
    requester_phone: string;
    request_date: string;
    due_date: string;
    notes: string;
  },
): Promise<void> {
  const { sb, user } = await requireAdmin();

  const { data: before } = await sb
    .from('projects')
    .select('status')
    .eq('id', projectId)
    .single();

  const { error } = await sb.from('projects').update({
    program_id: values.program_id,
    channel_ids: values.channel_ids,
    promo_type: values.promo_type,
    priority: values.priority,
    assigned_user_ids: values.assigned_user_ids,
    requested_by: values.requested_by,
    requesting_dept: values.requesting_dept,
    requester_email: values.requester_email,
    requester_phone: values.requester_phone,
    request_date: values.request_date,
    due_date: values.due_date,
    notes: values.notes,
    updated_at: new Date().toISOString(),
  }).eq('id', projectId);
  if (error) throw new Error(error.message);

  // Keep the audit trail: record that an administrator edited the request.
  await sb.from('project_history').insert({
    project_id: projectId,
    changed_by: user.id,
    from_status: before?.status ?? null,
    to_status: before?.status ?? null,
    comment: `Project details updated by ${user.email || 'an administrator'}.`,
  });

  revalidatePath('/projects');
  revalidatePath('/dashboard');
  revalidatePath('/reports');
}

/** Admin-only hard delete of a project and all of its dependent records. */
export async function deleteProjectAction(projectId: string): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();

  // These tables reference projects; remove them explicitly before the parent
  // (the FK cascade is not relied on so the delete is deterministic).
  for (const table of ['notifications', 'project_files', 'project_history']) {
    const { error } = await admin.from(table).delete().eq('project_id', projectId);
    if (error) throw new Error(error.message);
  }
  const { error } = await admin.from('projects').delete().eq('id', projectId);
  if (error) throw new Error(error.message);

  revalidatePath('/projects');
  revalidatePath('/dashboard');
  revalidatePath('/reports');
  revalidatePath('/calendar');
}

export async function updateProjectStatusAction(
  projectId: string,
  newStatus: PromoStatus,
  comment?: string,
): Promise<void> {
  const { sb, user } = await requireUser();

  const { data: before } = await sb
    .from('projects')
    .select('status, project_code')
    .eq('id', projectId)
    .single();

  const { error } = await sb
    .from('projects')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', projectId);

  if (error) throw new Error(error.message);

  await sb.from('project_history').insert({
    project_id: projectId,
    changed_by: user.id,
    from_status: before?.status ?? null,
    to_status: newStatus,
    comment: comment || (before?.status ? `Moved from ${before.status} to ${newStatus}` : `Set to ${newStatus}`),
  });

  revalidatePath('/production');
  revalidatePath('/projects');
  revalidatePath('/dashboard');
}

/* ------------------------------------------------------------------ */
/* Reference data                                                     */
/* ------------------------------------------------------------------ */

/* ---------- Channels ---------- */

function friendlyDbError(error: { message: string; code?: string }): Error {
  if (error.code === '23505') {
    return new Error('A record with that code already exists. Use a unique code.');
  }
  if (error.code === '23503') {
    return new Error('This record is still used by projects and cannot be deleted.');
  }
  return new Error(error.message);
}

export async function createChannelAction(values: {
  name: string;
  code: string;
  language: string;
  region: string;
}): Promise<void> {
  const { sb } = await requireUser();
  const { error } = await sb.from('channels').insert({
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
    language: values.language,
    region: values.region.trim(),
    active: true,
  });
  if (error) throw friendlyDbError(error);
  revalidatePath('/channels');
}

export async function updateChannelAction(
  id: string,
  values: { name: string; code: string; language: string; region: string; active: boolean },
): Promise<void> {
  const { sb } = await requireUser();
  const { error } = await sb.from('channels').update({
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
    language: values.language,
    region: values.region.trim(),
    active: values.active,
  }).eq('id', id);
  if (error) throw friendlyDbError(error);
  revalidatePath('/channels');
}

/** Count projects that reference a channel (channel_ids is an array column). */
export async function getChannelUsageAction(id: string): Promise<number> {
  const { sb } = await requireUser();
  const { data } = await sb.from('projects').select('id, channel_ids');
  return ((data as any[]) ?? []).filter((p) => (p.channel_ids ?? []).includes(id)).length;
}

/**
 * Hard-delete a channel. Because channel_ids is a plain UUID[] with no FK,
 * we strip the deleted id from every project before removing the row.
 */
export async function deleteChannelAction(id: string): Promise<void> {
  await requireUser();
  const admin = createAdminClient();
  const { data: projects } = await admin.from('projects').select('id, channel_ids');
  const affected = ((projects as any[]) ?? []).filter((p) => (p.channel_ids ?? []).includes(id));
  for (const p of affected) {
    const next = (p.channel_ids as string[]).filter((c) => c !== id);
    const { error } = await admin.from('projects')
      .update({ channel_ids: next, updated_at: new Date().toISOString() })
      .eq('id', p.id);
    if (error) throw friendlyDbError(error);
  }
  const { error } = await admin.from('channels').delete().eq('id', id);
  if (error) throw friendlyDbError(error);
  revalidatePath('/channels');
  revalidatePath('/projects');
}

/* ---------- Programs ---------- */

export async function createProgramAction(values: {
  name: string;
  code: string;
  description?: string;
  season?: string;
  episodes?: string;
  language: string;
  presenter?: string;
  prod_company?: string;
  contact?: string;
  start_date?: string;
  end_date?: string;
}): Promise<void> {
  const { sb } = await requireUser();
  const { error } = await sb.from('programs').insert({
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
    description: values.description || null,
    season: values.season || null,
    episodes: values.episodes || null,
    language: values.language,
    presenter: values.presenter || null,
    prod_company: values.prod_company || null,
    contact: values.contact || null,
    start_date: values.start_date || null,
    end_date: values.end_date || null,
    active: true,
  });
  if (error) throw friendlyDbError(error);
  revalidatePath('/programs');
}

export async function updateProgramAction(
  id: string,
  values: {
    name: string; code: string; description?: string; season?: string; episodes?: string;
    language: string; presenter?: string; prod_company?: string; contact?: string;
    start_date?: string; end_date?: string; active: boolean;
  },
): Promise<void> {
  const { sb } = await requireUser();
  const { error } = await sb.from('programs').update({
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
    description: values.description || null,
    season: values.season || null,
    episodes: values.episodes || null,
    language: values.language,
    presenter: values.presenter || null,
    prod_company: values.prod_company || null,
    contact: values.contact || null,
    start_date: values.start_date || null,
    end_date: values.end_date || null,
    active: values.active,
  }).eq('id', id);
  if (error) throw friendlyDbError(error);
  revalidatePath('/programs');
}

/** Count projects whose program_id points at this program. */
export async function getProgramUsageAction(id: string): Promise<number> {
  const { sb } = await requireUser();
  const { count } = await sb.from('projects').select('*', { count: 'exact', head: true }).eq('program_id', id);
  return count ?? 0;
}

/**
 * Hard-delete a program. projects.program_id has a FK with no cascade, so
 * referenced projects must first be reassigned to another program.
 */
export async function deleteProgramAction(id: string, reassignToId?: string): Promise<void> {
  await requireUser();
  const admin = createAdminClient();
  const { count } = await admin.from('projects').select('*', { count: 'exact', head: true }).eq('program_id', id);

  if ((count ?? 0) > 0) {
    if (!reassignToId) {
      throw new Error(`This program is used by ${count} project(s). Choose another program to reassign them to before deleting.`);
    }
    if (reassignToId === id) throw new Error('Choose a different program for reassignment.');
    const { error: reError } = await admin.from('projects')
      .update({ program_id: reassignToId, updated_at: new Date().toISOString() })
      .eq('program_id', id);
    if (reError) throw friendlyDbError(reError);
  }

  const { error } = await admin.from('programs').delete().eq('id', id);
  if (error) throw friendlyDbError(error);
  revalidatePath('/programs');
  revalidatePath('/projects');
}

/* ------------------------------------------------------------------ */
/* Users (Administrator-only)                                         */
/* ------------------------------------------------------------------ */

/** Random readable temporary password (Supabase requires 8+ chars). */
function tempPassword(): string {
  const words = ['Sat7', 'Promo', 'Desk', 'Tv', 'Studio', 'Cairo', 'Beirut', 'Air'];
  const word = words[Math.floor(Math.random() * words.length)];
  const digits = Math.floor(1000 + Math.random() * 9000);
  const symbol = '!@#$%&*'[Math.floor(Math.random() * 7)];
  return `${word}${digits}${symbol}`;
}

/**
 * Creates the auth account through the admin API — a DB trigger creates the
 * matching profiles row automatically (inserting one directly 409s).
 * Returns the generated temporary password (no email provider is wired).
 */
export async function createUserAction(values: {
  name: string;
  email: string;
  role: UserRole;
  dept: Department;
  phone?: string;
}): Promise<{ email: string; password: string }> {
  await requireAdmin();
  const admin = createAdminClient();
  const email = values.email.trim().toLowerCase();
  const password = tempPassword();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: values.name.trim() },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('User creation failed.');

  // The trigger seeds defaults — apply the chosen role/dept/contact details.
  const { error: profileError } = await admin
    .from('profiles')
    .update({
      full_name: values.name.trim(),
      role: values.role,
      dept: values.dept,
      phone: values.phone?.trim() || null,
      active: true,
    })
    .eq('id', data.user.id);
  if (profileError) throw new Error(profileError.message);

  revalidatePath('/users');
  return { email, password };
}

export async function updateUserAction(
  id: string,
  values: {
    name: string;
    role: UserRole;
    dept: Department;
    phone?: string;
    active: boolean;
  },
): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({
      full_name: values.name.trim(),
      role: values.role,
      dept: values.dept,
      phone: values.phone?.trim() || null,
      active: values.active,
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/users');
}

export async function deleteUserAction(id: string): Promise<void> {
  const { user: caller } = await requireAdmin();
  if (caller.id === id) {
    throw new Error('You cannot delete your own account.');
  }

  const admin = createAdminClient();

  // Keep at least one Administrator on the team.
  const { count } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'Administrator')
    .eq('active', true);
  const { data: target } = await admin
    .from('profiles')
    .select('role')
    .eq('id', id)
    .maybeSingle();
  if (target?.role === 'Administrator' && (count ?? 0) <= 1) {
    throw new Error('This is the last administrator — promote someone else first.');
  }

  // notifications.user_id blocks deletion (no FK cascade) — remove them first.
  const { error: notifError } = await admin.from('notifications').delete().eq('user_id', id);
  if (notifError) throw new Error(notifError.message);

  const { error: profileError } = await admin.from('profiles').delete().eq('id', id);
  if (profileError) throw new Error(profileError.message);

  const { error: authError } = await admin.auth.admin.deleteUser(id);
  if (authError) throw new Error(authError.message);

  revalidatePath('/users');
}

/** Sets a password chosen by the administrator on the auth account. */
export async function resetPasswordAction(id: string, password: string): Promise<void> {
  await requireAdmin();
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, { password });
  if (error) throw new Error(error.message);

  revalidatePath('/users');
}

/**
 * Notification feed. Most seeded notifications are global (user_id = null), so
 * the service-role client is used to surface them despite row-level security.
 */
export async function getNotificationsAction(): Promise<Array<{
  id: string; title: string; body: string | null; type: string;
  read: boolean; time: string; projectCode: string | null;
}>> {
  await requireUser();
  const admin = createAdminClient();
  const { data } = await admin
    .from('notifications')
    .select('id, title, body, kind, read_at, created_at, projects!notifications_project_id_fkey (project_code)')
    .order('created_at', { ascending: false })
    .limit(30);
  return ((data as any[]) ?? []).map((n) => ({
    id: n.id,
    title: n.title ?? n.body ?? '',
    body: n.body ?? null,
    type: n.kind ?? 'system',
    read: !!n.read_at,
    time: n.created_at,
    projectCode: n.projects?.[0]?.project_code ?? null,
  }));
}

/** Mark all notifications in the feed as read. */
export async function markNotificationsReadAction(): Promise<void> {
  await requireUser();
  const admin = createAdminClient();
  const { error } = await admin
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard');
}

/* ------------------------------------------------------------------ */
/* Settings                                                           */
/* ------------------------------------------------------------------ */

export async function saveSettingsAction(values: {
  org_name: string;
  email_enabled: boolean;
  whatsapp_enabled: boolean;
}): Promise<void> {
  const { sb } = await requireUser();
  const { error } = await sb
    .from('org_settings')
    .update({
      org_name: values.org_name,
      email_enabled: values.email_enabled,
      whatsapp_enabled: values.whatsapp_enabled,
    })
    .eq('id', 1);
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

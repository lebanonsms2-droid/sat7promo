'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { PromoStatus, PromoType, Priority, Department } from '@/lib/types';

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

export async function createChannelAction(values: {
  name: string;
  code: string;
  language: string;
  region: string;
  description?: string;
}): Promise<void> {
  const { sb } = await requireUser();
  const { error } = await sb.from('channels').insert({
    name: values.name,
    code: values.code,
    language: values.language,
    region: values.region,
    active: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/channels');
}

/** Safe archival — channels are deactivated, never hard-deleted. */
export async function deactivateChannelAction(id: string): Promise<void> {
  const { sb } = await requireUser();
  const { error } = await sb.from('channels').update({ active: false }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/channels');
}

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
    name: values.name,
    code: values.code,
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
  if (error) throw new Error(error.message);
  revalidatePath('/programs');
}

export async function deactivateProgramAction(id: string): Promise<void> {
  const { sb } = await requireUser();
  const { error } = await sb.from('programs').update({ active: false }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/programs');
}

export async function createUserAction(values: {
  name: string;
  email: string;
  role: string;
  dept: string;
  phone?: string;
}): Promise<void> {
  const { sb } = await requireUser();
  const { error } = await sb.from('profiles').insert({
    full_name: values.name,
    email: values.email,
    role: values.role,
    dept: values.dept,
    phone: values.phone || null,
    active: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/users');
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

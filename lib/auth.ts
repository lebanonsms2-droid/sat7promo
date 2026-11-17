import { createClient } from './supabase/server';
import type { Profile } from './types';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  profile: Profile | null;
}

/** Returns the current signed-in user with profile/role, or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const sb = createClient();
  const { data: { user} } = await sb.auth.getUser();
  if (!user) return null;

  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
  const p = (profile as Profile) ?? null;

  return {
    id: user.id,
    email: user.email ?? '',
    name: p?.name ?? user.email ?? 'User',
    role: p?.role ?? 'Viewer',
    profile: p,
  };
}

/** Checks if the current user has Administrator role. */
export async function isAdmin(): Promise<boolean> {
  const u = await getCurrentUser();
  return !!u && u.role === 'Administrator';
}

/** Checks if the current user can manage projects. */
export async function canManageProjects(): Promise<boolean> {
  const u = await getCurrentUser();
  return !!u && (u.role === 'Administrator' || u.role === 'Promo Manager');
}

/** Checks if the current user can review/approve. */
export async function canReviewApprove(): Promise<boolean> {
  const u = await getCurrentUser();
  return !!u && (u.role === 'Administrator' || u.role === 'Promo Manager' || u.role === 'Promo Producer');
}
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role client. Use ONLY in trusted server contexts (seed scripts, admin
 * migrations). Never import this into client components or expose the key.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
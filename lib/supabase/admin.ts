import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client — bypasses RLS.
 * Only use server-side in trusted API routes (e.g. cron jobs).
 * Requires SUPABASE_SERVICE_ROLE_KEY in env.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

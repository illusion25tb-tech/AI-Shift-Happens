import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Verify request is from an admin user.
 * Returns user + db client, or null if unauthorized.
 */
export async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error } = await anonClient.auth.getUser()
  if (error || !user) return null

  const db = createClient(supabaseUrl, serviceKey)
  const { data: profile } = await db
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return null
  return { user, db }
}

/**
 * Verify request is from an internal cron job or admin.
 * Checks for a secret header matching SUPABASE_SERVICE_ROLE_KEY.
 */
export function verifyCronOrServiceRole(req: Request): boolean {
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const authHeader = req.headers.get('Authorization')

  // Accept service role key as Bearer token (used by pg_cron via net.http_post)
  if (authHeader === `Bearer ${serviceKey}`) return true

  // Accept service role key in custom header
  const cronSecret = req.headers.get('x-cron-secret')
  if (cronSecret === serviceKey) return true

  return false
}

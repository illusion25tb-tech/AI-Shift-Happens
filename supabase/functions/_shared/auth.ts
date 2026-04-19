import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Hard-coded admin emails — these always have admin access
const ADMIN_EMAILS = [
  'illusion25.tb@gmail.com',
  'illumination25@gmx.de',
]

/**
 * Verify request is from an admin user.
 * Checks: 1) hard-coded admin emails, 2) is_admin flag in profile.
 * Auto-promotes hard-coded admins if not yet flagged.
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

  // Hard-coded admin emails — always allowed, auto-promote
  const isHardcodedAdmin = ADMIN_EMAILS.includes(user.email ?? '')
  if (isHardcodedAdmin) {
    await db.from('profiles').update({ is_admin: true }).eq('id', user.id)
    return { user, db }
  }

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
 * Uses CRON_SECRET env variable checked against Authorization header.
 * pg_cron calls use this secret in the Authorization header.
 */
export async function verifyCronOrServiceRole(req: Request): Promise<boolean> {
  const cronSecret = Deno.env.get('CRON_SECRET')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authHeader = req.headers.get('Authorization')

  // Check CRON_SECRET in Bearer token
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true

  // Check service role key in Bearer token
  if (authHeader === `Bearer ${serviceKey}`) return true

  // Fallback: check if the Supabase JWT payload has service_role
  // (Supabase Gateway rewrites apikey to Authorization for edge functions)
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7)
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.role === 'service_role') return true
    } catch { /* not a valid JWT */ }
  }

  return false
}

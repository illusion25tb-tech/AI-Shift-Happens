import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const authHeader = req.headers.get('Authorization')

  // Only allow service role
  if (authHeader !== `Bearer ${serviceKey}`) {
    try {
      const token = authHeader?.slice(7) ?? ''
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.role !== 'service_role') {
        return new Response('Unauthorized', { status: 403 })
      }
    } catch {
      return new Response('Unauthorized', { status: 403 })
    }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!

  try {
    // Use Deno's postgres driver for raw SQL DDL
    const { default: postgres } = await import('https://deno.land/x/postgresjs@v3.4.4/mod.js')

    // Supabase edge functions have access to the internal DB URL
    const dbUrl = Deno.env.get('SUPABASE_DB_URL') ??
      `postgresql://postgres:${Deno.env.get('POSTGRES_PASSWORD') ?? 'postgres'}@db.amhfxaqolholacanqyas.supabase.co:5432/postgres`

    const sql = postgres(dbUrl, { ssl: 'prefer' })

    await sql`ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_locale_check`
    await sql`ALTER TABLE questions ADD CONSTRAINT questions_locale_check CHECK (locale IN ('de', 'en', 'tr'))`
    await sql`ALTER TABLE daily_quizzes DROP CONSTRAINT IF EXISTS daily_quizzes_locale_check`
    await sql`ALTER TABLE daily_quizzes ADD CONSTRAINT daily_quizzes_locale_check CHECK (locale IN ('de', 'en', 'tr'))`

    await sql.end()

    return new Response(JSON.stringify({ ok: true, message: 'Locale constraint updated to include tr' }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

async function verifyAdmin(req: Request) {
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

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const admin = await verifyAdmin(req)
  if (!admin) {
    return jsonResponse({ error: 'Unauthorized — admin access required' }, 403)
  }
  const { db } = admin

  try {
    const body = await req.json()
    const { action } = body as { action: string }

    // ─── QUESTIONS ───

    if (action === 'list_questions') {
      const { category, locale, search, offset, limit } = body as {
        category?: string; locale?: string; search?: string; offset?: number; limit?: number
      }
      let query = db.from('questions').select('*', { count: 'exact' })

      if (category) query = query.eq('category', category)
      if (locale) query = query.eq('locale', locale)
      if (search) query = query.ilike('scenario_text', `%${search}%`)

      query = query.order('created_at', { ascending: false })
        .range(offset ?? 0, (offset ?? 0) + (limit ?? 20) - 1)

      const { data, count, error } = await query
      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse({ questions: data, total: count })
    }

    if (action === 'toggle_question') {
      const { question_id, is_active } = body as { question_id: string; is_active: boolean }
      const { error } = await db
        .from('questions')
        .update({ is_active })
        .eq('id', question_id)
      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse({ ok: true })
    }

    if (action === 'create_question') {
      const { locale: qLocale, category, scenario_text, mindset_tip, options, difficulty } = body as {
        locale: string; category: string; scenario_text: string; mindset_tip: string
        options: Array<{ text: string; score: number; feedbackText: string }>; difficulty: number
      }
      const { data, error } = await db
        .from('questions')
        .insert({
          locale: qLocale,
          category,
          scenario_text,
          mindset_tip,
          options,
          difficulty,
          generated_by: 'admin',
        })
        .select('id')
        .single()
      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse({ id: data.id })
    }

    if (action === 'update_question') {
      const { question_id, updates } = body as { question_id: string; updates: Record<string, unknown> }
      const { error } = await db
        .from('questions')
        .update(updates)
        .eq('id', question_id)
      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse({ ok: true })
    }

    if (action === 'delete_question') {
      const { question_id } = body as { question_id: string }
      const { error } = await db
        .from('questions')
        .delete()
        .eq('id', question_id)
      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse({ ok: true })
    }

    // ─── USERS ───

    if (action === 'list_users') {
      const { offset, limit, search } = body as { offset?: number; limit?: number; search?: string }
      let query = db.from('profiles').select('*', { count: 'exact' })
      if (search) query = query.ilike('display_name', `%${search}%`)
      query = query.order('created_at', { ascending: false })
        .range(offset ?? 0, (offset ?? 0) + (limit ?? 20) - 1)

      const { data, count, error } = await query
      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse({ users: data, total: count })
    }

    // ─── STATS ───

    if (action === 'dashboard_stats') {
      const [
        { count: userCount },
        { count: questionCount },
        { count: attemptCount },
        { count: activeToday },
      ] = await Promise.all([
        db.from('profiles').select('*', { count: 'exact', head: true }),
        db.from('questions').select('*', { count: 'exact', head: true }).eq('is_active', true),
        db.from('quiz_attempts').select('*', { count: 'exact', head: true }),
        db.from('profiles').select('*', { count: 'exact', head: true })
          .eq('last_played_at', new Date().toISOString().split('T')[0]),
      ])

      return jsonResponse({
        users: userCount ?? 0,
        questions: questionCount ?? 0,
        attempts: attemptCount ?? 0,
        active_today: activeToday ?? 0,
      })
    }

    // ─── DAILY QUIZ ───

    if (action === 'create_daily_quiz') {
      const { quiz_date, locale: qLocale, question_ids, bonus_question_id } = body as {
        quiz_date: string; locale: string; question_ids: string[]; bonus_question_id?: string
      }
      const { data, error } = await db
        .from('daily_quizzes')
        .insert({
          quiz_date,
          locale: qLocale,
          question_ids,
          bonus_question_id: bonus_question_id ?? null,
        })
        .select('id')
        .single()
      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse({ id: data.id })
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400)

  } catch (err) {
    console.error('admin error:', err)
    return jsonResponse({ error: 'Internal server error' }, 500)
  }
})

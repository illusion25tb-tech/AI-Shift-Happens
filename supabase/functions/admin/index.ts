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
      // SECURITY: Only allow specific fields to be updated
      const ALLOWED_FIELDS = ['scenario_text', 'mindset_tip', 'options', 'difficulty', 'category', 'is_active', 'locale', 'is_bullshit_trap']
      const safeUpdates: Record<string, unknown> = {}
      for (const key of ALLOWED_FIELDS) {
        if (key in updates) safeUpdates[key] = updates[key]
      }
      const { error } = await db
        .from('questions')
        .update(safeUpdates)
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

      // Step 1: Wenn search nach E-Mail aussieht oder explizit Mail-pattern, auth.users durchsuchen
      let userIdFilter: string[] | null = null
      if (search) {
        const looksLikeEmail = search.includes('@') || search.includes('.')
        if (looksLikeEmail) {
          // Sucht in auth.users (nur via service-role möglich)
          const { data: authUsers } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
          const matchingIds = (authUsers?.users ?? [])
            .filter(u => (u.email ?? '').toLowerCase().includes(search.toLowerCase()))
            .map(u => u.id)
          if (matchingIds.length > 0) userIdFilter = matchingIds
        }
      }

      let query = db.from('profiles').select('*', { count: 'exact' })
      if (userIdFilter) {
        query = query.in('id', userIdFilter)
      } else if (search) {
        query = query.ilike('display_name', `%${search}%`)
      }
      query = query.order('created_at', { ascending: false })
        .range(offset ?? 0, (offset ?? 0) + (limit ?? 20) - 1)

      const { data: profiles, count, error } = await query
      if (error) return jsonResponse({ error: error.message }, 500)

      // Step 2: emails fuer angezeigte User mit-laden
      const ids = (profiles ?? []).map(p => p.id)
      const emailMap: Record<string, string> = {}
      if (ids.length > 0) {
        const { data: authData } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
        for (const u of authData?.users ?? []) {
          if (ids.includes(u.id) && u.email) emailMap[u.id] = u.email
        }
      }
      const enriched = (profiles ?? []).map(p => ({ ...p, email: emailMap[p.id] ?? null }))

      return jsonResponse({ users: enriched, total: count })
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

    // ─── RESET FUNCTIONS (Probephase) ───

    if (action === 'reset_user') {
      const { user_id } = body as { user_id: string }
      if (!user_id) return jsonResponse({ error: 'user_id required' }, 400)
      await db.from('quiz_attempts').delete().eq('user_id', user_id)
      await db.from('weekly_scores').delete().eq('user_id', user_id)
      await db.from('user_badges').delete().eq('user_id', user_id)
      await db.from('profiles').update({
        total_xp: 0, level: 1, current_streak: 0, longest_streak: 0, last_played_at: null,
      }).eq('id', user_id)
      return jsonResponse({ ok: true, message: 'User reset: XP, badges, attempts, scores cleared' })
    }

    if (action === 'reset_all_scores') {
      const { count: attempts } = await db.from('quiz_attempts').select('*', { count: 'exact', head: true })
      await db.from('quiz_attempts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await db.from('weekly_scores').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await db.from('user_badges').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      // Reset all profiles
      await db.from('profiles').update({
        total_xp: 0, level: 1, current_streak: 0, longest_streak: 0, last_played_at: null,
      }).neq('id', '00000000-0000-0000-0000-000000000000')
      return jsonResponse({ ok: true, message: `All scores reset. ${attempts ?? 0} attempts deleted.` })
    }

    if (action === 'reset_daily_quizzes') {
      await db.from('daily_quizzes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      return jsonResponse({ ok: true, message: 'All daily quizzes deleted. Cron will recreate.' })
    }

    if (action === 'delete_user') {
      const { user_id } = body as { user_id: string }
      if (!user_id) return jsonResponse({ error: 'user_id required' }, 400)
      // Clean up game data
      await db.from('quiz_attempts').delete().eq('user_id', user_id)
      await db.from('weekly_scores').delete().eq('user_id', user_id)
      await db.from('user_badges').delete().eq('user_id', user_id)
      await db.from('challenges').delete().eq('challenger_id', user_id)
      await db.from('profiles').delete().eq('id', user_id)
      return jsonResponse({ ok: true, message: 'User and all data deleted' })
    }

    // ─── SPONSORS ───

    if (action === 'list_sponsors') {
      const { data, error } = await db.from('sponsors').select('*').order('created_at', { ascending: false })
      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse({ sponsors: data })
    }

    if (action === 'create_sponsor') {
      const { name, logo_url, website_url, description, description_i18n, tier, start_date, end_date } = body as any
      const { data, error } = await db.from('sponsors').insert({
        name, logo_url, website_url, description,
        description_i18n: description_i18n ?? {},
        tier: tier ?? 'standard',
        start_date: start_date ?? null,
        end_date: end_date ?? null,
      }).select('id').single()
      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse({ id: data.id })
    }

    if (action === 'update_sponsor') {
      const { sponsor_id, updates } = body as { sponsor_id: string; updates: Record<string, unknown> }
      const ALLOWED = ['name', 'logo_url', 'website_url', 'description', 'description_i18n', 'tier', 'is_active', 'start_date', 'end_date']
      const safe: Record<string, unknown> = {}
      for (const k of ALLOWED) { if (k in updates) safe[k] = updates[k] }
      const { error } = await db.from('sponsors').update(safe).eq('id', sponsor_id)
      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse({ ok: true })
    }

    if (action === 'delete_sponsor') {
      const { sponsor_id } = body as { sponsor_id: string }
      const { error } = await db.from('sponsors').delete().eq('id', sponsor_id)
      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse({ ok: true })
    }

    // ─── PRIZES ───

    if (action === 'list_prizes') {
      const { data, error } = await db.from('prizes')
        .select('*, sponsors(name, logo_url), profiles:winner_id(display_name)')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse({ prizes: data })
    }

    if (action === 'create_prize') {
      const { sponsor_id, title, title_i18n, description, description_i18n, image_url, prize_type, value_eur, week_start, month_start } = body as any
      const { data, error } = await db.from('prizes').insert({
        sponsor_id, title, description, image_url,
        title_i18n: title_i18n ?? {},
        description_i18n: description_i18n ?? {},
        prize_type: prize_type ?? 'weekly',
        value_eur: value_eur ?? null,
        week_start: week_start ?? null,
        month_start: month_start ?? null,
      }).select('id').single()
      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse({ id: data.id })
    }

    if (action === 'update_prize') {
      const { prize_id, updates } = body as { prize_id: string; updates: Record<string, unknown> }
      const ALLOWED = ['title', 'title_i18n', 'description', 'description_i18n', 'image_url', 'prize_type', 'value_eur', 'week_start', 'month_start', 'sponsor_id']
      const safe: Record<string, unknown> = {}
      for (const k of ALLOWED) { if (k in updates) safe[k] = updates[k] }
      const { error } = await db.from('prizes').update(safe).eq('id', prize_id)
      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse({ ok: true })
    }

    if (action === 'assign_prize_winner') {
      const { prize_id, winner_id } = body as { prize_id: string; winner_id: string }
      const { error } = await db.from('prizes').update({ winner_id }).eq('id', prize_id)
      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse({ ok: true })
    }

    if (action === 'delete_prize') {
      const { prize_id } = body as { prize_id: string }
      const { error } = await db.from('prizes').delete().eq('id', prize_id)
      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse({ ok: true })
    }

    // ─── MARK BULLSHIT TRAPS ───

    if (action === 'mark_bullshit_traps') {
      const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
      if (!anthropicKey) return jsonResponse({ error: 'ANTHROPIC_API_KEY not set' }, 500)

      const batchSize = 20
      const { data: questions } = await db.from('questions')
        .select('id, locale, scenario_text, options')
        .eq('is_active', true)
        .eq('is_bullshit_trap', false)
        .limit(batchSize)
      if (!questions || questions.length === 0) return jsonResponse({ marked: 0, message: 'No unprocessed questions' })

      const prompt = `Analyze these ${questions.length} quiz questions. For each, determine if ONE of the wrong answers (score != 100) qualifies as a "bullshit trap" — an answer that SOUNDS impressive and professional but is actually empty corporate jargon / consultant-speak / buzzword salad.

Criteria for bullshit trap:
- Uses terms like "ganzheitlich", "synergistisch", "holistisch", "transformativ", "Stakeholder-Alignment", "Cross-funktional", "agil" in a vague way
- Sounds like a LinkedIn post or consulting pitch
- Promises everything but specifies nothing concrete
- The WRONG answer sounds MORE professional than the correct one

Return a JSON array of question IDs that have a bullshit trap answer:
[{"id": "uuid-here", "is_trap": true}, {"id": "uuid-here", "is_trap": false}]

Only mark as true if there's a CLEAR buzzword/jargon trap. When in doubt, mark false.
ONLY JSON output, no markdown.

Questions:
${JSON.stringify(questions.map(q => ({ id: q.id, locale: q.locale, scenario_text: q.scenario_text.substring(0, 100), options: (q.options as any[]).map(o => ({ text: o.text, score: o.score })) })), null, 0)}`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }),
      })

      if (!response.ok) return jsonResponse({ error: 'Claude API error', status: response.status }, 500)

      const result = await response.json()
      const text = result.content?.[0]?.text ?? ''
      let parsed: Array<{ id: string; is_trap: boolean }>
      try {
        parsed = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
      } catch {
        return jsonResponse({ error: 'JSON parse error', raw: text.substring(0, 200) }, 500)
      }

      let marked = 0
      for (const item of parsed) {
        if (item.is_trap && item.id) {
          await db.from('questions').update({ is_bullshit_trap: true }).eq('id', item.id)
          marked++
        }
      }

      const { count: totalTraps } = await db.from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('is_bullshit_trap', true)

      return jsonResponse({ marked, batch_size: questions.length, total_traps: totalTraps })
    }

    if (action === 'toggle_bullshit_trap') {
      const { question_id, is_bullshit_trap } = body as { question_id: string; is_bullshit_trap: boolean }
      const { error } = await db.from('questions').update({ is_bullshit_trap }).eq('id', question_id)
      if (error) return jsonResponse({ error: error.message }, 500)
      return jsonResponse({ ok: true })
    }

    // ─── REBALANCE OPTIONS ───

    if (action === 'rebalance_options') {
      const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
      if (!anthropicKey) return jsonResponse({ error: 'ANTHROPIC_API_KEY not set' }, 500)

      const batchSize = 8
      const { data: allQ } = await db.from('questions').select('id, locale, scenario_text, options').eq('is_active', true)
      if (!allQ) return jsonResponse({ error: 'No questions' }, 500)

      const imbalanced = allQ.filter(q => {
        const opts = q.options as Array<{ text: string; score: number; feedbackText: string }>
        if (opts.length !== 3) return false
        const correct = opts.find(o => o.score === 100)
        const wrong = opts.filter(o => o.score !== 100)
        if (!correct || wrong.length === 0) return false
        const cl = correct.text.length
        const awl = wrong.reduce((s, o) => s + o.text.length, 0) / wrong.length
        return awl > 0 && cl > awl * 1.5
      })

      const batch = imbalanced.slice(0, batchSize)
      if (batch.length === 0) return jsonResponse({ fixed: 0, remaining: 0 })

      const prompt = `Rewrite the answer options for these ${batch.length} quiz questions.
RULES:
- Keep the EXACT same meaning and score for each option
- Keep feedbackText unchanged
- Make ALL 3 options approximately the same length (15-25 words each)
- If correct answer (score=100) is too long, shorten while keeping the key insight
- If wrong answers are too short, add plausible detail
- Maintain the same language (de or en), use correct umlauts

Input:
${JSON.stringify(batch.map(q => ({ id: q.id, locale: q.locale, options: q.options })), null, 0)}

Return JSON array with same structure but rebalanced option texts. ONLY JSON, no markdown.`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 8000, messages: [{ role: 'user', content: prompt }] }),
      })

      if (!response.ok) return jsonResponse({ error: 'Claude API error', status: response.status }, 500)

      const result = await response.json()
      const text = result.content?.[0]?.text ?? ''
      let parsed: Array<{ id: string; options: Array<{ text: string; score: number; feedbackText: string }> }>
      try {
        parsed = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
      } catch {
        return jsonResponse({ error: 'JSON parse error' }, 500)
      }

      let fixed = 0
      for (const item of parsed) {
        if (!item.id || !item.options || item.options.length !== 3) continue
        const orig = batch.find(q => q.id === item.id)
        if (!orig) continue
        const origScores = (orig.options as any[]).map(o => o.score).sort()
        const newScores = item.options.map(o => o.score).sort()
        if (JSON.stringify(origScores) !== JSON.stringify(newScores)) continue

        await db.from('questions').update({ options: item.options }).eq('id', item.id)
        fixed++
      }

      return jsonResponse({ fixed, remaining: imbalanced.length - fixed, total_imbalanced: imbalanced.length })
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400)

  } catch (err) {
    console.error('admin error:', err)
    return jsonResponse({ error: 'Internal server error' }, 500)
  }
})

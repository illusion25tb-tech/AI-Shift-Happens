import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verify user
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await anonClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request
    const body = await req.json()
    const { category, locale, count } = body as {
      category?: string
      locale?: string
      count?: number
    }

    const questionCount = Math.min(count ?? 10, 20)
    const questionLocale = locale === 'en' ? 'en' : 'de'

    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Build query
    let query = serviceClient
      .from('questions')
      .select('id, category, scenario_text, options, locale')
      .eq('locale', questionLocale)

    if (category) {
      query = query.eq('category', category)
    }

    const { data: allQuestions, error: qError } = await query

    if (qError || !allQuestions || allQuestions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No questions found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Shuffle and pick
    const shuffled = allQuestions.sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, questionCount)

    // Strip scores (anti-cheat)
    const questions = selected.map(q => {
      const options = q.options as Array<{ text: string; score: number; feedbackText: string }>
      return {
        id: q.id,
        category: q.category,
        scenario_text: q.scenario_text,
        options: options.map((opt, idx) => ({ text: opt.text, index: idx })),
        is_bonus: false,
      }
    })

    return new Response(
      JSON.stringify({ questions, total_available: allQuestions.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('get-freeplay-questions error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

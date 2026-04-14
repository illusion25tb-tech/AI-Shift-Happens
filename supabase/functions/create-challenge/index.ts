import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await anonClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const body = await req.json()
    const locale = body.locale === 'en' ? 'en' : 'de'
    const questionCount = 5

    const db = createClient(supabaseUrl, serviceKey)

    // Pick random questions
    const { data: allQuestions } = await db
      .from('questions')
      .select('id')
      .eq('locale', locale)
      .eq('is_active', true)

    if (!allQuestions || allQuestions.length < questionCount) {
      return new Response(JSON.stringify({ error: 'Not enough questions' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const shuffled = allQuestions.sort(() => Math.random() - 0.5)
    const questionIds = shuffled.slice(0, questionCount).map(q => q.id)

    // Create challenge — challenged_id is set to challenger_id initially (self-reference placeholder)
    // The challenged player will be set when they accept/play
    const { data: challenge, error: insertError } = await db
      .from('challenges')
      .insert({
        challenger_id: user.id,
        challenged_id: user.id, // placeholder, updated when opponent plays
        question_ids: questionIds,
      })
      .select('id')
      .single()

    if (insertError) {
      return new Response(JSON.stringify({ error: 'Failed to create challenge', detail: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({
      challenge_id: challenge.id,
      question_count: questionCount,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('create-challenge error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

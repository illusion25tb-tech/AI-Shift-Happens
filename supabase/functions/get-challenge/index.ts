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
    const { challenge_id } = body as { challenge_id: string }

    if (!challenge_id) {
      return new Response(JSON.stringify({ error: 'Missing challenge_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const db = createClient(supabaseUrl, serviceKey)

    // Get challenge
    const { data: challenge, error: challengeError } = await db
      .from('challenges')
      .select('*, challenger:profiles!challenges_challenger_id_fkey(display_name)')
      .eq('id', challenge_id)
      .single()

    if (challengeError || !challenge) {
      return new Response(JSON.stringify({ error: 'Challenge not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const isChallenger = challenge.challenger_id === user.id
    // Allow challenger and the opponent (or anyone for open challenges where challenged_id == challenger_id)
    const isOpenChallenge = challenge.challenger_id === challenge.challenged_id
    const isParticipant = isChallenger || challenge.challenged_id === user.id || isOpenChallenge

    // If not participant of open challenge, register as challenged
    if (isOpenChallenge && !isChallenger) {
      await db.from('challenges').update({ challenged_id: user.id }).eq('id', challenge_id)
    }

    const alreadyPlayed = isChallenger
      ? challenge.challenger_score !== null
      : challenge.challenged_score !== null

    // Load questions (strip scores for anti-cheat)
    const questionIds: string[] = challenge.question_ids
    const { data: questions } = await db
      .from('questions')
      .select('id, category, scenario_text, options')
      .in('id', questionIds)

    if (!questions) {
      return new Response(JSON.stringify({ error: 'Questions not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Maintain order from question_ids
    const orderedQuestions = questionIds
      .map(id => questions.find(q => q.id === id))
      .filter(Boolean)
      .map(q => {
        const options = q!.options as Array<{ text: string; score: number; feedbackText: string }>
        return {
          id: q!.id,
          category: q!.category,
          scenario_text: q!.scenario_text,
          options: options.map((opt, idx) => ({ text: opt.text, index: idx })),
          is_bonus: false,
        }
      })

    return new Response(JSON.stringify({
      challenge_id: challenge.id,
      challenger_name: challenge.challenger?.display_name ?? 'Anonym',
      challenger_score: challenge.challenger_score,
      challenged_score: challenge.challenged_score,
      is_challenger: isChallenger,
      already_played: alreadyPlayed,
      completed: challenge.completed_at !== null,
      questions: alreadyPlayed ? [] : orderedQuestions,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('get-challenge error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

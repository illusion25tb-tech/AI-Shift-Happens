import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate auth
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

    // Create anon client with user's auth header to get user identity
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

    // Create service role client to bypass RLS
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Get user's locale from profiles table
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('locale')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const locale = profile.locale as string

    // Get today's date in YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0]

    // Get today's daily quiz for this locale
    const { data: dailyQuiz, error: quizError } = await serviceClient
      .from('daily_quizzes')
      .select('*')
      .eq('quiz_date', today)
      .eq('locale', locale)
      .single()

    // Auto-create quiz if none exists (weekends, missed cron, etc.)
    let quiz = dailyQuiz
    if (quizError || !quiz) {
      const { data: randomQs } = await serviceClient
        .from('questions')
        .select('id')
        .eq('locale', locale)
        .eq('is_active', true)
        .order('id')  // deterministic for same-day
        .limit(100)

      if (!randomQs || randomQs.length < 4) {
        return new Response(
          JSON.stringify({ error: 'Not enough questions available' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Shuffle deterministically based on date
      const seed = today.replace(/-/g, '')
      const shuffled = randomQs.sort((a, b) => {
        const ha = (parseInt(seed) * 31 + a.id.charCodeAt(0)) % 1000
        const hb = (parseInt(seed) * 31 + b.id.charCodeAt(0)) % 1000
        return ha - hb
      })

      const qIds = shuffled.slice(0, 3).map(q => q.id)
      const bonusId = shuffled[3]?.id ?? null

      const { data: newQuiz, error: insertError } = await serviceClient
        .from('daily_quizzes')
        .insert({
          quiz_date: today,
          locale,
          question_ids: qIds,
          bonus_question_id: bonusId,
        })
        .select('*')
        .single()

      if (insertError || !newQuiz) {
        // Maybe another request just created it — try fetching again
        const { data: retryQuiz } = await serviceClient
          .from('daily_quizzes')
          .select('*')
          .eq('quiz_date', today)
          .eq('locale', locale)
          .single()

        if (!retryQuiz) {
          return new Response(
            JSON.stringify({ error: 'Could not create quiz for today' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        quiz = retryQuiz
      } else {
        quiz = newQuiz
      }
    }

    const dailyQuizFinal = quiz

    // Check if user already played today
    const { data: existingAttempt, error: attemptError } = await serviceClient
      .from('quiz_attempts')
      .select('*')
      .eq('daily_quiz_id', dailyQuizFinal.id)
      .eq('user_id', user.id)
      .not('finished_at', 'is', null)
      .maybeSingle()

    if (attemptError) {
      console.error('Error checking existing attempt:', attemptError)
    }

    if (existingAttempt) {
      return new Response(
        JSON.stringify({
          already_played: true,
          attempt: existingAttempt,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch questions by IDs from the daily quiz
    const questionIds = dailyQuizFinal.question_ids as string[]
    const bonusQuestionId = dailyQuizFinal.bonus_question_id as string | null

    const allIds = [...questionIds, ...(bonusQuestionId ? [bonusQuestionId] : [])]
    const { data: questions, error: questionsError } = await serviceClient
      .from('questions')
      .select('id, category, scenario_text, options')
      .in('id', allIds)

    if (questionsError || !questions) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch questions', details: questionsError?.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Strip scores from options — only return text and index (anti-cheat)
    type RawOption = { text: string; score: number; feedbackText: string }
    type SafeOption = { text: string; index: number }

    const sanitizedQuestions = questions.map((q) => {
      const safeOptions: SafeOption[] = (q.options as RawOption[]).map((opt, i) => ({
        text: opt.text,
        index: i,
      }))

      return {
        id: q.id,
        category: q.category,
        scenario_text: q.scenario_text,
        options: safeOptions,
        is_bonus: bonusQuestionId ? q.id === bonusQuestionId : false,
      }
    })

    // Return questions in the order specified by question_ids
    const orderedQuestions = questionIds
      .map((id) => sanitizedQuestions.find((q) => q.id === id))
      .filter(Boolean)

    return new Response(
      JSON.stringify({
        daily_quiz_id: dailyQuizFinal.id,
        quiz_date: dailyQuizFinal.quiz_date,
        questions: orderedQuestions,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('get-daily-quiz error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

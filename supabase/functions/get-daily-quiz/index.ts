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

    if (quizError || !dailyQuiz) {
      return new Response(
        JSON.stringify({ error: 'No quiz available for today', date: today, locale }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already played today
    const { data: existingAttempt, error: attemptError } = await serviceClient
      .from('quiz_attempts')
      .select('*')
      .eq('daily_quiz_id', dailyQuiz.id)
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
    const questionIds = dailyQuiz.question_ids as string[]
    const bonusQuestionId = dailyQuiz.bonus_question_id as string | null

    const { data: questions, error: questionsError } = await serviceClient
      .from('questions')
      .select('id, category, scenario_text, options, is_bonus')
      .in('id', questionIds)

    if (questionsError || !questions) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch questions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Strip scores from options — only return text and index (anti-cheat)
    type RawOption = { text: string; score: number; index: number; feedback_text?: string; mindset_tip?: string }
    type SafeOption = { text: string; index: number }

    const sanitizedQuestions = questions.map((q) => {
      const safeOptions: SafeOption[] = (q.options as RawOption[]).map((opt) => ({
        text: opt.text,
        index: opt.index,
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
        daily_quiz_id: dailyQuiz.id,
        quiz_date: dailyQuiz.quiz_date,
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

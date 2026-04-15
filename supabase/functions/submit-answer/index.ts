import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const STREAK_MULTIPLIERS = [1.0, 1.5, 2.0, 2.5, 3.0]
const SPEED_BONUS_MAX = 50
const SPEED_BONUS_DECAY = 1.67  // 50 / 30s timer
const BONUS_MULTIPLIER = 1.5

function getStreakMultiplier(streakCount: number, isBonus: boolean): number {
  const maxIndex = isBonus ? 4 : 3
  const index = Math.min(streakCount, maxIndex)
  return STREAK_MULTIPLIERS[index]
}

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

    // Parse request body
    const body = await req.json()
    const {
      question_id,
      selected_index,
      time_ms,
      streak_count,
      is_bonus,
    }: {
      question_id: string
      selected_index: number
      time_ms: number
      streak_count: number
      is_bonus: boolean
    } = body

    if (question_id === undefined || selected_index === undefined || time_ms === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: question_id, selected_index, time_ms' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create service role client to bypass RLS for DB reads
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Fetch the question from DB
    const { data: question, error: questionError } = await serviceClient
      .from('questions')
      .select('*')
      .eq('id', question_id)
      .single()

    if (questionError || !question) {
      return new Response(
        JSON.stringify({ error: 'Question not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the selected option by array position
    const options = question.options as Array<{ text: string; score: number; feedbackText: string }>
    const selectedOption = options[selected_index]

    if (!selectedOption) {
      return new Response(
        JSON.stringify({ error: 'Invalid selected_index', received: selected_index, total: options.length }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Server-side score calculation (anti-cheat)
    const base_score = selectedOption.score
    const is_correct = base_score === 100
    const is_dangerous = base_score < 0

    const streak_multi = is_correct
      ? getStreakMultiplier(streak_count ?? 0, is_bonus ?? false)
      : 1.0

    const bonus_multi = (is_bonus ?? false) ? BONUS_MULTIPLIER : 1.0

    const speed_bonus = is_correct
      ? Math.max(0, Math.round(SPEED_BONUS_MAX - (time_ms / 1000) * SPEED_BONUS_DECAY))
      : 0

    const total_score = is_correct
      ? Math.round(base_score * streak_multi * bonus_multi + speed_bonus * bonus_multi)
      : base_score

    const feedback_text = selectedOption.feedbackText ?? ''
    const mindset_tip = question.mindset_tip ?? ''

    return new Response(
      JSON.stringify({
        question_id,
        selected_index,
        base_score,
        streak_multi,
        speed_bonus,
        bonus_multi,
        total_score,
        feedback_text,
        mindset_tip,
        is_correct,
        is_dangerous,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('submit-answer error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

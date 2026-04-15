import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }),
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

    const db = createClient(supabaseUrl, serviceKey)

    // Get all attempts
    const { data: attempts } = await db
      .from('quiz_attempts')
      .select('total_score, max_streak, answers, created_at, quiz_type')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (!attempts || attempts.length === 0) {
      return new Response(JSON.stringify({
        category_scores: {},
        score_history: [],
        totals: { quizzes: 0, correct: 0, questions: 0, avg_score: 0, best_score: 0, best_streak: 0 },
        comparison: null,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Category breakdown: accuracy per category
    const catStats: Record<string, { correct: number; total: number; totalScore: number }> = {}
    let totalCorrect = 0
    let totalQuestions = 0
    let bestScore = 0
    let bestStreak = 0

    for (const attempt of attempts) {
      const answers = (attempt.answers ?? []) as Array<{
        is_correct: boolean; total_score: number; question_id: string
      }>

      bestScore = Math.max(bestScore, attempt.total_score ?? 0)
      bestStreak = Math.max(bestStreak, attempt.max_streak ?? 0)

      for (const ans of answers) {
        totalQuestions++
        if (ans.is_correct) totalCorrect++
      }
    }

    // Get question categories for each answer
    const allQuestionIds = new Set<string>()
    for (const attempt of attempts) {
      const answers = (attempt.answers ?? []) as Array<{ question_id: string; is_correct: boolean; total_score: number }>
      for (const ans of answers) {
        if (ans.question_id) allQuestionIds.add(ans.question_id)
      }
    }

    // Fetch categories for all questions
    const questionCats: Record<string, string> = {}
    if (allQuestionIds.size > 0) {
      const { data: questions } = await db
        .from('questions')
        .select('id, category')
        .in('id', [...allQuestionIds])

      for (const q of (questions ?? [])) {
        questionCats[q.id] = q.category
      }
    }

    // Build category stats
    for (const attempt of attempts) {
      const answers = (attempt.answers ?? []) as Array<{ question_id: string; is_correct: boolean; total_score: number }>
      for (const ans of answers) {
        const cat = questionCats[ans.question_id]
        if (!cat) continue
        if (!catStats[cat]) catStats[cat] = { correct: 0, total: 0, totalScore: 0 }
        catStats[cat].total++
        catStats[cat].totalScore += ans.total_score ?? 0
        if (ans.is_correct) catStats[cat].correct++
      }
    }

    // Category scores as percentage (0-100)
    const categoryScores: Record<string, number> = {}
    for (const [cat, stats] of Object.entries(catStats)) {
      categoryScores[cat] = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
    }

    // Score history (daily aggregation)
    const dailyScores: Record<string, { score: number; count: number }> = {}
    for (const attempt of attempts) {
      const day = (attempt.created_at ?? '').split('T')[0]
      if (!day) continue
      if (!dailyScores[day]) dailyScores[day] = { score: 0, count: 0 }
      dailyScores[day].score += attempt.total_score ?? 0
      dailyScores[day].count++
    }

    const scoreHistory = Object.entries(dailyScores)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { score, count }]) => ({ date, score, count }))

    // Comparison: user vs average
    const { data: allProfiles } = await db
      .from('profiles')
      .select('total_xp')
      .gt('total_xp', 0)

    const allXps = (allProfiles ?? []).map(p => p.total_xp ?? 0).sort((a, b) => a - b)
    const { data: myProfile } = await db.from('profiles').select('total_xp').eq('id', user.id).single()
    const myXp = myProfile?.total_xp ?? 0

    let percentile = 0
    if (allXps.length > 0) {
      const belowMe = allXps.filter(x => x < myXp).length
      percentile = Math.round((belowMe / allXps.length) * 100)
    }

    const avgXp = allXps.length > 0 ? Math.round(allXps.reduce((a, b) => a + b, 0) / allXps.length) : 0

    return new Response(JSON.stringify({
      category_scores: categoryScores,
      score_history: scoreHistory,
      totals: {
        quizzes: attempts.length,
        correct: totalCorrect,
        questions: totalQuestions,
        avg_score: attempts.length > 0 ? Math.round(attempts.reduce((s, a) => s + (a.total_score ?? 0), 0) / attempts.length) : 0,
        best_score: bestScore,
        best_streak: bestStreak,
      },
      comparison: {
        percentile,
        avg_xp: avgXp,
        my_xp: myXp,
        total_players: allXps.length,
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('get-stats error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

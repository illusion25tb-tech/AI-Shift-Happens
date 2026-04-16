import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await anonClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const db = createClient(supabaseUrl, serviceKey)
    const body = await req.json()
    const { daily_quiz_id, answers: clientAnswers } = body

    if (!daily_quiz_id) {
      return new Response(JSON.stringify({ error: 'Missing daily_quiz_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // SECURITY: Check for duplicate submission
    const { data: existingAttempt } = await db.from('quiz_attempts')
      .select('id')
      .eq('user_id', user.id)
      .eq('daily_quiz_id', daily_quiz_id)
      .not('finished_at', 'is', null)
      .maybeSingle()

    if (existingAttempt) {
      return new Response(JSON.stringify({ error: 'Already submitted for this quiz' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // SECURITY: Verify answers server-side by re-fetching questions and recalculating scores
    const { data: dailyQuiz } = await db.from('daily_quizzes')
      .select('question_ids, bonus_question_id')
      .eq('id', daily_quiz_id)
      .single()

    if (!dailyQuiz) {
      return new Response(JSON.stringify({ error: 'Quiz not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const allQuestionIds = [...(dailyQuiz.question_ids ?? []), dailyQuiz.bonus_question_id].filter(Boolean)
    const { data: questions } = await db.from('questions').select('id, options').in('id', allQuestionIds)

    const questionMap = new Map<string, any[]>()
    for (const q of (questions ?? [])) {
      questionMap.set(q.id, q.options as any[])
    }

    // Recalculate scores from client answers using server-side question data
    const STREAK_MULTIPLIERS = [1.0, 1.5, 2.0, 2.5, 3.0]
    const SPEED_BONUS_MAX = 50
    const SPEED_BONUS_DECAY = 1.67
    const BONUS_MULTIPLIER = 1.5

    const verifiedAnswers: any[] = []
    let totalScore = 0
    let streak = 0
    let maxStreak = 0

    for (const clientAns of (clientAnswers ?? [])) {
      const opts = questionMap.get(clientAns.question_id)
      if (!opts) continue

      const selectedOpt = opts[clientAns.selected_index]
      if (!selectedOpt) continue

      const baseScore = selectedOpt.score ?? 0
      const isCorrect = baseScore === 100
      const isDangerous = baseScore < 0
      const isBonusQ = clientAns.question_id === dailyQuiz.bonus_question_id

      if (isDangerous) streak = 0
      else if (isCorrect) streak++

      maxStreak = Math.max(maxStreak, streak)

      const streakIdx = Math.min(streak, isBonusQ ? 4 : 3)
      const streakMulti = isCorrect ? STREAK_MULTIPLIERS[streakIdx] : 1.0
      const bonusMulti = isBonusQ ? BONUS_MULTIPLIER : 1.0
      const timeMs = Math.max(0, clientAns.time_ms ?? 30000)
      const speedBonus = isCorrect ? Math.max(0, Math.round(SPEED_BONUS_MAX - (timeMs / 1000) * SPEED_BONUS_DECAY)) : 0

      const answerScore = isCorrect
        ? Math.round(baseScore * streakMulti * bonusMulti + speedBonus * bonusMulti)
        : baseScore

      totalScore += answerScore

      verifiedAnswers.push({
        question_id: clientAns.question_id,
        selected_index: clientAns.selected_index,
        base_score: baseScore,
        total_score: answerScore,
        is_correct: isCorrect,
        is_dangerous: isDangerous,
        streak_multi: streakMulti,
        speed_bonus: speedBonus,
        bonus_multi: bonusMulti,
        feedback_text: selectedOpt.feedbackText ?? '',
        time_ms: timeMs,
      })
    }

    // Save verified attempt
    await db.from('quiz_attempts').insert({
      user_id: user.id,
      quiz_type: 'daily',
      daily_quiz_id,
      total_score: totalScore,
      max_streak: maxStreak,
      answers: verifiedAnswers,
      finished_at: new Date().toISOString(),
    })

    // Get profile
    const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single()
    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // XP + Level
    const xpGain = Math.max(0, totalScore)
    const newTotalXp = (profile.total_xp ?? 0) + xpGain

    const LEVELS = [
      { level: 1, xp: 0 }, { level: 2, xp: 1000 }, { level: 3, xp: 5000 },
      { level: 4, xp: 15000 }, { level: 5, xp: 40000 }, { level: 6, xp: 100000 },
    ]
    let newLevel = 1
    for (const l of LEVELS) { if (newTotalXp >= l.xp) newLevel = l.level }

    // Streak
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const lastPlayed = profile.last_played_at
    let newStreak = profile.current_streak ?? 0

    if (lastPlayed !== todayStr) {
      const lastDate = lastPlayed ? new Date(lastPlayed + 'T00:00:00Z') : null
      let streakContinues = false
      if (lastDate) {
        const diffDays = Math.round((today.getTime() - lastDate.getTime()) / 86400000)
        const lastDow = lastDate.getUTCDay()
        if (diffDays === 1) streakContinues = true
        else if (lastDow === 5 && diffDays <= 3) streakContinues = true
      }
      newStreak = streakContinues ? newStreak + 1 : 1
    }

    const newLongestStreak = Math.max(profile.longest_streak ?? 0, newStreak)

    // Update profile
    await db.from('profiles').update({
      total_xp: newTotalXp, level: newLevel,
      current_streak: newStreak, longest_streak: newLongestStreak,
      last_played_at: todayStr,
    }).eq('id', user.id)

    // Badges (using verified data)
    const { data: existingBadges } = await db.from('user_badges').select('badge_type').eq('user_id', user.id)
    const earnedTypes = (existingBadges ?? []).map((b: any) => b.badge_type)
    const newBadges: string[] = []
    const award = (type: string) => { if (!earnedTypes.includes(type) && !newBadges.includes(type)) newBadges.push(type) }

    award('first_quiz')
    const correctCount = verifiedAnswers.filter(a => a.is_correct).length
    if (correctCount === verifiedAnswers.length && verifiedAnswers.length >= 3) award('perfect_score')
    if (newStreak >= 3) award('streak_3')
    if (newStreak >= 7) award('streak_7')
    if (newStreak >= 30) award('streak_30')
    if (newLevel >= 3) award('level_3')
    if (newLevel >= 5) award('level_5')
    if (newTotalXp >= 10000) award('xp_10000')

    if (newBadges.length > 0) {
      await db.from('user_badges').insert(newBadges.map(type => ({ user_id: user.id, badge_type: type })))
    }

    // Weekly score
    const mondayOfWeek = new Date(today)
    const dow = mondayOfWeek.getUTCDay()
    const diff = dow === 0 ? 6 : dow - 1
    mondayOfWeek.setUTCDate(mondayOfWeek.getUTCDate() - diff)
    const weekStart = mondayOfWeek.toISOString().split('T')[0]
    const dayNames = ['so', 'mo', 'di', 'mi', 'do', 'fr', 'sa']
    const todayName = dayNames[today.getUTCDay()]

    const { data: existingWeekly } = await db.from('weekly_scores')
      .select('*').eq('user_id', user.id).eq('week_start', weekStart).maybeSingle()

    if (existingWeekly) {
      const scores = (existingWeekly.daily_scores ?? {}) as Record<string, number>
      scores[todayName] = totalScore
      const weekTotal = Object.values(scores).reduce((s, v) => s + v, 0)
      await db.from('weekly_scores').update({ daily_scores: scores, total_score: weekTotal }).eq('id', existingWeekly.id)
    } else {
      await db.from('weekly_scores').insert({
        user_id: user.id, week_start: weekStart,
        daily_scores: { [todayName]: totalScore }, total_score: totalScore,
      })
    }

    return new Response(JSON.stringify({
      xp_gained: xpGain, total_xp: newTotalXp, level: newLevel,
      streak: newStreak, longest_streak: newLongestStreak, new_badges: newBadges,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('finish-daily error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

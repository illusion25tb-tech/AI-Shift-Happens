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

    const questionMap = new Map<string, any[]>()

    // Recalculate scores from client answers using server-side question data
    const STREAK_MULTIPLIERS = [1.0, 1.5, 2.0, 2.5, 3.0]
    const BONUS_MULTIPLIER = 1.5
    const SPEED_BONUS_MAX = 50
    const SPEED_BONUS_DECAY = 0.83 // 50 / 60s
    const CONFIDENCE_SCORES: Record<number, { correct: number; wrong: number; bullshit: number }> = {
      1: { correct:  50, wrong:    0, bullshit:    0 },
      2: { correct: 150, wrong:  -50, bullshit:  -75 },
      3: { correct: 300, wrong: -150, bullshit: -200 },
    }
    const CALIBRATION_BONUS = 100
    const CALIBRATION_MALUS = -100
    const BULLSHIT_DETECT_BONUS = 50

    // Also fetch is_bullshit_trap for each question
    const { data: questionsWithTraps } = await db.from('questions')
      .select('id, options, is_bullshit_trap').in('id', allQuestionIds)
    const trapMap = new Map<string, boolean>()
    for (const q of (questionsWithTraps ?? [])) {
      questionMap.set(q.id, q.options as any[])
      trapMap.set(q.id, q.is_bullshit_trap ?? false)
    }

    const verifiedAnswers: any[] = []
    let totalScore = 0
    let streak = 0
    let maxStreak = 0

    for (const clientAns of (clientAnswers ?? [])) {
      const opts = questionMap.get(clientAns.question_id)
      if (!opts) continue

      const selectedOpt = opts[clientAns.selected_index]
      if (!selectedOpt) continue

      const optScore = selectedOpt.score ?? 0
      const isCorrect = optScore === 100
      const isDangerous = optScore < 0
      const isBonusQ = clientAns.question_id === dailyQuiz.bonus_question_id
      const isBullshitTrap = trapMap.get(clientAns.question_id) ?? false
      const confidence = Math.min(3, Math.max(1, clientAns.confidence ?? 2)) as 1 | 2 | 3

      if (isDangerous) streak = 0
      else if (isCorrect) streak++

      maxStreak = Math.max(maxStreak, streak)

      const scores = CONFIDENCE_SCORES[confidence]
      let baseScore: number
      if (isCorrect) {
        baseScore = scores.correct
      } else if (isBullshitTrap) {
        baseScore = scores.bullshit
      } else {
        baseScore = scores.wrong
      }

      const streakIdx = Math.min(streak, isBonusQ ? 4 : 3)
      const streakMulti = isCorrect ? STREAK_MULTIPLIERS[streakIdx] : 1.0
      const bonusMulti = isBonusQ ? BONUS_MULTIPLIER : 1.0

      // Speed bonus: 0-50 for fast correct answers (60s timer)
      const timeMs = Math.max(0, clientAns.time_ms ?? 60000)
      const speedBonus = isCorrect
        ? Math.max(0, Math.round(SPEED_BONUS_MAX - (timeMs / 1000) * SPEED_BONUS_DECAY))
        : 0

      const answerScore = isCorrect
        ? Math.round(baseScore * streakMulti * bonusMulti + speedBonus * bonusMulti)
        : baseScore

      totalScore += answerScore

      verifiedAnswers.push({
        question_id: clientAns.question_id,
        selected_index: clientAns.selected_index,
        confidence,
        base_score: baseScore,
        total_score: answerScore,
        is_correct: isCorrect,
        is_dangerous: isDangerous,
        is_bullshit_trap: isBullshitTrap,
        streak_multi: streakMulti,
        speed_bonus: speedBonus,
        confidence_multi: confidence,
        bonus_multi: bonusMulti,
        feedback_text: selectedOpt.feedbackText ?? '',
        time_ms: clientAns.time_ms ?? 30000,
      })
    }

    // Calibration bonus: check if confident answers are mostly correct
    const confidentAnswers = verifiedAnswers.filter((a: any) => a.confidence === 3)
    if (confidentAnswers.length > 0) {
      const confCorrectRate = confidentAnswers.filter((a: any) => a.is_correct).length / confidentAnswers.length
      if (confCorrectRate >= 0.8) totalScore += CALIBRATION_BONUS
      else if (confCorrectRate < 0.5) totalScore += CALIBRATION_MALUS
    }

    // Bullshit detector bonus: reward not being confident on traps
    const bsBonus = verifiedAnswers.filter((a: any) => a.is_bullshit_trap && a.confidence < 3).length * BULLSHIT_DETECT_BONUS
    totalScore += bsBonus

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

    // --- Core badges ---
    award('first_quiz')
    const correctCount = verifiedAnswers.filter(a => a.is_correct).length
    if (correctCount === verifiedAnswers.length && verifiedAnswers.length >= 3) award('perfect_score')
    if (newStreak >= 3) award('streak_3')
    if (newStreak >= 7) award('streak_7')
    if (newStreak >= 30) award('streak_30')
    if (newLevel >= 3) award('level_3')
    if (newLevel >= 5) award('level_5')
    if (newTotalXp >= 10000) award('xp_10000')
    if (newTotalXp >= 50000) award('xp_50000')

    // --- Confidence badges ---
    // All-In: 5x confident + correct in a row (across all quizzes — check this quiz first)
    const confidentCorrectInRow = verifiedAnswers.filter((a: any) => a.confidence === 3 && a.is_correct)
    if (confidentCorrectInRow.length >= 4) award('all_in') // 4 of 4 in daily = impressive enough

    // Pokerface: used all 3 confidence levels in one quiz
    const usedLevels = new Set(verifiedAnswers.map((a: any) => a.confidence))
    if (usedLevels.size >= 3) award('pokerface')

    // Overconfident: 3x confident + wrong in one week
    const confidentWrongThisQuiz = verifiedAnswers.filter((a: any) => a.confidence === 3 && !a.is_correct).length
    if (confidentWrongThisQuiz >= 3) award('overconfident')

    // Bullshit Radar: detected 10+ traps (across all quizzes)
    const { count: allBsDetected } = await db.rpc('count_bullshit_detected', { p_user_id: user.id }).single()
      .then(r => r)
      .catch(() => ({ count: 0 }))
    // Fallback: count from current quiz only if RPC not available
    const bsDetectedThisQuiz = verifiedAnswers.filter((a: any) => a.is_bullshit_trap && a.confidence < 3).length
    if (bsDetectedThisQuiz > 0 || (allBsDetected ?? 0) >= 10) {
      // Simple check: if they detected any in this quiz, check historical count
      const { data: historicalAttempts } = await db.from('quiz_attempts')
        .select('answers').eq('user_id', user.id).limit(200)
      let totalBsDetected = bsDetectedThisQuiz
      for (const att of (historicalAttempts ?? [])) {
        for (const a of ((att.answers ?? []) as any[])) {
          if (a.is_bullshit_trap && a.confidence && a.confidence < 3) totalBsDetected++
        }
      }
      if (totalBsDetected >= 10) award('bullshit_radar')
      if (totalBsDetected >= 20) award('berater_killer')
    }

    // Realist: 10+ quizzes with good calibration (>80% of confident answers correct)
    // Simplified: check if this quiz had good calibration and count historically
    if (confidentAnswers.length > 0) {
      const thisQuizCalibrated = confidentAnswers.filter((a: any) => a.is_correct).length / confidentAnswers.length >= 0.8
      if (thisQuizCalibrated) {
        const { data: recentAttempts } = await db.from('quiz_attempts')
          .select('answers').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
        let calibratedQuizCount = thisQuizCalibrated ? 1 : 0
        for (const att of (recentAttempts ?? [])) {
          const ans = (att.answers ?? []) as any[]
          const confAns = ans.filter((a: any) => a.confidence === 3)
          if (confAns.length > 0) {
            const rate = confAns.filter((a: any) => a.is_correct).length / confAns.length
            if (rate >= 0.8) calibratedQuizCount++
          }
        }
        if (calibratedQuizCount >= 10) award('realist')
      }
    }

    // --- Night owl / Early bird ---
    const hour = today.getUTCHours()
    if (hour >= 22 || hour < 4) award('night_owl')
    if (hour >= 5 && hour < 7) award('early_bird')

    // --- Marathon: 10 quizzes today ---
    const { count: todayCount } = await db.from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', todayStr + 'T00:00:00Z')
    if ((todayCount ?? 0) >= 10) award('marathon')

    // --- Team player ---
    if (profile.team_id) award('team_player')

    // --- Recruiter: 3+ referrals ---
    const { count: referralCount } = await db.from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('invited_by', user.id)
    if ((referralCount ?? 0) >= 3) award('recruiter')

    // --- Perfectionist: 3+ perfect quizzes ---
    const { data: allAttempts } = await db.from('quiz_attempts')
      .select('answers')
      .eq('user_id', user.id)
      .not('finished_at', 'is', null)
    const perfectCount = (allAttempts ?? []).filter(a => {
      const ans = (a.answers ?? []) as any[]
      return ans.length >= 3 && ans.every((x: any) => x.is_correct)
    }).length
    if (perfectCount >= 3) award('perfectionist')

    // --- Comeback: returned after 7+ days ---
    if (profile.last_played_at) {
      const lastDate = new Date(profile.last_played_at + 'T00:00:00Z')
      const gapDays = Math.round((today.getTime() - lastDate.getTime()) / 86400000)
      if (gapDays >= 7) award('comeback')
    }

    // --- Century: 100 total quizzes ---
    const { count: totalQuizzes } = await db.from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    if ((totalQuizzes ?? 0) >= 100) award('century')

    // --- Categories all + Specialist (80%+ in one category) ---
    const { data: userAttempts } = await db.from('quiz_attempts')
      .select('answers').eq('user_id', user.id).limit(100)
    const allQIds = new Set<string>()
    const catCorrect: Record<string, { correct: number; total: number }> = {}
    for (const att of (userAttempts ?? [])) {
      for (const a of ((att.answers ?? []) as any[])) {
        if (a.question_id) allQIds.add(a.question_id)
      }
    }
    if (allQIds.size > 0) {
      const { data: catQuestions } = await db.from('questions')
        .select('id, category').in('id', [...allQIds].slice(0, 200))
      const qCatMap = new Map((catQuestions ?? []).map(q => [q.id, q.category]))

      for (const att of (userAttempts ?? [])) {
        for (const a of ((att.answers ?? []) as any[])) {
          const cat = qCatMap.get(a.question_id)
          if (!cat) continue
          if (!catCorrect[cat]) catCorrect[cat] = { correct: 0, total: 0 }
          catCorrect[cat].total++
          if (a.is_correct) catCorrect[cat].correct++
        }
      }

      const playedCats = new Set(Object.keys(catCorrect))
      if (playedCats.size >= 15) award('categories_all')

      // Specialist: 80%+ in any category with 5+ questions
      for (const [, stats] of Object.entries(catCorrect)) {
        if (stats.total >= 5 && (stats.correct / stats.total) >= 0.8) {
          award('specialist')
          break
        }
      }
    }

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

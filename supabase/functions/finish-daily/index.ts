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
    const { daily_quiz_id, answers, total_score, max_streak } = body

    // 1. Save quiz attempt
    const { error: attemptErr } = await db.from('quiz_attempts').insert({
      user_id: user.id,
      quiz_type: 'daily',
      daily_quiz_id,
      total_score,
      max_streak,
      answers,
      finished_at: new Date().toISOString(),
    })
    if (attemptErr) {
      return new Response(JSON.stringify({ error: 'Failed to save attempt', details: attemptErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 2. Get current profile
    const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single()
    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 3. Calculate XP gain
    const xpGain = Math.max(0, total_score)
    const newTotalXp = (profile.total_xp ?? 0) + xpGain

    // 4. Update streak (weekday logic)
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const lastPlayed = profile.last_played_at
    let newStreak = profile.current_streak ?? 0

    if (lastPlayed !== todayStr) {
      const lastDate = lastPlayed ? new Date(lastPlayed + 'T00:00:00Z') : null
      let streakContinues = false

      if (lastDate) {
        const diffMs = today.getTime() - lastDate.getTime()
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
        const lastDow = lastDate.getUTCDay() // 0=Sun..6=Sat

        if (diffDays === 1) {
          streakContinues = true
        } else if (lastDow === 5 && diffDays <= 3) {
          // Friday -> Saturday/Sunday/Monday = weekend skip
          streakContinues = true
        } else if (lastDow === 5 && today.getUTCDay() === 1) {
          streakContinues = true
        }
      }

      newStreak = streakContinues ? newStreak + 1 : 1
    }

    const newLongestStreak = Math.max(profile.longest_streak ?? 0, newStreak)

    // 5. Calculate level
    const LEVELS = [
      { level: 1, xp: 0 }, { level: 2, xp: 1000 }, { level: 3, xp: 5000 },
      { level: 4, xp: 15000 }, { level: 5, xp: 40000 }, { level: 6, xp: 100000 },
    ]
    let newLevel = 1
    for (const l of LEVELS) { if (newTotalXp >= l.xp) newLevel = l.level }

    // 6. Update profile
    await db.from('profiles').update({
      total_xp: newTotalXp,
      level: newLevel,
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      last_played_at: todayStr,
    }).eq('id', user.id)

    // 7. Check badges
    const { data: existingBadges } = await db.from('user_badges').select('badge_type').eq('user_id', user.id)
    const earnedTypes = (existingBadges ?? []).map((b: any) => b.badge_type)
    const newBadges: string[] = []
    const award = (type: string) => { if (!earnedTypes.includes(type) && !newBadges.includes(type)) newBadges.push(type) }

    const correctCount = answers.filter((a: any) => a.is_correct).length
    if (correctCount === answers.length && answers.length >= 4) award('perfect_round')

    const correctAnswers = answers.filter((a: any) => a.is_correct)
    if (correctAnswers.length >= 3) {
      const fastest = [...correctAnswers].sort((a: any, b: any) => a.time_ms - b.time_ms).slice(0, 3)
      if (fastest.reduce((s: number, a: any) => s + a.time_ms, 0) < 15000) award('speed_demon')
    }

    if (today.getUTCHours() < 8) {
      const { count } = await db.from('quiz_attempts').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('quiz_type', 'daily')
      if ((count ?? 0) >= 5) award('early_bird')
    }

    if (newStreak >= 7) award('streak_7')
    if (newStreak >= 30) award('streak_30')
    if (newStreak >= 100) award('streak_100')

    if (newBadges.length > 0) {
      await db.from('user_badges').insert(newBadges.map(type => ({ user_id: user.id, badge_type: type })))
    }

    // 8. Update weekly score
    const mondayOfWeek = new Date(today)
    const dow = mondayOfWeek.getUTCDay()
    const diff = dow === 0 ? 6 : dow - 1
    mondayOfWeek.setUTCDate(mondayOfWeek.getUTCDate() - diff)
    const weekStart = mondayOfWeek.toISOString().split('T')[0]
    const dayNames = ['so', 'mo', 'di', 'mi', 'do', 'fr', 'sa']
    const todayName = dayNames[today.getUTCDay()]

    const { data: existingWeekly } = await db.from('weekly_scores').select('*').eq('user_id', user.id).eq('week_start', weekStart).maybeSingle()

    if (existingWeekly) {
      const scores = (existingWeekly.daily_scores ?? {}) as Record<string, number>
      scores[todayName] = total_score
      const weekTotal = Object.values(scores).reduce((s, v) => s + v, 0)
      await db.from('weekly_scores').update({ daily_scores: scores, total_score: weekTotal }).eq('id', existingWeekly.id)
    } else {
      await db.from('weekly_scores').insert({
        user_id: user.id, week_start: weekStart,
        daily_scores: { [todayName]: total_score }, total_score,
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

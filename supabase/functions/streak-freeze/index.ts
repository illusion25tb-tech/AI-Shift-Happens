import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const FREEZE_COST_XP = 500

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
    const body = await req.json()
    const { action } = body as { action: string }

    // Check eligibility
    if (action === 'check') {
      const { data: profile } = await db.from('profiles')
        .select('total_xp, current_streak, last_played_at')
        .eq('id', user.id).single()

      if (!profile) {
        return new Response(JSON.stringify({ error: 'Profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const today = new Date().toISOString().split('T')[0]
      const lastPlayed = profile.last_played_at
      const streak = profile.current_streak ?? 0
      const xp = profile.total_xp ?? 0

      // Determine if streak is at risk (missed yesterday, weekday)
      let streakAtRisk = false
      if (lastPlayed && streak > 0) {
        const last = new Date(lastPlayed)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
        // Streak at risk if missed more than 1 weekday
        if (diffDays >= 2) streakAtRisk = true
        // Account for weekends
        if (diffDays === 3 && last.getDay() === 5) streakAtRisk = false // Fri->Mon is ok
        if (diffDays === 2 && (last.getDay() === 5 || last.getDay() === 6)) streakAtRisk = false
      }

      return new Response(JSON.stringify({
        eligible: streakAtRisk && xp >= FREEZE_COST_XP,
        streak_at_risk: streakAtRisk,
        current_streak: streak,
        cost_xp: FREEZE_COST_XP,
        current_xp: xp,
        can_afford: xp >= FREEZE_COST_XP,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Use freeze
    if (action === 'freeze') {
      const { data: profile } = await db.from('profiles')
        .select('total_xp, current_streak, last_played_at')
        .eq('id', user.id).single()

      if (!profile || (profile.total_xp ?? 0) < FREEZE_COST_XP) {
        return new Response(JSON.stringify({ error: 'Not enough XP', cost: FREEZE_COST_XP }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Deduct XP and set last_played_at to yesterday (preserves streak)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      await db.from('profiles').update({
        total_xp: (profile.total_xp ?? 0) - FREEZE_COST_XP,
        last_played_at: yesterdayStr,
      }).eq('id', user.id)

      return new Response(JSON.stringify({
        ok: true,
        xp_spent: FREEZE_COST_XP,
        remaining_xp: (profile.total_xp ?? 0) - FREEZE_COST_XP,
        streak_preserved: profile.current_streak,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('streak-freeze error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

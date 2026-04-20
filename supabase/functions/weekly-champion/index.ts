import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { verifyCronOrServiceRole } from '../_shared/auth.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // SECURITY: Only cron/service role can trigger champion calculation
  if (!(await verifyCronOrServiceRole(req))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const db = createClient(supabaseUrl, serviceKey)

    // Get last week's Monday
    const today = new Date()
    const dow = today.getUTCDay()
    const lastMonday = new Date(today)
    lastMonday.setUTCDate(lastMonday.getUTCDate() - (dow === 0 ? 6 : dow - 1) - 7)
    const weekStart = lastMonday.toISOString().split('T')[0]

    // Get all scores for last week
    const { data: scores } = await db.from('weekly_scores')
      .select('id, user_id, total_score')
      .eq('week_start', weekStart)
      .order('total_score', { ascending: false })

    if (!scores || scores.length === 0) {
      return new Response(JSON.stringify({ message: 'No scores for last week', week_start: weekStart }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Assign ranks
    for (let i = 0; i < scores.length; i++) {
      await db.from('weekly_scores').update({
        rank: i + 1,
        is_champion: i === 0,
      }).eq('id', scores[i].id)
    }

    // Award badges to champion
    const champion = scores[0]

    // weekly_champion badge
    const { data: existingBadge } = await db.from('user_badges')
      .select('id').eq('user_id', champion.user_id).eq('badge_type', 'weekly_champion').maybeSingle()

    if (!existingBadge) {
      await db.from('user_badges').insert({
        user_id: champion.user_id,
        badge_type: 'weekly_champion',
      })
    }

    // Check serial_winner (3x champion)
    const { count: championCount } = await db.from('weekly_scores')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', champion.user_id)
      .eq('is_champion', true)

    if ((championCount ?? 0) >= 3) {
      const { data: serialBadge } = await db.from('user_badges')
        .select('id').eq('user_id', champion.user_id).eq('badge_type', 'serial_winner').maybeSingle()
      if (!serialBadge) {
        await db.from('user_badges').insert({
          user_id: champion.user_id,
          badge_type: 'serial_winner',
        })
      }
    }

    // Auto-assign weekly prize to champion
    const { data: weeklyPrize } = await db.from('prizes')
      .select('id')
      .eq('prize_type', 'weekly')
      .eq('week_start', weekStart)
      .is('winner_id', null)
      .maybeSingle()

    if (weeklyPrize) {
      await db.from('prizes').update({ winner_id: champion.user_id }).eq('id', weeklyPrize.id)
    }

    // ─── TEAM BATTLE RESULTS ───
    // Resolve all active team challenges for last week
    const { data: activeBattles } = await db.from('team_challenges')
      .select('id, challenger_team_id, challenged_team_id')
      .eq('week_start', weekStart)
      .eq('status', 'active')

    let battlesResolved = 0
    for (const battle of (activeBattles ?? [])) {
      // Calculate each team's weekly score
      const [challengerMembers, challengedMembers] = await Promise.all([
        db.from('profiles').select('id').eq('team_id', battle.challenger_team_id),
        db.from('profiles').select('id').eq('team_id', battle.challenged_team_id),
      ])

      const cIds = (challengerMembers.data ?? []).map(m => m.id)
      const dIds = (challengedMembers.data ?? []).map(m => m.id)

      const [cScores, dScores] = await Promise.all([
        cIds.length > 0
          ? db.from('weekly_scores').select('total_score').eq('week_start', weekStart).in('user_id', cIds)
          : { data: [] },
        dIds.length > 0
          ? db.from('weekly_scores').select('total_score').eq('week_start', weekStart).in('user_id', dIds)
          : { data: [] },
      ])

      const challengerScore = (cScores.data ?? []).reduce((s: number, r: any) => s + (r.total_score ?? 0), 0)
      const challengedScore = (dScores.data ?? []).reduce((s: number, r: any) => s + (r.total_score ?? 0), 0)

      const winnerId = challengerScore > challengedScore
        ? battle.challenger_team_id
        : challengedScore > challengerScore
        ? battle.challenged_team_id
        : null // draw

      await db.from('team_challenges').update({
        status: 'completed',
        challenger_score: challengerScore,
        challenged_score: challengedScore,
        winner_team_id: winnerId,
      }).eq('id', battle.id)

      battlesResolved++
    }

    return new Response(JSON.stringify({
      week_start: weekStart,
      champion_user_id: champion.user_id,
      champion_score: champion.total_score,
      total_participants: scores.length,
      prize_assigned: !!weeklyPrize,
      team_battles_resolved: battlesResolved,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('weekly-champion error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

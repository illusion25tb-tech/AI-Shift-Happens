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

    return new Response(JSON.stringify({
      week_start: weekStart,
      champion_user_id: champion.user_id,
      champion_score: champion.total_score,
      total_participants: scores.length,
      prize_assigned: !!weeklyPrize,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('weekly-champion error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

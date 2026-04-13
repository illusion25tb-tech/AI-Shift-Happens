import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const tab = url.searchParams.get('tab') || 'weekly'
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const db = createClient(supabaseUrl, serviceKey)

    if (tab === 'weekly') {
      const now = new Date()
      const dow = now.getUTCDay()
      const diff = dow === 0 ? 6 : dow - 1
      const monday = new Date(now)
      monday.setUTCDate(monday.getUTCDate() - diff)
      const weekStart = monday.toISOString().split('T')[0]

      const { data } = await db.from('weekly_scores')
        .select('user_id, total_score, is_champion, profiles(display_name, avatar_url, level, current_streak)')
        .eq('week_start', weekStart)
        .order('total_score', { ascending: false })
        .limit(50)

      const entries = (data ?? []).map((row: any, i: number) => ({
        rank: i + 1, user_id: row.user_id,
        display_name: row.profiles?.display_name ?? '', avatar_url: row.profiles?.avatar_url ?? null,
        total_score: row.total_score, level: row.profiles?.level ?? 1,
        current_streak: row.profiles?.current_streak ?? 0, is_champion: row.is_champion ?? false,
      }))
      return new Response(JSON.stringify({ tab: 'weekly', week_start: weekStart, entries }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (tab === 'alltime') {
      const { data } = await db.from('profiles')
        .select('id, display_name, avatar_url, total_xp, level, current_streak')
        .order('total_xp', { ascending: false }).limit(50)

      const entries = (data ?? []).map((row: any, i: number) => ({
        rank: i + 1, user_id: row.id, display_name: row.display_name ?? '',
        avatar_url: row.avatar_url ?? null, total_score: row.total_xp,
        level: row.level ?? 1, current_streak: row.current_streak ?? 0, is_champion: false,
      }))
      return new Response(JSON.stringify({ tab: 'alltime', entries }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (tab === 'halloffame') {
      const { data } = await db.from('weekly_scores')
        .select('user_id, week_start, total_score, profiles(display_name, avatar_url, level)')
        .eq('is_champion', true).order('week_start', { ascending: false }).limit(20)

      const entries = (data ?? []).map((row: any, i: number) => ({
        rank: i + 1, user_id: row.user_id, display_name: row.profiles?.display_name ?? '',
        avatar_url: row.profiles?.avatar_url ?? null, total_score: row.total_score,
        level: row.profiles?.level ?? 1, current_streak: 0, is_champion: true,
      }))
      return new Response(JSON.stringify({ tab: 'halloffame', entries }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Invalid tab parameter' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('get-leaderboard error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

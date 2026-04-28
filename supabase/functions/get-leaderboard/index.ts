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
      // Aggregiert: pro User die Anzahl Wochen-/Monats-Siege + letzte 4 Wochen-Siege
      const [weekly, monthly] = await Promise.all([
        db.from('weekly_scores')
          .select('user_id, week_start, total_score, profiles(display_name, avatar_url, level)')
          .eq('is_champion', true).order('week_start', { ascending: false }),
        db.from('monthly_champions')
          .select('user_id, month_start, total_score, profiles(display_name, avatar_url, level)')
          .order('month_start', { ascending: false }),
      ])

      type Champion = {
        user_id: string
        display_name: string
        avatar_url: string | null
        level: number
        weekly_wins: number
        monthly_wins: number
        last_weekly_wins: string[]
        last_monthly_wins: string[]
        latest_win_date: string
      }
      const champs = new Map<string, Champion>()

      const ensure = (uid: string, profile: any): Champion => {
        let c = champs.get(uid)
        if (!c) {
          c = {
            user_id: uid,
            display_name: profile?.display_name ?? '',
            avatar_url: profile?.avatar_url ?? null,
            level: profile?.level ?? 1,
            weekly_wins: 0,
            monthly_wins: 0,
            last_weekly_wins: [],
            last_monthly_wins: [],
            latest_win_date: '',
          }
          champs.set(uid, c)
        }
        return c
      }

      for (const row of (weekly.data ?? []) as any[]) {
        const c = ensure(row.user_id, row.profiles)
        c.weekly_wins += 1
        if (c.last_weekly_wins.length < 4) c.last_weekly_wins.push(row.week_start)
        if (row.week_start > c.latest_win_date) c.latest_win_date = row.week_start
      }
      for (const row of (monthly.data ?? []) as any[]) {
        const c = ensure(row.user_id, row.profiles)
        c.monthly_wins += 1
        if (c.last_monthly_wins.length < 4) c.last_monthly_wins.push(row.month_start)
        if (row.month_start > c.latest_win_date) c.latest_win_date = row.month_start
      }

      const sorted = [...champs.values()]
        .sort((a, b) => {
          // Total wins (Monthly zaehlt doppelt — schwerer zu erreichen)
          const aw = a.weekly_wins + a.monthly_wins * 2
          const bw = b.weekly_wins + b.monthly_wins * 2
          if (aw !== bw) return bw - aw
          return b.latest_win_date.localeCompare(a.latest_win_date)
        })
        .slice(0, 50)
        .map((c, i) => ({ rank: i + 1, ...c }))

      return new Response(JSON.stringify({ tab: 'halloffame', entries: sorted }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (tab === 'company') {
      // Aggregate company scores: avg total_xp per company, min 3 members
      const { data } = await db.rpc('get_company_leaderboard')

      // If RPC doesn't exist, fall back to raw query via profiles
      if (data) {
        return new Response(JSON.stringify({ tab: 'company', entries: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Fallback: aggregate from profiles directly
      const { data: profiles } = await db.from('profiles')
        .select('company_name, total_xp, level')
        .not('company_name', 'is', null)

      const companyMap = new Map<string, { name: string, totalXp: number, count: number, maxLevel: number }>()
      for (const p of (profiles ?? [])) {
        if (!p.company_name) continue
        const key = p.company_name.trim().toLowerCase()
        const existing = companyMap.get(key)
        if (existing) {
          existing.totalXp += (p.total_xp ?? 0)
          existing.count += 1
          existing.maxLevel = Math.max(existing.maxLevel, p.level ?? 1)
        } else {
          companyMap.set(key, {
            name: p.company_name.trim(),
            totalXp: p.total_xp ?? 0,
            count: 1,
            maxLevel: p.level ?? 1,
          })
        }
      }

      const companies = [...companyMap.values()]
        .filter(c => c.count >= 3)
        .map(c => ({
          company_name: c.name,
          avg_xp: Math.round(c.totalXp / c.count),
          member_count: c.count,
          max_level: c.maxLevel,
        }))
        .sort((a, b) => b.avg_xp - a.avg_xp)
        .slice(0, 50)
        .map((c, i) => ({ rank: i + 1, ...c }))

      return new Response(JSON.stringify({ tab: 'company', entries: companies }),
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

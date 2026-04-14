import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonRes({ error: 'Missing authorization' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await anonClient.auth.getUser()
    if (authError || !user) return jsonRes({ error: 'Invalid token' }, 401)

    const db = createClient(supabaseUrl, serviceKey)
    const body = await req.json()
    const { action } = body as { action: string }

    // ─── CREATE TEAM ───
    if (action === 'create') {
      const { name } = body as { name: string }
      if (!name?.trim()) return jsonRes({ error: 'Team name required' }, 400)

      // Check user not already in a team
      const { data: profile } = await db.from('profiles').select('team_id').eq('id', user.id).single()
      if (profile?.team_id) return jsonRes({ error: 'Already in a team. Leave first.' }, 400)

      const { data: team, error: insertErr } = await db
        .from('teams')
        .insert({ name: name.trim(), captain_id: user.id })
        .select('id, invite_code')
        .single()

      if (insertErr) return jsonRes({ error: insertErr.message }, 500)

      // Join own team
      await db.from('profiles').update({ team_id: team.id }).eq('id', user.id)

      return jsonRes({ team_id: team.id, invite_code: team.invite_code })
    }

    // ─── JOIN TEAM ───
    if (action === 'join') {
      const { invite_code } = body as { invite_code: string }
      if (!invite_code?.trim()) return jsonRes({ error: 'Invite code required' }, 400)

      const { data: profile } = await db.from('profiles').select('team_id').eq('id', user.id).single()
      if (profile?.team_id) return jsonRes({ error: 'Already in a team. Leave first.' }, 400)

      const { data: team } = await db
        .from('teams')
        .select('id, name')
        .eq('invite_code', invite_code.trim().toLowerCase())
        .single()

      if (!team) return jsonRes({ error: 'Team not found' }, 404)

      await db.from('profiles').update({ team_id: team.id }).eq('id', user.id)

      return jsonRes({ team_id: team.id, team_name: team.name })
    }

    // ─── LEAVE TEAM ───
    if (action === 'leave') {
      await db.from('profiles').update({ team_id: null }).eq('id', user.id)
      return jsonRes({ ok: true })
    }

    // ─── GET MY TEAM ───
    if (action === 'my_team') {
      const { data: profile } = await db.from('profiles').select('team_id').eq('id', user.id).single()
      if (!profile?.team_id) return jsonRes({ team: null })

      const { data: team } = await db
        .from('teams')
        .select('id, name, invite_code, captain_id, created_at')
        .eq('id', profile.team_id)
        .single()

      if (!team) return jsonRes({ team: null })

      // Get members
      const { data: members } = await db
        .from('profiles')
        .select('id, display_name, level, total_xp, current_streak')
        .eq('team_id', team.id)
        .order('total_xp', { ascending: false })

      return jsonRes({
        team: {
          ...team,
          is_captain: team.captain_id === user.id,
          members: members ?? [],
          member_count: members?.length ?? 0,
        },
      })
    }

    // ─── TEAM LEADERBOARD ───
    if (action === 'leaderboard') {
      // Get current week
      const now = new Date()
      const dow = now.getUTCDay()
      const diff = dow === 0 ? 6 : dow - 1
      const monday = new Date(now)
      monday.setUTCDate(monday.getUTCDate() - diff)
      const weekStart = monday.toISOString().split('T')[0]

      // Get all teams with members who have weekly scores
      const { data: teams } = await db.from('teams').select('id, name')
      if (!teams || teams.length === 0) return jsonRes({ entries: [] })

      const entries = []
      for (const team of teams) {
        const { data: members } = await db
          .from('profiles')
          .select('id')
          .eq('team_id', team.id)

        if (!members || members.length < 2) continue

        const memberIds = members.map(m => m.id)
        const { data: scores } = await db
          .from('weekly_scores')
          .select('total_score')
          .eq('week_start', weekStart)
          .in('user_id', memberIds)

        const totalScore = (scores ?? []).reduce((sum, s) => sum + (s.total_score ?? 0), 0)

        entries.push({
          team_name: team.name,
          team_id: team.id,
          member_count: members.length,
          total_score: totalScore,
        })
      }

      entries.sort((a, b) => b.total_score - a.total_score)
      const ranked = entries.map((e, i) => ({ rank: i + 1, ...e }))

      return jsonRes({ entries: ranked, week_start: weekStart })
    }

    return jsonRes({ error: `Unknown action: ${action}` }, 400)

  } catch (err) {
    console.error('teams error:', err)
    return jsonRes({ error: 'Internal server error' }, 500)
  }
})

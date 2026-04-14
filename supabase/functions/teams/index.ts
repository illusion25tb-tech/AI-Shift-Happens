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

      const { data: profile } = await db.from('profiles').select('team_id').eq('id', user.id).single()
      if (profile?.team_id) return jsonRes({ error: 'Already in a team. Leave first.' }, 400)

      const { data: team, error: insertErr } = await db
        .from('teams')
        .insert({ name: name.trim(), captain_id: user.id })
        .select('id, invite_code')
        .single()

      if (insertErr) return jsonRes({ error: insertErr.message }, 500)

      // Join as captain
      await db.from('profiles').update({ team_id: team.id, team_role: 'captain' }).eq('id', user.id)

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

      // Join as regular member
      await db.from('profiles').update({ team_id: team.id, team_role: 'member' }).eq('id', user.id)

      return jsonRes({ team_id: team.id, team_name: team.name })
    }

    // ─── LEAVE TEAM ───
    if (action === 'leave') {
      const { data: profile } = await db.from('profiles').select('team_id, team_role').eq('id', user.id).single()
      if (!profile?.team_id) return jsonRes({ ok: true })

      // If captain leaves, promote first admin or oldest member
      if (profile.team_role === 'captain') {
        const { data: nextAdmin } = await db.from('profiles')
          .select('id')
          .eq('team_id', profile.team_id)
          .eq('team_role', 'admin')
          .neq('id', user.id)
          .limit(1)
          .single()

        if (nextAdmin) {
          await db.from('profiles').update({ team_role: 'captain' }).eq('id', nextAdmin.id)
          await db.from('teams').update({ captain_id: nextAdmin.id }).eq('id', profile.team_id)
        } else {
          // No admin — promote oldest member
          const { data: nextMember } = await db.from('profiles')
            .select('id')
            .eq('team_id', profile.team_id)
            .neq('id', user.id)
            .order('created_at', { ascending: true })
            .limit(1)
            .single()

          if (nextMember) {
            await db.from('profiles').update({ team_role: 'captain' }).eq('id', nextMember.id)
            await db.from('teams').update({ captain_id: nextMember.id }).eq('id', profile.team_id)
          } else {
            // Last member — delete team
            await db.from('teams').delete().eq('id', profile.team_id)
          }
        }
      }

      await db.from('profiles').update({ team_id: null, team_role: 'member' }).eq('id', user.id)
      return jsonRes({ ok: true })
    }

    // ─── PROMOTE TO ADMIN ───
    if (action === 'promote') {
      const { target_user_id } = body as { target_user_id: string }

      const { data: myProfile } = await db.from('profiles')
        .select('team_id, team_role').eq('id', user.id).single()

      if (!myProfile?.team_id || !['captain', 'admin'].includes(myProfile.team_role ?? '')) {
        return jsonRes({ error: 'Only captain or admin can promote' }, 403)
      }

      // Check target is in same team and is member
      const { data: target } = await db.from('profiles')
        .select('team_id, team_role').eq('id', target_user_id).single()

      if (target?.team_id !== myProfile.team_id) {
        return jsonRes({ error: 'User not in your team' }, 400)
      }
      if (target.team_role === 'captain') {
        return jsonRes({ error: 'Cannot change captain role' }, 400)
      }

      await db.from('profiles').update({ team_role: 'admin' }).eq('id', target_user_id)
      return jsonRes({ ok: true })
    }

    // ─── DEMOTE TO MEMBER ───
    if (action === 'demote') {
      const { target_user_id } = body as { target_user_id: string }

      const { data: myProfile } = await db.from('profiles')
        .select('team_id, team_role').eq('id', user.id).single()

      if (myProfile?.team_role !== 'captain') {
        return jsonRes({ error: 'Only captain can demote' }, 403)
      }

      const { data: target } = await db.from('profiles')
        .select('team_id, team_role').eq('id', target_user_id).single()

      if (target?.team_id !== myProfile.team_id || target.team_role === 'captain') {
        return jsonRes({ error: 'Invalid target' }, 400)
      }

      await db.from('profiles').update({ team_role: 'member' }).eq('id', target_user_id)
      return jsonRes({ ok: true })
    }

    // ─── KICK MEMBER ───
    if (action === 'kick') {
      const { target_user_id } = body as { target_user_id: string }

      const { data: myProfile } = await db.from('profiles')
        .select('team_id, team_role').eq('id', user.id).single()

      if (!myProfile?.team_id || !['captain', 'admin'].includes(myProfile.team_role ?? '')) {
        return jsonRes({ error: 'Only captain or admin can kick' }, 403)
      }

      const { data: target } = await db.from('profiles')
        .select('team_id, team_role').eq('id', target_user_id).single()

      if (target?.team_id !== myProfile.team_id) return jsonRes({ error: 'Not in your team' }, 400)
      if (target.team_role === 'captain') return jsonRes({ error: 'Cannot kick captain' }, 400)
      // Admins can only kick members, not other admins
      if (myProfile.team_role === 'admin' && target.team_role === 'admin') {
        return jsonRes({ error: 'Admin cannot kick another admin' }, 400)
      }

      await db.from('profiles').update({ team_id: null, team_role: 'member' }).eq('id', target_user_id)
      return jsonRes({ ok: true })
    }

    // ─── GET MY TEAM ───
    if (action === 'my_team') {
      const { data: profile } = await db.from('profiles')
        .select('team_id, team_role').eq('id', user.id).single()
      if (!profile?.team_id) return jsonRes({ team: null })

      const { data: team } = await db
        .from('teams')
        .select('id, name, invite_code, captain_id, created_at')
        .eq('id', profile.team_id)
        .single()

      if (!team) return jsonRes({ team: null })

      const myRole = profile.team_role ?? 'member'
      const canSeeCode = myRole === 'captain' || myRole === 'admin'

      // Get members with roles
      const { data: members } = await db
        .from('profiles')
        .select('id, display_name, level, total_xp, current_streak, team_role')
        .eq('team_id', team.id)
        .order('total_xp', { ascending: false })

      return jsonRes({
        team: {
          id: team.id,
          name: team.name,
          invite_code: canSeeCode ? team.invite_code : null,
          captain_id: team.captain_id,
          created_at: team.created_at,
          my_role: myRole,
          members: members ?? [],
          member_count: members?.length ?? 0,
        },
      })
    }

    // ─── TEAM LEADERBOARD ───
    if (action === 'leaderboard') {
      const now = new Date()
      const dow = now.getUTCDay()
      const diff = dow === 0 ? 6 : dow - 1
      const monday = new Date(now)
      monday.setUTCDate(monday.getUTCDate() - diff)
      const weekStart = monday.toISOString().split('T')[0]

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

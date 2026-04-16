import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const REFERRAL_XP = 200

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
    const { invite_code } = body as { invite_code: string }

    if (!invite_code?.trim()) {
      return new Response(JSON.stringify({ error: 'Invite code required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Check if user already used a referral
    const { data: myProfile } = await db.from('profiles')
      .select('invited_by').eq('id', user.id).single()

    if (myProfile?.invited_by) {
      return new Response(JSON.stringify({ error: 'Already used a referral' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Find referrer by invite_code
    const { data: referrer } = await db.from('profiles')
      .select('id, total_xp, invite_code')
      .eq('invite_code', invite_code.trim())
      .single()

    if (!referrer) {
      return new Response(JSON.stringify({ error: 'Invalid invite code' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (referrer.id === user.id) {
      return new Response(JSON.stringify({ error: 'Cannot refer yourself' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Grant XP to referrer
    await db.from('profiles').update({
      total_xp: (referrer.total_xp ?? 0) + REFERRAL_XP,
    }).eq('id', referrer.id)

    // Mark user as referred
    await db.from('profiles').update({
      invited_by: referrer.id,
    }).eq('id', user.id)

    return new Response(JSON.stringify({
      ok: true,
      referrer_id: referrer.id,
      xp_granted: REFERRAL_XP,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('claim-referral error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

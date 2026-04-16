import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const db = createClient(supabaseUrl, serviceKey)

    const today = new Date().toISOString().split('T')[0]

    // Active sponsors
    const { data: sponsors } = await db.from('sponsors')
      .select('id, name, logo_url, website_url, description, tier')
      .eq('is_active', true)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order('tier', { ascending: true })

    // Current week's prizes
    const now = new Date()
    const dow = now.getUTCDay()
    const diff = dow === 0 ? 6 : dow - 1
    const monday = new Date(now)
    monday.setUTCDate(monday.getUTCDate() - diff)
    const weekStart = monday.toISOString().split('T')[0]

    const { data: weeklyPrizes } = await db.from('prizes')
      .select('id, title, description, image_url, value_eur, sponsors(name, logo_url), profiles:winner_id(display_name)')
      .eq('prize_type', 'weekly')
      .eq('week_start', weekStart)

    // Current month's prizes
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const { data: monthlyPrizes } = await db.from('prizes')
      .select('id, title, description, image_url, value_eur, sponsors(name, logo_url), profiles:winner_id(display_name)')
      .eq('prize_type', 'monthly')
      .eq('month_start', monthStart)

    return new Response(JSON.stringify({
      sponsors: sponsors ?? [],
      weekly_prizes: weeklyPrizes ?? [],
      monthly_prizes: monthlyPrizes ?? [],
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('get-sponsors error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

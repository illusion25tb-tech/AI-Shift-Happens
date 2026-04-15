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

    const [players, questions, attempts] = await Promise.all([
      db.from('profiles').select('*', { count: 'exact', head: true }),
      db.from('questions').select('*', { count: 'exact', head: true }).eq('is_active', true),
      db.from('quiz_attempts').select('*', { count: 'exact', head: true }),
    ])

    return new Response(JSON.stringify({
      players: players.count ?? 0,
      questions: questions.count ?? 0,
      quizzes_played: attempts.count ?? 0,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('get-public-stats error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { verifyCronOrServiceRole } from '../_shared/auth.ts'

const BATCH_SIZE = 8

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!verifyCronOrServiceRole(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const db = createClient(supabaseUrl, serviceKey)

    // Find imbalanced questions
    const { data: allQ } = await db.from('questions')
      .select('id, locale, scenario_text, options')
      .eq('is_active', true)

    if (!allQ) {
      return new Response(JSON.stringify({ fixed: 0, remaining: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const imbalanced = allQ.filter(q => {
      const opts = q.options as Array<{ text: string; score: number; feedbackText: string }>
      if (opts.length !== 3) return false
      const correct = opts.find(o => o.score === 100)
      const wrong = opts.filter(o => o.score !== 100)
      if (!correct || wrong.length === 0) return false
      const cl = correct.text.length
      const awl = wrong.reduce((s, o) => s + o.text.length, 0) / wrong.length
      return awl > 0 && cl > awl * 1.5
    })

    if (imbalanced.length === 0) {
      return new Response(JSON.stringify({ fixed: 0, remaining: 0, message: 'All balanced' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const batch = imbalanced.slice(0, BATCH_SIZE)

    const prompt = `Rewrite the answer options for these ${batch.length} quiz questions.
RULES:
- Keep the EXACT same meaning and score for each option
- Keep feedbackText unchanged
- Make ALL 3 options approximately the same length (15-25 words each)
- If correct answer (score=100) is too long, shorten while keeping the key insight
- If wrong answers are too short, add plausible detail to make them equally convincing
- Maintain the same language (de or en), use correct German umlauts

Input:
${JSON.stringify(batch.map(q => ({ id: q.id, locale: q.locale, options: q.options })))}

Return JSON array with same structure but rebalanced option texts. ONLY valid JSON, no markdown fences.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Claude API error', status: response.status }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const result = await response.json()
    const text = result.content?.[0]?.text ?? ''

    let parsed: Array<{ id: string; options: Array<{ text: string; score: number; feedbackText: string }> }>
    try {
      parsed = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
    } catch {
      return new Response(JSON.stringify({ error: 'JSON parse error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    let fixed = 0
    for (const item of parsed) {
      if (!item.id || !item.options || item.options.length !== 3) continue
      const orig = batch.find(q => q.id === item.id)
      if (!orig) continue

      const origScores = (orig.options as any[]).map((o: any) => o.score).sort()
      const newScores = item.options.map(o => o.score).sort()
      if (JSON.stringify(origScores) !== JSON.stringify(newScores)) continue

      await db.from('questions').update({ options: item.options }).eq('id', item.id)
      fixed++
    }

    return new Response(JSON.stringify({
      fixed,
      remaining: imbalanced.length - fixed,
      total_imbalanced: imbalanced.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('rebalance-cron error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

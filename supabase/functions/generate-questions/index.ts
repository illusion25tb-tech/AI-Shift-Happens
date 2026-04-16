import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { verifyAdmin, verifyCronOrServiceRole } from '../_shared/auth.ts'

const CATEGORIES = [
  'prompt-architecture', 'creativity-ideation', 'critical-thinking',
  'efficiency-analysis', 'privacy-ethics', 'workflow-integration',
  'automation-agents', 'knowledge-research', 'change-collaboration',
  'quality-measurement',
]

const MIN_POOL_SIZE = 50
const BATCH_SIZE = 10

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // SECURITY: Only cron/service-role or admin users can generate questions
    const isCron = await verifyCronOrServiceRole(req)
    const isAdmin = isCron ? true : await verifyAdmin(req)
    if (!isAdmin && !isCron) {
      return new Response(JSON.stringify({ error: 'Unauthorized — admin or cron access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const db = createClient(supabaseUrl, serviceKey)
    const results: Record<string, { before: number; generated: number }> = {}

    // Support single category mode via POST body
    let targetCategories = CATEGORIES
    try {
      const body = await req.json()
      if (body?.category && CATEGORIES.includes(body.category)) {
        targetCategories = [body.category]
      }
    } catch { /* no body = all categories */ }

    for (const category of targetCategories) {
      // Count active questions per locale
      const { count: deCount } = await db.from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('category', category).eq('locale', 'de').eq('is_active', true)

      const { count: enCount } = await db.from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('category', category).eq('locale', 'en').eq('is_active', true)

      const minCount = Math.min(deCount ?? 0, enCount ?? 0)
      results[category] = { before: minCount, generated: 0 }

      if (minCount >= MIN_POOL_SIZE) continue

      const needed = MIN_POOL_SIZE - minCount
      const batchCount = Math.min(needed, BATCH_SIZE)

      // Get existing pair_ids to find next ID
      const { data: existingIds } = await db.from('questions')
        .select('pair_id')
        .eq('category', category)
        .not('pair_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)

      const prefix = category.split('-').map(w => w[0].toUpperCase()).join('')
      const lastNum = existingIds?.[0]?.pair_id
        ? parseInt(existingIds[0].pair_id.replace(/[^0-9]/g, '')) || 0
        : 0
      const startNum = lastNum + 1

      // Call Claude API to generate paired questions
      const prompt = `Generate ${batchCount} realistic AI mindset quiz questions for the category "${category}" (office/business context).

Each question must have:
- scenarioText: A realistic office scenario (2-3 sentences)
- mindsetTip: A short learning tip (1 sentence)
- options: Exactly 3 options:
  - One with score 100 (AI best practice)
  - One with score 0 (traditional/inefficient approach)
  - One with score -100 (dangerous: data privacy risk, hallucination trust, etc.)
- Each option has: text, score, feedbackText

CRITICAL: All 3 option texts MUST be approximately the same length (15-25 words each).
Do NOT make the correct answer longer than the others — this is a common quiz design flaw.
The wrong answers should be equally detailed and plausible-sounding.

Generate BOTH German (de) and English (en) versions of each question as pairs.
German text must use correct umlauts (ä, ö, ü, ß).

Return a JSON array of objects, each with:
{
  "pair_id": "${prefix}-${String(startNum).padStart(3, '0')}" (incrementing),
  "de": { "scenarioText": "...", "mindsetTip": "...", "options": [...] },
  "en": { "scenarioText": "...", "mindsetTip": "...", "options": [...] }
}

Return ONLY the JSON array, no markdown fences.`

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
        console.error(`Claude API error for ${category}:`, await response.text())
        continue
      }

      const result = await response.json()
      const text = result.content?.[0]?.text ?? ''

      let pairs: Array<{
        pair_id: string
        de: { scenarioText: string; mindsetTip: string; options: Array<{ text: string; score: number; feedbackText: string }> }
        en: { scenarioText: string; mindsetTip: string; options: Array<{ text: string; score: number; feedbackText: string }> }
      }>

      try {
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        pairs = JSON.parse(cleaned)
      } catch {
        console.error(`JSON parse error for ${category}`)
        continue
      }

      // Validate and insert
      let generated = 0
      for (const pair of pairs) {
        if (!pair.de?.options || !pair.en?.options) continue
        if (pair.de.options.length !== 3 || pair.en.options.length !== 3) continue

        const deScores = pair.de.options.map(o => o.score).sort((a, b) => a - b)
        const enScores = pair.en.options.map(o => o.score).sort((a, b) => a - b)
        if (JSON.stringify(deScores) !== '[-100,0,100]') continue
        if (JSON.stringify(enScores) !== '[-100,0,100]') continue

        const deId = `DE-${prefix}-${pair.pair_id.split('-').pop()}`
        const enId = `EN-${prefix}-${pair.pair_id.split('-').pop()}`

        await db.from('questions').upsert([
          {
            external_id: deId, locale: 'de', pair_id: pair.pair_id, category,
            scenario_text: pair.de.scenarioText, mindset_tip: pair.de.mindsetTip,
            options: pair.de.options, difficulty: 1, is_active: true, generated_by: 'auto',
          },
          {
            external_id: enId, locale: 'en', pair_id: pair.pair_id, category,
            scenario_text: pair.en.scenarioText, mindset_tip: pair.en.mindsetTip,
            options: pair.en.options, difficulty: 1, is_active: true, generated_by: 'auto',
          },
        ], { onConflict: 'external_id' })

        generated++
      }

      results[category].generated = generated
    }

    // Assemble daily quizzes for next week (Mon-Fri)
    const today = new Date()
    const nextMonday = new Date(today)
    const dow = nextMonday.getUTCDay()
    const daysUntilMonday = dow === 0 ? 1 : 8 - dow
    nextMonday.setUTCDate(nextMonday.getUTCDate() + daysUntilMonday)

    const assembledDays: string[] = []

    for (let d = 0; d < 5; d++) {
      const quizDate = new Date(nextMonday)
      quizDate.setUTCDate(quizDate.getUTCDate() + d)
      const dateStr = quizDate.toISOString().split('T')[0]

      // Check if already exists
      const { data: existing } = await db.from('daily_quizzes')
        .select('id').eq('quiz_date', dateStr).eq('locale', 'de').maybeSingle()
      if (existing) continue

      // Pick 3 categories (rotate based on day)
      const catOffset = d * 3
      const dayCats = [
        CATEGORIES[(catOffset) % CATEGORIES.length],
        CATEGORIES[(catOffset + 1) % CATEGORIES.length],
        CATEGORIES[(catOffset + 2) % CATEGORIES.length],
      ]
      const bonusCat = CATEGORIES[(catOffset + 3) % CATEGORIES.length]

      // For each locale, pick random unused questions
      for (const locale of ['de', 'en'] as const) {
        const questionIds: string[] = []

        for (const cat of dayCats) {
          const { data: q } = await db.from('questions')
            .select('id')
            .eq('category', cat).eq('locale', locale).eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
          if (q?.[0]) questionIds.push(q[0].id)
        }

        const { data: bonusQ } = await db.from('questions')
          .select('id')
          .eq('category', bonusCat).eq('locale', locale).eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)

        if (questionIds.length === 3 && bonusQ?.[0]) {
          await db.from('daily_quizzes').insert({
            quiz_date: dateStr, locale,
            question_ids: questionIds,
            bonus_question_id: bonusQ[0].id,
          })
        }
      }

      assembledDays.push(dateStr)
    }

    return new Response(JSON.stringify({ results, assembled_days: assembledDays }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('generate-questions error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

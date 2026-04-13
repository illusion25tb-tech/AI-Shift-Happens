import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const CATEGORY_MAP: Record<string, string> = {
  'Prompt-Architektur': 'prompt-architecture',
  'Kreativität & Ideation': 'creativity-ideation',
  'Kritisches Denken & Validierung': 'critical-thinking',
  'Effizienz & Analyse': 'efficiency-analysis',
  'Datenschutz & Ethik': 'privacy-ethics',
  'Workflow-Integration': 'workflow-integration',
  'Automatisierung & Agenten': 'automation-agents',
  'Wissensmanagement & Recherche': 'knowledge-research',
  'Change & Zusammenarbeit': 'change-collaboration',
  'Messbarkeit & Qualität': 'quality-measurement',
}

interface OldQuestion {
  id: string
  category: string
  scenarioText: string
  mindsetTip: string
  options: Array<{ text: string; score: number; feedbackText: string }>
}

async function migrate() {
  const filePath = process.env.QUESTIONS_FILE ?? '/tmp/questions-original.json'
  const raw = readFileSync(filePath, 'utf-8')
  const questions: OldQuestion[] = JSON.parse(raw)
  console.log(`Migrating ${questions.length} questions...`)

  let inserted = 0, skipped = 0

  for (const q of questions) {
    const category = CATEGORY_MAP[q.category.trim()]
    if (!category) {
      console.warn(`Unknown category: "${q.category}" — skipping ${q.id}`)
      skipped++
      continue
    }

    const options = q.options.map(o => ({
      text: o.text,
      score: o.score === -20 ? -100 : o.score,
      feedbackText: o.feedbackText,
    }))

    const pairId = q.id.startsWith('DE-') ? q.id.replace('DE-', '') : `legacy-${q.id}`
    const externalId = q.id.startsWith('DE-') ? q.id : `DE-LEGACY-${q.id}`

    const { error } = await db.from('questions').upsert({
      external_id: externalId,
      locale: 'de',
      pair_id: pairId,
      category,
      scenario_text: q.scenarioText,
      mindset_tip: q.mindsetTip,
      options,
      difficulty: 1,
      is_active: true,
      generated_by: 'migration',
    }, { onConflict: 'external_id' })

    if (error) { console.error(`Error ${q.id}:`, error.message); skipped++ }
    else inserted++
  }

  console.log(`Done. Inserted: ${inserted}, Skipped: ${skipped}`)
}

migrate().catch(console.error)

# AI-Shift Happens — Plan 4: Auto-Generation + Deployment

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the original question pool, build a Claude API auto-generation pipeline for bilingual questions, add cron jobs for daily quiz assembly + weekly champion, and deploy the app to Strato via GitHub Actions.

**Architecture:** Two new Supabase Edge Functions (`generate-questions` and `weekly-champion`) triggered by Supabase scheduled cron. A migration script converts the original 150 DE questions and generates EN twins via Claude API. GitHub Actions workflow builds the Vite SPA and SFTPs to Strato at `tbai.com.de/mindset-shift/`.

**Tech Stack:** Supabase Edge Functions (Deno), Claude API (@anthropic-ai/sdk), GitHub Actions, lftp (SFTP), Vite build

**Spec:** `docs/superpowers/specs/2026-04-12-ai-shift-happens-design.md` — Sections 7.3, 8.4, 8.5, 11

**Depends on:** Plan 1 + Plan 2 complete

---

## File Structure

```
scripts/
├── migrate-questions.ts         # One-time: migrate original questions.de.json → Supabase
supabase/
├── functions/
│   ├── generate-questions/
│   │   └── index.ts             # Cron: generate new bilingual question pairs via Claude API
│   └── weekly-champion/
│       └── index.ts             # Cron: calculate weekly rankings + award champion
.github/
└── workflows/
    └── deploy.yml               # Build + SFTP to Strato
```

---

### Task 1: Migrate Original Question Pool

**Files:**
- Create: `scripts/migrate-questions.ts`

- [ ] **Step 1: Fetch the original questions.de.json from GitHub**

```bash
curl -s "https://raw.githubusercontent.com/illusion25tb-tech/Shift-Happens/main/public/questions.de.json" -o /tmp/questions-original.json
python -c "import json; d=json.load(open('/tmp/questions-original.json')); print(f'{len(d)} questions')"
```

- [ ] **Step 2: Create migration script**

`scripts/migrate-questions.ts` — a Node/tsx script that:
1. Reads the original JSON
2. Maps old categories to new internal IDs
3. Adjusts scores from -20 to -100
4. Generates pair_ids from the old IDs
5. Inserts into Supabase via REST API

```ts
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
  const raw = readFileSync('/tmp/questions-original.json', 'utf-8')
  const questions: OldQuestion[] = JSON.parse(raw)

  console.log(`Migrating ${questions.length} questions...`)

  let inserted = 0
  let skipped = 0

  for (const q of questions) {
    const category = CATEGORY_MAP[q.category.trim()]
    if (!category) {
      console.warn(`Unknown category: "${q.category}" — skipping ${q.id}`)
      skipped++
      continue
    }

    // Adjust scores: -20 → -100
    const options = q.options.map(o => ({
      text: o.text,
      score: o.score === -20 ? -100 : o.score,
      feedbackText: o.feedbackText,
    }))

    // Generate pair_id from old ID (e.g., "DE-PA-001" → "PA-001", "q1" → "legacy-q1")
    const pairId = q.id.startsWith('DE-')
      ? q.id.replace('DE-', '')
      : `legacy-${q.id}`

    const externalId = q.id.startsWith('DE-') ? q.id : `DE-${category.toUpperCase().slice(0, 2)}-${q.id}`

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

    if (error) {
      console.error(`Error inserting ${q.id}:`, error.message)
      skipped++
    } else {
      inserted++
    }
  }

  console.log(`Done. Inserted: ${inserted}, Skipped: ${skipped}`)
}

migrate().catch(console.error)
```

- [ ] **Step 3: Run migration**

```bash
cd C:/Users/illum/CLAUDE/projects/shift-happens
export SUPABASE_URL=https://amhfxaqolholacanqyas.supabase.co
export SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtaGZ4YXFvbGhvbGFjYW5xeWFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ5NTc5NiwiZXhwIjoyMDg5MDcxNzk2fQ.R6BmGuHqpTOtjbC8S6Qh2u3RI5FIN9IH4iMOrZMTXtQ
npx tsx scripts/migrate-questions.ts
```

- [ ] **Step 4: Verify**

```bash
export SUPABASE_ACCESS_TOKEN=sbp_414c6d9917f03c56b9d02e55e0e36e66f7fdb0be
curl -s -X POST "https://api.supabase.com/v1/projects/amhfxaqolholacanqyas/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"SELECT count(*) as cnt, locale, category FROM public.questions GROUP BY locale, category ORDER BY locale, category"}'
```

Expected: ~150 DE questions across 10 categories.

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate-questions.ts
git commit -m "feat: add question migration script (original pool → Supabase)"
```

---

### Task 2: generate-questions Edge Function (Claude API)

**Files:**
- Create: `supabase/functions/generate-questions/index.ts`

- [ ] **Step 1: Create the Edge Function**

`supabase/functions/generate-questions/index.ts`:
```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const db = createClient(supabaseUrl, serviceKey)
    const results: Record<string, { before: number; generated: number }> = {}

    for (const category of CATEGORIES) {
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
```

- [ ] **Step 2: Set ANTHROPIC_API_KEY as Supabase secret**

```bash
export SUPABASE_ACCESS_TOKEN=sbp_414c6d9917f03c56b9d02e55e0e36e66f7fdb0be
echo "ANTHROPIC_API_KEY" | supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref amhfxaqolholacanqyas
```

NOTE: User must provide their Anthropic API key.

- [ ] **Step 3: Deploy**

```bash
export SUPABASE_ACCESS_TOKEN=sbp_414c6d9917f03c56b9d02e55e0e36e66f7fdb0be
supabase functions deploy generate-questions --project-ref amhfxaqolholacanqyas --no-verify-jwt
```

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/generate-questions/index.ts
git commit -m "feat: add generate-questions Edge Function with Claude API bilingual generation"
```

---

### Task 3: weekly-champion Edge Function

**Files:**
- Create: `supabase/functions/weekly-champion/index.ts`

- [ ] **Step 1: Create the Edge Function**

`supabase/functions/weekly-champion/index.ts`:
```ts
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

    // Get last week's Monday
    const today = new Date()
    const dow = today.getUTCDay()
    const lastMonday = new Date(today)
    lastMonday.setUTCDate(lastMonday.getUTCDate() - (dow === 0 ? 6 : dow - 1) - 7)
    const weekStart = lastMonday.toISOString().split('T')[0]

    // Get all scores for last week
    const { data: scores } = await db.from('weekly_scores')
      .select('id, user_id, total_score')
      .eq('week_start', weekStart)
      .order('total_score', { ascending: false })

    if (!scores || scores.length === 0) {
      return new Response(JSON.stringify({ message: 'No scores for last week', week_start: weekStart }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Assign ranks
    for (let i = 0; i < scores.length; i++) {
      await db.from('weekly_scores').update({
        rank: i + 1,
        is_champion: i === 0,
      }).eq('id', scores[i].id)
    }

    // Award badges to champion
    const champion = scores[0]

    // weekly_champion badge
    const { data: existingBadge } = await db.from('user_badges')
      .select('id').eq('user_id', champion.user_id).eq('badge_type', 'weekly_champion').maybeSingle()

    if (!existingBadge) {
      await db.from('user_badges').insert({
        user_id: champion.user_id,
        badge_type: 'weekly_champion',
      })
    }

    // Check serial_winner (3x champion)
    const { count: championCount } = await db.from('weekly_scores')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', champion.user_id)
      .eq('is_champion', true)

    if ((championCount ?? 0) >= 3) {
      const { data: serialBadge } = await db.from('user_badges')
        .select('id').eq('user_id', champion.user_id).eq('badge_type', 'serial_winner').maybeSingle()
      if (!serialBadge) {
        await db.from('user_badges').insert({
          user_id: champion.user_id,
          badge_type: 'serial_winner',
        })
      }
    }

    return new Response(JSON.stringify({
      week_start: weekStart,
      champion_user_id: champion.user_id,
      champion_score: champion.total_score,
      total_participants: scores.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('weekly-champion error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
```

- [ ] **Step 2: Deploy**

```bash
export SUPABASE_ACCESS_TOKEN=sbp_414c6d9917f03c56b9d02e55e0e36e66f7fdb0be
supabase functions deploy weekly-champion --project-ref amhfxaqolholacanqyas --no-verify-jwt
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/weekly-champion/index.ts
git commit -m "feat: add weekly-champion Edge Function (rankings, badges)"
```

---

### Task 4: Supabase Cron Jobs

- [ ] **Step 1: Create cron job for generate-questions (Sunday 23:00 UTC)**

Run via Supabase Management API:
```bash
export SUPABASE_ACCESS_TOKEN=sbp_414c6d9917f03c56b9d02e55e0e36e66f7fdb0be
curl -s -X POST "https://api.supabase.com/v1/projects/amhfxaqolholacanqyas/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"SELECT cron.schedule('\''generate-questions-weekly'\'', '\''0 23 * * 0'\'', $$SELECT net.http_post(url:='\''https://amhfxaqolholacanqyas.supabase.co/functions/v1/generate-questions'\'', headers:='\''{\"Authorization\": \"Bearer SERVICE_ROLE_KEY\", \"Content-Type\": \"application/json\"}'\'')$$);"}'
```

NOTE: This requires `pg_cron` and `pg_net` extensions. If not available, configure cron via Supabase Dashboard → Database → Extensions → pg_cron, then add the schedule in the SQL editor.

- [ ] **Step 2: Create cron job for weekly-champion (Monday 00:01 UTC)**

Same approach:
```sql
SELECT cron.schedule('weekly-champion', '1 0 * * 1',
  $$SELECT net.http_post(
    url:='https://amhfxaqolholacanqyas.supabase.co/functions/v1/weekly-champion',
    headers:='{"Authorization": "Bearer SERVICE_ROLE_KEY", "Content-Type": "application/json"}'
  )$$
);
```

- [ ] **Step 3: Verify cron jobs are scheduled**

```sql
SELECT * FROM cron.job;
```

---

### Task 5: GitHub Actions Deploy Workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create workflow file**

`.github/workflows/deploy.yml`:
```yaml
name: Build & Deploy to Strato

on:
  push:
    branches: [master]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: TypeScript check
        run: npx tsc --noEmit

      - name: Build
        run: npx vite build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Deploy via SFTP
        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.STRATO_HOST }}
          username: ${{ secrets.STRATO_USER }}
          password: ${{ secrets.STRATO_PASSWORD }}
          local-dir: ./dist/
          server-dir: ./mindset-shift/
          protocol: ftps
```

- [ ] **Step 2: Set GitHub Secrets**

Go to https://github.com/illusion25tb-tech/AI-Shift-Happens/settings/secrets/actions and add:
- `VITE_SUPABASE_URL` = `https://amhfxaqolholacanqyas.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = the anon key
- `STRATO_HOST` = Strato FTP hostname
- `STRATO_USER` = Strato FTP username
- `STRATO_PASSWORD` = Strato FTP password

- [ ] **Step 3: Commit and trigger first deploy**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: add GitHub Actions deploy workflow (build + SFTP to Strato)"
git push origin master
```

The push triggers the workflow automatically.

- [ ] **Step 4: Verify deployment**

Check https://github.com/illusion25tb-tech/AI-Shift-Happens/actions for workflow status.
Once green, verify: `https://tbai.com.de/mindset-shift/` loads the app.

---

### Task 6: Deploy All Edge Functions

- [ ] **Step 1: Deploy all 6 Edge Functions**

```bash
export SUPABASE_ACCESS_TOKEN=sbp_414c6d9917f03c56b9d02e55e0e36e66f7fdb0be
for fn in get-daily-quiz submit-answer finish-daily get-leaderboard generate-questions weekly-champion; do
  echo "Deploying $fn..."
  supabase functions deploy $fn --project-ref amhfxaqolholacanqyas --no-verify-jwt
done
```

- [ ] **Step 2: Verify all functions are active**

```bash
supabase functions list --project-ref amhfxaqolholacanqyas
```

Expected: 6 functions, all ACTIVE.

---

### Task 7: Seed Daily Quizzes for This Week + Test

- [ ] **Step 1: Insert daily quizzes for remaining weekdays**

Run via Supabase Management API — create daily quizzes for the rest of this week using existing questions.

- [ ] **Step 2: Full smoke test**

1. Open `https://tbai.com.de/mindset-shift/` (or localhost)
2. Login → Dashboard shows streak, level, daily quiz card
3. Play daily quiz → 4 questions with feedback → result with XP + badges
4. Check leaderboard → see yourself ranked
5. Check profile → badges, stats, language toggle
6. Verify auto-generation by invoking: `curl -X POST https://amhfxaqolholacanqyas.supabase.co/functions/v1/generate-questions`

- [ ] **Step 3: Final commit + push**

```bash
git add -A
git commit -m "feat: Plan 4 complete — auto-generation, cron jobs, deployment"
git push origin master
```

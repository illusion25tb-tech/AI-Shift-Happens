# AI-Shift Happens — Plan 2: Gamification + Leaderboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add XP/Level progression, daily streaks, 12 badges, weekly leaderboard with champion system, and a rich dashboard — transforming the quiz from a one-shot tool into an addictive daily habit.

**Architecture:** Extend existing Supabase Edge Functions to update XP/streaks/badges after each quiz. New `finish-daily` Edge Function persists attempt + updates profile + checks badges + updates weekly score. Frontend gets new pages (Leaderboard, Profile) and a rich Dashboard with streak, level bar, and quick nav.

**Tech Stack:** Same as Plan 1 (React 19, Vite, TypeScript, Tailwind CSS 4, Framer Motion, Supabase Edge Functions)

**Spec:** `docs/superpowers/specs/2026-04-12-ai-shift-happens-design.md` — Sections 3 (Gamification), 6 (Data Model)

**Depends on:** Plan 1 complete (auth, quiz flow, scoring, DB schema all exist)

---

## File Structure (new/modified files only)

```
src/
├── lib/
│   ├── gamification.ts          # XP, level, streak, badge logic (pure functions)
│   └── constants.ts             # Add BADGES, STREAK_XP_MULTIPLIERS
├── hooks/
│   ├── useProfile.ts            # Profile data + refresh (replaces profile in useAuth)
│   ├── useLeaderboard.ts        # Fetch weekly/all-time/hall-of-fame data
│   └── useQuiz.ts               # Modify: call finish-daily after last question
├── components/
│   ├── StreakBar.tsx             # Flame icon, streak count, weekday dots
│   ├── LevelBar.tsx             # Emoji, title, XP progress bar
│   ├── BadgeGrid.tsx            # Display earned + locked badges
│   ├── BadgeUnlock.tsx          # Animated badge unlock overlay
│   ├── LeaderboardTable.tsx     # Ranked list with podium
│   ├── ChampionBanner.tsx       # Monday champion announcement
│   └── WeekdayDots.tsx          # Mo-Fr dots showing played days
├── pages/
│   ├── DashboardPage.tsx        # Rewrite: streak, level, daily card, quick nav
│   ├── LeaderboardPage.tsx      # New: weekly/all-time/hall-of-fame tabs
│   ├── ProfilePage.tsx          # New: stats, badges, settings
│   └── DailyQuizPage.tsx        # Modify: show badge unlocks on result
├── types/
│   └── index.ts                 # Add Badge, WeeklyScore, LeaderboardEntry types
supabase/
├── functions/
│   ├── finish-daily/index.ts    # New: persist attempt, update XP/streak/badges/weekly
│   └── get-leaderboard/index.ts # New: fetch ranked leaderboard data
├── migrations/
│   └── 002_gamification.sql     # Indexes, views for leaderboard queries
```

---

### Task 1: Gamification Types + Constants

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/constants.ts`

- [ ] **Step 1: Add new types to `src/types/index.ts`**

Append after the existing `GameState` type:

```ts
export interface Badge {
  type: string
  emoji: string
  title: { de: string; en: string }
  description: { de: string; en: string }
}

export interface UserBadge {
  badge_type: string
  earned_at: string
}

export interface WeeklyScore {
  user_id: string
  display_name: string
  avatar_url: string | null
  week_start: string
  total_score: number
  rank: number
  is_champion: boolean
  level: number
  current_streak: number
}

export interface LeaderboardEntry {
  rank: number
  user_id: string
  display_name: string
  avatar_url: string | null
  total_score: number
  level: number
  current_streak: number
  is_champion: boolean
}
```

- [ ] **Step 2: Add badge definitions and streak XP multipliers to `src/lib/constants.ts`**

Append after existing constants:

```ts
export const BADGES: Badge[] = [
  { type: 'perfect_round', emoji: '🎯', title: { de: 'Perfektionist', en: 'Perfectionist' }, description: { de: 'Erste perfekte Daily-Runde (4/4 richtig)', en: 'First perfect daily round (4/4 correct)' } },
  { type: 'speed_demon', emoji: '⚡', title: { de: 'Speed Demon', en: 'Speed Demon' }, description: { de: '3 Fragen in unter 15 Sekunden richtig', en: '3 questions correct in under 15 seconds' } },
  { type: 'universalist', emoji: '🧩', title: { de: 'Universalist', en: 'Universalist' }, description: { de: 'Alle 10 Kategorien mindestens 1× gespielt', en: 'All 10 categories played at least once' } },
  { type: 'meister', emoji: '🎓', title: { de: 'Meister', en: 'Master' }, description: { de: '10× hintereinander 100 Pts in einer Kategorie', en: '10 consecutive 100pt answers in one category' } },
  { type: 'streak_7', emoji: '🔥', title: { de: 'Auf Feuer', en: 'On Fire' }, description: { de: '7-Tage-Streak', en: '7-day streak' } },
  { type: 'streak_30', emoji: '🌋', title: { de: 'Unaufhaltsam', en: 'Unstoppable' }, description: { de: '30-Tage-Streak', en: '30-day streak' } },
  { type: 'streak_100', emoji: '💎', title: { de: 'Diamant', en: 'Diamond' }, description: { de: '100-Tage-Streak', en: '100-day streak' } },
  { type: 'early_bird', emoji: '🌅', title: { de: 'Frühaufsteher', en: 'Early Bird' }, description: { de: '5× Daily Quiz vor 8:00 Uhr', en: '5× Daily Quiz before 8:00 AM' } },
  { type: 'duelist', emoji: '⚔️', title: { de: 'Duellant', en: 'Duelist' }, description: { de: 'Erste Challenge gewonnen', en: 'First challenge won' } },
  { type: 'recruiter', emoji: '📣', title: { de: 'Recruiter Gold', en: 'Recruiter Gold' }, description: { de: '5 Kollegen eingeladen', en: '5 colleagues invited' } },
  { type: 'weekly_champion', emoji: '🏅', title: { de: 'Wochen-Champion', en: 'Weekly Champion' }, description: { de: '1× Platz 1 im Wochen-Ranking', en: '1× rank #1 in weekly ranking' } },
  { type: 'serial_winner', emoji: '👑', title: { de: 'Seriensieger', en: 'Serial Winner' }, description: { de: '3× Wochen-Champion', en: '3× weekly champion' } },
]

import type { Badge } from '../types'

export const STREAK_XP_MULTIPLIERS = [
  { minDays: 0, multi: 1.0 },
  { minDays: 5, multi: 1.25 },
  { minDays: 10, multi: 1.5 },
  { minDays: 20, multi: 2.0 },
] as const
```

- [ ] **Step 3: Add import for Badge type at top of constants.ts**

Move `import type { Badge } from '../types'` to the top of the file (before the BADGES array).

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/lib/constants.ts
git commit -m "feat: add gamification types, badge definitions, streak XP multipliers"
```

---

### Task 2: Gamification Logic (TDD)

**Files:**
- Create: `src/lib/gamification.ts`
- Create: `tests/gamification.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/gamification.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { getLevelForXp, getXpForScore, getStreakXpMultiplier, checkBadgesAfterDaily } from '../src/lib/gamification'

describe('getLevelForXp', () => {
  it('returns level 1 for 0 XP', () => {
    expect(getLevelForXp(0)).toEqual({ level: 1, emoji: '🌱', titleDe: 'AI Rookie', titleEn: 'AI Rookie', currentXp: 0, nextLevelXp: 1000 })
  })
  it('returns level 2 for 1000 XP', () => {
    const r = getLevelForXp(1000)
    expect(r.level).toBe(2)
    expect(r.titleDe).toBe('AI User')
  })
  it('returns level 6 for 100000+ XP', () => {
    const r = getLevelForXp(150000)
    expect(r.level).toBe(6)
    expect(r.titleDe).toBe('AI Dirigent')
    expect(r.nextLevelXp).toBeNull()
  })
  it('returns level 3 for 7500 XP', () => {
    const r = getLevelForXp(7500)
    expect(r.level).toBe(3)
    expect(r.currentXp).toBe(7500)
    expect(r.nextLevelXp).toBe(15000)
  })
})

describe('getXpForScore', () => {
  it('returns score as XP for positive scores', () => {
    expect(getXpForScore(190)).toBe(190)
  })
  it('returns 0 for negative scores', () => {
    expect(getXpForScore(-100)).toBe(0)
  })
  it('returns 0 for zero score', () => {
    expect(getXpForScore(0)).toBe(0)
  })
})

describe('getStreakXpMultiplier', () => {
  it('returns 1.0 for 0-4 days', () => {
    expect(getStreakXpMultiplier(0)).toBe(1.0)
    expect(getStreakXpMultiplier(4)).toBe(1.0)
  })
  it('returns 1.25 for 5-9 days', () => {
    expect(getStreakXpMultiplier(5)).toBe(1.25)
    expect(getStreakXpMultiplier(9)).toBe(1.25)
  })
  it('returns 1.5 for 10-19 days', () => {
    expect(getStreakXpMultiplier(10)).toBe(1.5)
  })
  it('returns 2.0 for 20+ days', () => {
    expect(getStreakXpMultiplier(20)).toBe(2.0)
    expect(getStreakXpMultiplier(100)).toBe(2.0)
  })
})

describe('checkBadgesAfterDaily', () => {
  it('awards perfect_round for 4/4 correct', () => {
    const answers = [
      { is_correct: true, total_score: 140, time_ms: 4000 },
      { is_correct: true, total_score: 190, time_ms: 5000 },
      { is_correct: true, total_score: 240, time_ms: 3000 },
      { is_correct: true, total_score: 435, time_ms: 4000 },
    ]
    const badges = checkBadgesAfterDaily(answers, [], 1)
    expect(badges).toContain('perfect_round')
  })

  it('awards speed_demon for 3 correct under 15s total', () => {
    const answers = [
      { is_correct: true, total_score: 100, time_ms: 3000 },
      { is_correct: true, total_score: 100, time_ms: 4000 },
      { is_correct: true, total_score: 100, time_ms: 4000 },
      { is_correct: false, total_score: 0, time_ms: 10000 },
    ]
    const badges = checkBadgesAfterDaily(answers, [], 1)
    expect(badges).toContain('speed_demon')
  })

  it('does not award already earned badges', () => {
    const answers = [
      { is_correct: true, total_score: 140, time_ms: 4000 },
      { is_correct: true, total_score: 190, time_ms: 5000 },
      { is_correct: true, total_score: 240, time_ms: 3000 },
      { is_correct: true, total_score: 435, time_ms: 4000 },
    ]
    const badges = checkBadgesAfterDaily(answers, ['perfect_round'], 1)
    expect(badges).not.toContain('perfect_round')
  })

  it('awards streak_7 for 7-day streak', () => {
    const answers = [{ is_correct: true, total_score: 100, time_ms: 5000 }]
    const badges = checkBadgesAfterDaily(answers, [], 7)
    expect(badges).toContain('streak_7')
  })

  it('does not award streak_7 for 6-day streak', () => {
    const answers = [{ is_correct: true, total_score: 100, time_ms: 5000 }]
    const badges = checkBadgesAfterDaily(answers, [], 6)
    expect(badges).not.toContain('streak_7')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/gamification.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement gamification logic**

`src/lib/gamification.ts`:
```ts
import { LEVELS, STREAK_XP_MULTIPLIERS } from './constants'

interface LevelInfo {
  level: number
  emoji: string
  titleDe: string
  titleEn: string
  currentXp: number
  nextLevelXp: number | null
}

export function getLevelForXp(xp: number): LevelInfo {
  let matched = LEVELS[0]
  for (const lvl of LEVELS) {
    if (xp >= lvl.xp) matched = lvl
  }
  const nextLevel = LEVELS.find(l => l.level === matched.level + 1)
  return {
    level: matched.level,
    emoji: matched.emoji,
    titleDe: matched.title.de,
    titleEn: matched.title.en,
    currentXp: xp,
    nextLevelXp: nextLevel?.xp ?? null,
  }
}

export function getXpForScore(totalScore: number): number {
  return Math.max(0, totalScore)
}

export function getStreakXpMultiplier(streakDays: number): number {
  let multi = 1.0
  for (const tier of STREAK_XP_MULTIPLIERS) {
    if (streakDays >= tier.minDays) multi = tier.multi
  }
  return multi
}

interface DailyAnswer {
  is_correct: boolean
  total_score: number
  time_ms: number
}

export function checkBadgesAfterDaily(
  answers: DailyAnswer[],
  existingBadges: string[],
  currentStreak: number,
): string[] {
  const newBadges: string[] = []

  function award(type: string) {
    if (!existingBadges.includes(type) && !newBadges.includes(type)) {
      newBadges.push(type)
    }
  }

  // perfect_round: all answers correct
  if (answers.length >= 4 && answers.every(a => a.is_correct)) {
    award('perfect_round')
  }

  // speed_demon: 3+ correct answers with total time < 15s
  const correctAnswers = answers.filter(a => a.is_correct)
  if (correctAnswers.length >= 3) {
    const fastestThree = [...correctAnswers].sort((a, b) => a.time_ms - b.time_ms).slice(0, 3)
    const totalTimeMs = fastestThree.reduce((sum, a) => sum + a.time_ms, 0)
    if (totalTimeMs < 15000) {
      award('speed_demon')
    }
  }

  // streak badges
  if (currentStreak >= 7) award('streak_7')
  if (currentStreak >= 30) award('streak_30')
  if (currentStreak >= 100) award('streak_100')

  return newBadges
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/gamification.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/gamification.ts tests/gamification.test.ts
git commit -m "feat: add gamification logic with XP, levels, streaks, badges (TDD)"
```

---

### Task 3: finish-daily Edge Function

**Files:**
- Create: `supabase/functions/finish-daily/index.ts`

- [ ] **Step 1: Create the Edge Function**

`supabase/functions/finish-daily/index.ts`:
```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await anonClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const db = createClient(supabaseUrl, serviceKey)
    const body = await req.json()
    const { daily_quiz_id, answers, total_score, max_streak } = body

    // 1. Save quiz attempt
    const { error: attemptErr } = await db.from('quiz_attempts').insert({
      user_id: user.id,
      quiz_type: 'daily',
      daily_quiz_id,
      total_score,
      max_streak,
      answers,
      finished_at: new Date().toISOString(),
    })
    if (attemptErr) {
      return new Response(JSON.stringify({ error: 'Failed to save attempt', details: attemptErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 2. Get current profile
    const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single()
    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 3. Calculate XP gain (only positive scores count)
    const xpGain = Math.max(0, total_score)
    const newTotalXp = (profile.total_xp ?? 0) + xpGain

    // 4. Update streak
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const lastPlayed = profile.last_played_at
    const dayOfWeek = today.getUTCDay() // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat

    let newStreak = profile.current_streak ?? 0

    if (lastPlayed === todayStr) {
      // Already played today — don't double-count
    } else {
      // Check if streak continues
      const lastDate = lastPlayed ? new Date(lastPlayed) : null
      let streakBroken = true

      if (lastDate) {
        const diffMs = today.getTime() - lastDate.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        if (diffDays === 1) {
          // Played yesterday — streak continues
          streakBroken = false
        } else if (diffDays === 2 && lastDate.getUTCDay() === 5 && dayOfWeek === 1) {
          // Friday → Monday — weekend skip, streak continues
          streakBroken = false
        } else if (diffDays === 3 && lastDate.getUTCDay() === 5 && dayOfWeek === 1) {
          // Edge case: Friday → Monday with 3-day gap
          streakBroken = false
        }
      }

      if (streakBroken) {
        newStreak = 1
      } else {
        newStreak += 1
      }
    }

    const newLongestStreak = Math.max(profile.longest_streak ?? 0, newStreak)

    // 5. Calculate level
    const LEVELS = [
      { level: 1, xp: 0 }, { level: 2, xp: 1000 }, { level: 3, xp: 5000 },
      { level: 4, xp: 15000 }, { level: 5, xp: 40000 }, { level: 6, xp: 100000 },
    ]
    let newLevel = 1
    for (const l of LEVELS) {
      if (newTotalXp >= l.xp) newLevel = l.level
    }

    // 6. Update profile
    await db.from('profiles').update({
      total_xp: newTotalXp,
      level: newLevel,
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      last_played_at: todayStr,
    }).eq('id', user.id)

    // 7. Check badges
    const { data: existingBadges } = await db.from('user_badges')
      .select('badge_type').eq('user_id', user.id)
    const earnedTypes = (existingBadges ?? []).map((b: { badge_type: string }) => b.badge_type)

    const newBadges: string[] = []
    function award(type: string) {
      if (!earnedTypes.includes(type) && !newBadges.includes(type)) newBadges.push(type)
    }

    // Perfect round
    const correctCount = answers.filter((a: { is_correct: boolean }) => a.is_correct).length
    if (correctCount === answers.length && answers.length >= 4) award('perfect_round')

    // Speed demon
    const correctAnswers = answers.filter((a: { is_correct: boolean }) => a.is_correct)
    if (correctAnswers.length >= 3) {
      const fastest = [...correctAnswers].sort((a: { time_ms: number }, b: { time_ms: number }) => a.time_ms - b.time_ms).slice(0, 3)
      if (fastest.reduce((s: number, a: { time_ms: number }) => s + a.time_ms, 0) < 15000) award('speed_demon')
    }

    // Early bird (before 8:00 UTC)
    if (today.getUTCHours() < 8) {
      const { count } = await db.from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('quiz_type', 'daily')
      if ((count ?? 0) >= 5) award('early_bird')
    }

    // Streaks
    if (newStreak >= 7) award('streak_7')
    if (newStreak >= 30) award('streak_30')
    if (newStreak >= 100) award('streak_100')

    // Insert new badges
    if (newBadges.length > 0) {
      await db.from('user_badges').insert(
        newBadges.map(type => ({ user_id: user.id, badge_type: type }))
      )
    }

    // 8. Update weekly score
    const mondayOfWeek = new Date(today)
    const dow = mondayOfWeek.getUTCDay()
    const diff = dow === 0 ? 6 : dow - 1
    mondayOfWeek.setUTCDate(mondayOfWeek.getUTCDate() - diff)
    const weekStart = mondayOfWeek.toISOString().split('T')[0]

    const dayNames = ['so', 'mo', 'di', 'mi', 'do', 'fr', 'sa']
    const todayName = dayNames[today.getUTCDay()]

    const { data: existingWeekly } = await db.from('weekly_scores')
      .select('*').eq('user_id', user.id).eq('week_start', weekStart).single()

    if (existingWeekly) {
      const scores = existingWeekly.daily_scores as Record<string, number>
      scores[todayName] = total_score
      const weekTotal = Object.values(scores).reduce((s, v) => s + (v as number), 0)
      await db.from('weekly_scores').update({
        daily_scores: scores,
        total_score: weekTotal,
      }).eq('id', existingWeekly.id)
    } else {
      await db.from('weekly_scores').insert({
        user_id: user.id,
        week_start: weekStart,
        daily_scores: { [todayName]: total_score },
        total_score,
      })
    }

    return new Response(JSON.stringify({
      xp_gained: xpGain,
      total_xp: newTotalXp,
      level: newLevel,
      streak: newStreak,
      longest_streak: newLongestStreak,
      new_badges: newBadges,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('finish-daily error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
```

- [ ] **Step 2: Deploy**

```bash
export SUPABASE_ACCESS_TOKEN=sbp_c11bdd798fffa3dbde5bb5f00dd226fa706043c6
supabase functions deploy finish-daily --project-ref amhfxaqolholacanqyas --no-verify-jwt
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/finish-daily/index.ts
git commit -m "feat: add finish-daily Edge Function (XP, streak, badges, weekly score)"
```

---

### Task 4: get-leaderboard Edge Function

**Files:**
- Create: `supabase/functions/get-leaderboard/index.ts`

- [ ] **Step 1: Create the Edge Function**

`supabase/functions/get-leaderboard/index.ts`:
```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const tab = url.searchParams.get('tab') || 'weekly' // weekly | alltime | halloffame

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const db = createClient(supabaseUrl, serviceKey)

    if (tab === 'weekly') {
      // Current week's Monday
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
        rank: i + 1,
        user_id: row.user_id,
        display_name: row.profiles?.display_name ?? '',
        avatar_url: row.profiles?.avatar_url ?? null,
        total_score: row.total_score,
        level: row.profiles?.level ?? 1,
        current_streak: row.profiles?.current_streak ?? 0,
        is_champion: row.is_champion ?? false,
      }))

      return new Response(JSON.stringify({ tab: 'weekly', week_start: weekStart, entries }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (tab === 'alltime') {
      const { data } = await db.from('profiles')
        .select('id, display_name, avatar_url, total_xp, level, current_streak')
        .order('total_xp', { ascending: false })
        .limit(50)

      const entries = (data ?? []).map((row: any, i: number) => ({
        rank: i + 1,
        user_id: row.id,
        display_name: row.display_name ?? '',
        avatar_url: row.avatar_url ?? null,
        total_score: row.total_xp,
        level: row.level ?? 1,
        current_streak: row.current_streak ?? 0,
        is_champion: false,
      }))

      return new Response(JSON.stringify({ tab: 'alltime', entries }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (tab === 'halloffame') {
      const { data } = await db.from('weekly_scores')
        .select('user_id, week_start, total_score, profiles(display_name, avatar_url, level)')
        .eq('is_champion', true)
        .order('week_start', { ascending: false })
        .limit(20)

      const entries = (data ?? []).map((row: any, i: number) => ({
        rank: i + 1,
        user_id: row.user_id,
        display_name: row.profiles?.display_name ?? '',
        avatar_url: row.profiles?.avatar_url ?? null,
        total_score: row.total_score,
        level: row.profiles?.level ?? 1,
        current_streak: 0,
        is_champion: true,
        week_start: row.week_start,
      }))

      return new Response(JSON.stringify({ tab: 'halloffame', entries }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Invalid tab' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('get-leaderboard error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
```

- [ ] **Step 2: Deploy**

```bash
export SUPABASE_ACCESS_TOKEN=sbp_c11bdd798fffa3dbde5bb5f00dd226fa706043c6
supabase functions deploy get-leaderboard --project-ref amhfxaqolholacanqyas --no-verify-jwt
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/get-leaderboard/index.ts
git commit -m "feat: add get-leaderboard Edge Function (weekly, all-time, hall of fame)"
```

---

### Task 5: Integrate finish-daily into Quiz Flow

**Files:**
- Modify: `src/hooks/useQuiz.ts`
- Modify: `public/locales/de.json`
- Modify: `public/locales/en.json`

- [ ] **Step 1: Add `finishDaily` call when quiz ends**

In `src/hooks/useQuiz.ts`, add a `finishQuiz` function that calls the `finish-daily` Edge Function after the last answer's feedback is dismissed. Modify `nextQuestion`: when it transitions to `'finished'`, also call `finishQuiz`.

Add to the hook state:
```ts
gamificationResult: {
  xp_gained: number
  total_xp: number
  level: number
  streak: number
  new_badges: string[]
} | null
```

Add `finishQuiz` function that calls `callEdgeFunction('finish-daily', { daily_quiz_id, answers, total_score, max_streak })` and stores the result in state.

In `nextQuestion`, after setting `gameState: 'finished'`, call `finishQuiz()`.

- [ ] **Step 2: Add i18n keys for gamification result**

Add to `de.json`:
```json
"result.xpGained": "+{xp} XP",
"result.levelUp": "Level Up!",
"result.newBadge": "Neues Badge!",
"result.streak": "{days} Tage Streak"
```

Add to `en.json`:
```json
"result.xpGained": "+{xp} XP",
"result.levelUp": "Level Up!",
"result.newBadge": "New Badge!",
"result.streak": "{days} Day Streak"
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useQuiz.ts public/locales/de.json public/locales/en.json
git commit -m "feat: integrate finish-daily into quiz flow, add gamification i18n"
```

---

### Task 6: Dashboard UI Components

**Files:**
- Create: `src/components/StreakBar.tsx`
- Create: `src/components/LevelBar.tsx`
- Create: `src/components/WeekdayDots.tsx`

- [ ] **Step 1: Create WeekdayDots**

`src/components/WeekdayDots.tsx` — Shows Mo-Fr dots, filled for played days, highlighted for today:
```tsx
import type { Locale } from '../types'

interface WeekdayDotsProps {
  playedDays: string[] // ['mo','di','mi']
  locale: Locale
}

const WEEKDAYS = [
  { key: 'mo', de: 'Mo', en: 'Mo' },
  { key: 'di', de: 'Di', en: 'Tu' },
  { key: 'mi', de: 'Mi', en: 'We' },
  { key: 'do', de: 'Do', en: 'Th' },
  { key: 'fr', de: 'Fr', en: 'Fr' },
]

export default function WeekdayDots({ playedDays, locale }: WeekdayDotsProps) {
  const todayIndex = new Date().getDay() // 0=Sun
  const todayKey = ['so','mo','di','mi','do','fr','sa'][todayIndex]

  return (
    <div className="flex gap-1">
      {WEEKDAYS.map(d => {
        const played = playedDays.includes(d.key)
        const isToday = d.key === todayKey
        return (
          <div
            key={d.key}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold
              ${played ? 'bg-fire text-white' : isToday ? 'bg-primary text-white' : 'bg-white/6 text-text-muted'}`}
          >
            {d[locale]}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Create StreakBar**

`src/components/StreakBar.tsx`:
```tsx
import type { Locale } from '../types'
import WeekdayDots from './WeekdayDots'

interface StreakBarProps {
  streak: number
  playedDays: string[]
  locale: Locale
  t: (key: string) => string
}

export default function StreakBar({ streak, playedDays, locale, t }: StreakBarProps) {
  return (
    <div className="bg-white/4 border border-white/6 rounded-2xl p-4 flex items-center gap-3">
      <div className="text-3xl">🔥</div>
      <div className="flex-1">
        <div className="text-2xl font-extrabold text-fire">{streak}</div>
        <div className="text-xs text-text-muted">{t('dashboard.streakDays')}</div>
      </div>
      <WeekdayDots playedDays={playedDays} locale={locale} />
    </div>
  )
}
```

- [ ] **Step 3: Create LevelBar**

`src/components/LevelBar.tsx`:
```tsx
import { getLevelForXp } from '../lib/gamification'
import type { Locale } from '../types'

interface LevelBarProps {
  totalXp: number
  locale: Locale
}

export default function LevelBar({ totalXp, locale }: LevelBarProps) {
  const info = getLevelForXp(totalXp)
  const title = locale === 'de' ? info.titleDe : info.titleEn
  const progress = info.nextLevelXp
    ? ((totalXp - (info.currentXp >= info.nextLevelXp ? 0 : getLevelXpFloor(info.level))) / (info.nextLevelXp - getLevelXpFloor(info.level))) * 100
    : 100

  return (
    <div className="bg-white/4 border border-white/6 rounded-2xl p-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2 font-bold text-sm">
          <span className="text-lg">{info.emoji}</span>
          <span>{title}</span>
        </div>
        <span className="text-xs text-text-muted font-mono">
          {totalXp.toLocaleString()} {info.nextLevelXp ? `/ ${info.nextLevelXp.toLocaleString()} XP` : 'XP'}
        </span>
      </div>
      <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-teal rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  )
}

function getLevelXpFloor(level: number): number {
  const floors = [0, 0, 1000, 5000, 15000, 40000, 100000]
  return floors[level] ?? 0
}
```

- [ ] **Step 4: Verify TypeScript, commit**

```bash
npx tsc --noEmit
git add src/components/WeekdayDots.tsx src/components/StreakBar.tsx src/components/LevelBar.tsx
git commit -m "feat: add StreakBar, LevelBar, WeekdayDots components"
```

---

### Task 7: Rich Dashboard Page

**Files:**
- Modify: `src/pages/DashboardPage.tsx`
- Modify: `src/App.tsx` (add routes)

- [ ] **Step 1: Rewrite DashboardPage**

Replace `src/pages/DashboardPage.tsx` with a rich version that includes:
- Header with logo + language toggle + avatar (link to /profile)
- StreakBar with flame, count, weekday dots
- ChampionBanner (if Monday and champion exists — can be placeholder for now)
- Daily Quiz card (gradient, date, CTA)
- LevelBar with XP progress
- Quick nav grid (4 items): Free Play, Leaderboard, Challenge, Badges — link to /leaderboard for now, others as placeholders
- Sign out in footer

Use `useAuth` for profile data, `useLocale` for i18n. Import StreakBar and LevelBar.

- [ ] **Step 2: Add Leaderboard and Profile routes to App.tsx**

Add imports and routes:
```tsx
import { LeaderboardPage } from './pages/LeaderboardPage'
import { ProfilePage } from './pages/ProfilePage'
// in Routes:
<Route path="/leaderboard" element={<LeaderboardPage />} />
<Route path="/profile" element={<ProfilePage />} />
```

Create placeholder files for LeaderboardPage and ProfilePage (just return a div with title + back link) so routes don't break.

- [ ] **Step 3: Verify, commit**

```bash
npx tsc --noEmit
git add src/pages/DashboardPage.tsx src/pages/LeaderboardPage.tsx src/pages/ProfilePage.tsx src/App.tsx
git commit -m "feat: rich dashboard with streak, level, quick nav"
```

---

### Task 8: Leaderboard Page

**Files:**
- Create: `src/components/LeaderboardTable.tsx`
- Create: `src/hooks/useLeaderboard.ts`
- Modify: `src/pages/LeaderboardPage.tsx`

- [ ] **Step 1: Create useLeaderboard hook**

`src/hooks/useLeaderboard.ts` — fetches from get-leaderboard Edge Function using direct fetch (same pattern as useQuiz's `callEdgeFunction`):
- State: `{ tab, entries, loading, error }`
- Functions: `loadTab(tab: 'weekly' | 'alltime' | 'halloffame')`
- Auto-loads 'weekly' on mount

- [ ] **Step 2: Create LeaderboardTable component**

`src/components/LeaderboardTable.tsx`:
- Props: `{ entries: LeaderboardEntry[], currentUserId: string, locale: Locale }`
- Top 3: Podium style (gold/silver/bronze colors, larger)
- Rest: rows with rank, avatar circle (initials), name, level badge, score, streak fire
- Current user's row highlighted with primary border
- Use LEVELS from constants to show level emoji

- [ ] **Step 3: Build LeaderboardPage**

`src/pages/LeaderboardPage.tsx`:
- Header with back arrow + title "🏆 Leaderboard"
- Tab bar: "Diese Woche" / "All-Time" / "Hall of Fame" — uses bg-primary for active tab
- LeaderboardTable below
- Uses useLeaderboard hook + useAuth for current user ID

- [ ] **Step 4: Add i18n keys**

Add to both locale files:
```
"leaderboard.title": "Leaderboard"
"leaderboard.weekly": "Diese Woche" / "This Week"
"leaderboard.alltime": "All-Time"
"leaderboard.hallOfFame": "Hall of Fame"
"leaderboard.points": "Pts"
```

- [ ] **Step 5: Verify, commit**

```bash
npx tsc --noEmit
git add src/hooks/useLeaderboard.ts src/components/LeaderboardTable.tsx src/pages/LeaderboardPage.tsx public/locales/
git commit -m "feat: add leaderboard page with weekly, all-time, hall of fame tabs"
```

---

### Task 9: Badge Grid + Profile Page

**Files:**
- Create: `src/components/BadgeGrid.tsx`
- Modify: `src/pages/ProfilePage.tsx`

- [ ] **Step 1: Create BadgeGrid**

`src/components/BadgeGrid.tsx`:
- Props: `{ earnedBadges: string[], locale: Locale }`
- Maps over BADGES from constants
- Each badge: emoji, title, description
- Earned badges: full color
- Locked badges: opacity-30, grayscale
- Grid: 3 columns on mobile, 4 on wider

- [ ] **Step 2: Build ProfilePage**

`src/pages/ProfilePage.tsx`:
- Header with back arrow + "Profil"
- Avatar circle (large) with display_name
- LevelBar
- Stats row: Total XP, Längster Streak, Badges earned
- BadgeGrid with earned badges highlighted
- Language toggle
- Sign out button
- Uses useAuth for profile, fetches badges from Supabase directly

- [ ] **Step 3: Add i18n keys**

```
"profile.title": "Profil" / "Profile"
"profile.totalXp": "Gesamt-XP" / "Total XP"
"profile.longestStreak": "Längster Streak" / "Longest Streak"
"profile.badgesEarned": "Badges" / "Badges"
```

- [ ] **Step 4: Verify, commit**

```bash
npx tsc --noEmit
git add src/components/BadgeGrid.tsx src/pages/ProfilePage.tsx public/locales/
git commit -m "feat: add profile page with badge grid and stats"
```

---

### Task 10: Badge Unlock Animation on Result Screen

**Files:**
- Create: `src/components/BadgeUnlock.tsx`
- Modify: `src/components/ResultScreen.tsx`
- Modify: `src/pages/DailyQuizPage.tsx`

- [ ] **Step 1: Create BadgeUnlock overlay**

`src/components/BadgeUnlock.tsx`:
- Props: `{ badges: string[], locale: Locale, onClose: () => void }`
- Full-screen overlay with backdrop blur
- Animated badge emoji (scale bounce via Framer Motion)
- Badge title + description
- "Weiter" button to dismiss
- If multiple badges, show them sequentially

- [ ] **Step 2: Update ResultScreen to show gamification results**

Add props for `xpGained`, `newLevel`, `streak`, `newBadges`. Display:
- "+{xp} XP" animated counter
- Level title
- Streak count with fire
- New badges earned (triggers BadgeUnlock overlay)

- [ ] **Step 3: Update DailyQuizPage to pass gamification data**

Pass `quiz.gamificationResult` to ResultScreen when in 'finished' state.

- [ ] **Step 4: Verify, commit**

```bash
npx tsc --noEmit
git add src/components/BadgeUnlock.tsx src/components/ResultScreen.tsx src/pages/DailyQuizPage.tsx
git commit -m "feat: add badge unlock animation and gamification display on result screen"
```

---

### Task 11: End-to-End Test

- [ ] **Step 1: Deploy all new Edge Functions**

```bash
export SUPABASE_ACCESS_TOKEN=sbp_c11bdd798fffa3dbde5bb5f00dd226fa706043c6
supabase functions deploy finish-daily --project-ref amhfxaqolholacanqyas --no-verify-jwt
supabase functions deploy get-leaderboard --project-ref amhfxaqolholacanqyas --no-verify-jwt
```

- [ ] **Step 2: Seed daily quiz for today**

```bash
# Run via Supabase Management API — insert daily quiz for CURRENT_DATE
```

- [ ] **Step 3: Manual smoke test**

1. Login → Dashboard shows streak bar (0), level bar (AI Rookie), daily quiz card
2. Play daily quiz → answer all 4 questions → see result with XP gained, streak, badges
3. Go to Leaderboard → see yourself in weekly ranking
4. Go to Profile → see badges, stats, level
5. Refresh Dashboard → streak updated, XP bar filled

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
npx tsc --noEmit
```

- [ ] **Step 5: Final commit + push**

```bash
git add -A
git commit -m "feat: Plan 2 complete — gamification, leaderboard, badges, profile"
git push origin master
```

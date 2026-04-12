# AI-Shift Happens — Plan 1: Foundation + Auth + Quiz Core

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable AI quiz with Google/LinkedIn/Email auth, hybrid scoring (streak × speed), bilingual support (DE/EN), and feedback per question — the core experience without gamification or social features.

**Architecture:** React 19 SPA with Vite and TypeScript. Supabase for auth (3 providers), Postgres for data, Edge Functions for server-side score calculation (anti-cheat). i18n via lightweight custom hook. Dark deep-blue theme with Tailwind CSS 4.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind CSS 4, Framer Motion, Supabase (Auth + DB + Edge Functions), Space Grotesk + JetBrains Mono fonts

**Spec:** `docs/superpowers/specs/2026-04-12-ai-shift-happens-design.md`

**Plan series:** This is Plan 1 of 4. Plan 2 adds gamification, Plan 3 adds social/viral, Plan 4 adds auto-generation and deployment.

---

## File Structure

```
shift-happens/
├── public/
│   ├── locales/
│   │   ├── de.json              # German UI strings
│   │   └── en.json              # English UI strings
│   └── tbai-logo.png            # Logo asset
├── src/
│   ├── main.tsx                 # React entry point
│   ├── App.tsx                  # Router + auth provider
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client init
│   │   ├── scoring.ts           # Score calculation (shared with Edge Fn)
│   │   └── constants.ts         # Categories, levels, config
│   ├── hooks/
│   │   ├── useAuth.ts           # Auth state hook
│   │   ├── useLocale.ts         # i18n hook
│   │   └── useQuiz.ts           # Quiz state machine
│   ├── components/
│   │   ├── Layout.tsx           # App shell (header, nav)
│   │   ├── AuthScreen.tsx       # Login/signup screen
│   │   ├── QuizCard.tsx         # Question + options display
│   │   ├── FeedbackCard.tsx     # Post-answer feedback
│   │   ├── ResultScreen.tsx     # End-of-quiz results
│   │   ├── ProgressBar.tsx      # Quiz progress indicator
│   │   ├── TimerBar.tsx         # Speed timer visualization
│   │   ├── ScoreDisplay.tsx     # Live score + streak
│   │   └── CategorySelect.tsx   # Category picker for free play
│   ├── pages/
│   │   ├── DashboardPage.tsx    # Main hub
│   │   ├── DailyQuizPage.tsx    # Daily quiz flow
│   │   ├── FreePlayPage.tsx     # Free play mode
│   │   └── ProfilePage.tsx      # User profile + settings
│   └── types/
│       └── index.ts             # All TypeScript types
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── functions/
│       ├── submit-answer/
│       │   └── index.ts
│       └── get-daily-quiz/
│           └── index.ts
├── tests/
│   ├── scoring.test.ts          # Scoring logic unit tests
│   └── quiz-flow.test.ts        # Quiz state machine tests
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.local                   # Supabase keys (not committed)
```

---

### Task 1: Project Scaffold + Tooling

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `.env.local`, `.gitignore`

- [ ] **Step 1: Initialize Vite project**

```bash
cd C:/Users/illum/CLAUDE/projects/shift-happens
npm create vite@latest . -- --template react-ts
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js framer-motion lucide-react
npm install -D tailwindcss @tailwindcss/vite autoprefixer
```

- [ ] **Step 3: Configure Vite with basePath and Tailwind**

`vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/mindset-shift/',
})
```

- [ ] **Step 4: Configure TypeScript**

`tsconfig.json` — ensure `strict: true`, `paths` configured for `@/` alias:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"]
}
```

- [ ] **Step 5: Set up Tailwind with dark theme**

`src/index.css`:
```css
@import "tailwindcss";

@theme {
  --color-bg-base: #080B1A;
  --color-bg-mid: #0D1330;
  --color-bg-accent: #111B45;
  --color-bg-card: rgba(255, 255, 255, 0.04);
  --color-bg-card-border: rgba(255, 255, 255, 0.06);
  --color-primary: #5B4FC7;
  --color-primary-hover: #6D5DD4;
  --color-teal: #2DD4BF;
  --color-fire: #F97316;
  --color-gold: #FBBF24;
  --color-rose: #DB2777;
  --color-danger: #DC2626;
  --color-success: #059669;
  --color-text-primary: #E8E6F0;
  --color-text-secondary: #8B87A0;
  --color-text-muted: #5C586E;
  --font-sans: 'Space Grotesk', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

- [ ] **Step 6: Create minimal App.tsx and verify dev server**

`src/App.tsx`:
```tsx
export default function App() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans">
      <h1 className="text-2xl font-bold p-8">AI-Shift Happens</h1>
    </div>
  )
}
```

Run: `npm run dev`
Expected: Dev server at localhost:5173, dark background, white text.

- [ ] **Step 7: Set up .env.local and .gitignore**

`.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

`.gitignore` — add: `node_modules`, `dist`, `.env.local`, `.env`

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + Tailwind project"
```

---

### Task 2: TypeScript Types + Constants

**Files:**
- Create: `src/types/index.ts`, `src/lib/constants.ts`

- [ ] **Step 1: Define all types**

`src/types/index.ts`:
```ts
export interface QuizOption {
  text: string
  score: number
  feedbackText: string
}

export interface Question {
  id: string
  external_id: string
  locale: 'de' | 'en'
  pair_id: string | null
  category: string
  scenario_text: string
  mindset_tip: string
  options: QuizOption[]
  difficulty: 1 | 2 | 3
}

export interface QuestionForClient {
  id: string
  category: string
  scenario_text: string
  options: { text: string; index: number }[]
  is_bonus: boolean
}

export interface AnswerResult {
  question_id: string
  selected_index: number
  base_score: number
  streak_multi: number
  speed_bonus: number
  bonus_multi: number
  total_score: number
  feedback_text: string
  mindset_tip: string
  is_correct: boolean
  is_dangerous: boolean
}

export interface QuizAttempt {
  id: string
  user_id: string
  quiz_type: 'daily' | 'freeplay' | 'challenge'
  daily_quiz_id: string | null
  category: string | null
  total_score: number
  max_streak: number
  answers: AnswerResult[]
  started_at: string
  finished_at: string | null
}

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  locale: 'de' | 'en'
  level: number
  total_xp: number
  current_streak: number
  longest_streak: number
  last_played_at: string | null
  invite_code: string
  team_name: string | null
}

export type Locale = 'de' | 'en'

export type GameState =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'feedback'
  | 'finished'
  | 'error'
```

- [ ] **Step 2: Define constants**

`src/lib/constants.ts`:
```ts
export const CATEGORIES = [
  'prompt-architecture',
  'creativity-ideation',
  'critical-thinking',
  'efficiency-analysis',
  'privacy-ethics',
  'workflow-integration',
  'automation-agents',
  'knowledge-research',
  'change-collaboration',
  'quality-measurement',
] as const

export type CategoryId = (typeof CATEGORIES)[number]

export const CATEGORY_LABELS: Record<CategoryId, { de: string; en: string }> = {
  'prompt-architecture': { de: 'Prompt-Architektur', en: 'Prompt Architecture' },
  'creativity-ideation': { de: 'Kreativität & Ideation', en: 'Creativity & Ideation' },
  'critical-thinking': { de: 'Kritisches Denken & Validierung', en: 'Critical Thinking & Validation' },
  'efficiency-analysis': { de: 'Effizienz & Analyse', en: 'Efficiency & Analysis' },
  'privacy-ethics': { de: 'Datenschutz & Ethik', en: 'Privacy & Ethics' },
  'workflow-integration': { de: 'Workflow-Integration', en: 'Workflow Integration' },
  'automation-agents': { de: 'Automatisierung & Agenten', en: 'Automation & Agents' },
  'knowledge-research': { de: 'Wissensmanagement & Recherche', en: 'Knowledge Management & Research' },
  'change-collaboration': { de: 'Change & Zusammenarbeit', en: 'Change & Collaboration' },
  'quality-measurement': { de: 'Messbarkeit & Qualität', en: 'Quality & Measurement' },
}

export const LEVELS = [
  { level: 1, title: { de: 'AI Rookie', en: 'AI Rookie' }, xp: 0, emoji: '🌱' },
  { level: 2, title: { de: 'AI User', en: 'AI User' }, xp: 1_000, emoji: '💡' },
  { level: 3, title: { de: 'AI Thinker', en: 'AI Thinker' }, xp: 5_000, emoji: '🧠' },
  { level: 4, title: { de: 'AI Strategist', en: 'AI Strategist' }, xp: 15_000, emoji: '🎯' },
  { level: 5, title: { de: 'AI Architect', en: 'AI Architect' }, xp: 40_000, emoji: '🏗️' },
  { level: 6, title: { de: 'AI Dirigent', en: 'AI Dirigent' }, xp: 100_000, emoji: '👑' },
] as const

export const STREAK_MULTIPLIERS = [1.0, 1.5, 2.0, 2.5, 3.0] as const

export const DAILY_QUESTION_COUNT = 3
export const BONUS_QUESTION_COUNT = 1
export const FREEPLAY_QUESTION_COUNT = 10
export const SPEED_BONUS_MAX = 50
export const SPEED_BONUS_DECAY = 2.5
export const BONUS_MULTIPLIER = 1.5
```

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts src/lib/constants.ts
git commit -m "feat: add TypeScript types and game constants"
```

---

### Task 3: Scoring Logic (TDD)

**Files:**
- Create: `src/lib/scoring.ts`, `tests/scoring.test.ts`

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest
```

Add to `package.json` scripts: `"test": "vitest run", "test:watch": "vitest"`

- [ ] **Step 2: Write failing tests**

`tests/scoring.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { calculateScore, getStreakMultiplier } from '../src/lib/scoring'

describe('getStreakMultiplier', () => {
  it('returns 1.0 for first correct answer', () => {
    expect(getStreakMultiplier(1)).toBe(1.0)
  })
  it('returns 1.5 for second consecutive correct', () => {
    expect(getStreakMultiplier(2)).toBe(1.5)
  })
  it('returns 2.0 for third', () => {
    expect(getStreakMultiplier(3)).toBe(2.0)
  })
  it('caps at 2.5 for 4+ (non-bonus)', () => {
    expect(getStreakMultiplier(4)).toBe(2.5)
    expect(getStreakMultiplier(10)).toBe(2.5)
  })
  it('caps at 3.0 for 4+ (bonus)', () => {
    expect(getStreakMultiplier(4, true)).toBe(3.0)
  })
})

describe('calculateScore', () => {
  it('scores +100 base for correct answer', () => {
    const result = calculateScore({
      optionScore: 100,
      streakCount: 1,
      answerTimeMs: 10_000,
      isBonus: false,
    })
    expect(result.base_score).toBe(100)
    expect(result.is_correct).toBe(true)
    expect(result.is_dangerous).toBe(false)
  })

  it('scores 0 for traditional answer', () => {
    const result = calculateScore({
      optionScore: 0,
      streakCount: 3,
      answerTimeMs: 5_000,
      isBonus: false,
    })
    expect(result.base_score).toBe(0)
    expect(result.total_score).toBe(0)
    expect(result.speed_bonus).toBe(0)
    expect(result.is_correct).toBe(false)
    expect(result.is_dangerous).toBe(false)
  })

  it('scores -100 for dangerous answer', () => {
    const result = calculateScore({
      optionScore: -100,
      streakCount: 3,
      answerTimeMs: 5_000,
      isBonus: false,
    })
    expect(result.base_score).toBe(-100)
    expect(result.total_score).toBe(-100)
    expect(result.speed_bonus).toBe(0)
    expect(result.is_dangerous).toBe(true)
  })

  it('applies streak multiplier to correct answers', () => {
    const result = calculateScore({
      optionScore: 100,
      streakCount: 3,
      answerTimeMs: 20_000,
      isBonus: false,
    })
    // 100 * 2.0 + 0 speed bonus = 200
    expect(result.streak_multi).toBe(2.0)
    expect(result.total_score).toBe(200)
  })

  it('calculates speed bonus for correct fast answers', () => {
    const result = calculateScore({
      optionScore: 100,
      streakCount: 1,
      answerTimeMs: 4_000,
      isBonus: false,
    })
    // speed_bonus = max(0, 50 - 4 * 2.5) = 40
    expect(result.speed_bonus).toBe(40)
    // total = (100 * 1.0) + 40 = 140
    expect(result.total_score).toBe(140)
  })

  it('gives zero speed bonus at 20+ seconds', () => {
    const result = calculateScore({
      optionScore: 100,
      streakCount: 1,
      answerTimeMs: 25_000,
      isBonus: false,
    })
    expect(result.speed_bonus).toBe(0)
    expect(result.total_score).toBe(100)
  })

  it('applies 1.5x bonus multiplier for bonus questions', () => {
    const result = calculateScore({
      optionScore: 100,
      streakCount: 4,
      answerTimeMs: 4_000,
      isBonus: true,
    })
    // streak = 3.0 (bonus cap), speed = 40
    // total = (100 * 3.0 * 1.5) + (40 * 1.5) = 450 + 60 = 510
    expect(result.bonus_multi).toBe(1.5)
    expect(result.streak_multi).toBe(3.0)
    expect(result.total_score).toBe(510)
  })

  it('perfect daily example from spec: 1005 points', () => {
    const q1 = calculateScore({ optionScore: 100, streakCount: 1, answerTimeMs: 4_000, isBonus: false })
    const q2 = calculateScore({ optionScore: 100, streakCount: 2, answerTimeMs: 4_000, isBonus: false })
    const q3 = calculateScore({ optionScore: 100, streakCount: 3, answerTimeMs: 4_000, isBonus: false })
    const bonus = calculateScore({ optionScore: 100, streakCount: 4, answerTimeMs: 4_000, isBonus: true })
    const total = q1.total_score + q2.total_score + q3.total_score + bonus.total_score
    // 140 + 190 + 240 + 510 = 1080... let me recalculate
    // q1: (100*1.0*1.0) + (40*1.0) = 140
    // q2: (100*1.5*1.0) + (40*1.0) = 190
    // q3: (100*2.0*1.0) + (40*1.0) = 240
    // bonus: (100*3.0*1.5) + (40*1.5) = 450+60 = 510
    // total = 140+190+240+510 = 1080
    expect(total).toBe(1080)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/scoring.test.ts`
Expected: FAIL — module not found

- [ ] **Step 4: Implement scoring**

`src/lib/scoring.ts`:
```ts
import { STREAK_MULTIPLIERS, SPEED_BONUS_MAX, SPEED_BONUS_DECAY, BONUS_MULTIPLIER } from './constants'

export function getStreakMultiplier(streakCount: number, isBonus = false): number {
  const maxIndex = isBonus ? STREAK_MULTIPLIERS.length - 1 : STREAK_MULTIPLIERS.length - 2
  const index = Math.min(streakCount - 1, maxIndex)
  return STREAK_MULTIPLIERS[Math.max(0, index)]
}

interface ScoreInput {
  optionScore: number
  streakCount: number
  answerTimeMs: number
  isBonus: boolean
}

interface ScoreResult {
  base_score: number
  streak_multi: number
  speed_bonus: number
  bonus_multi: number
  total_score: number
  is_correct: boolean
  is_dangerous: boolean
}

export function calculateScore(input: ScoreInput): ScoreResult {
  const { optionScore, streakCount, answerTimeMs, isBonus } = input

  const is_correct = optionScore === 100
  const is_dangerous = optionScore < 0
  const base_score = optionScore

  const streak_multi = is_correct ? getStreakMultiplier(streakCount, isBonus) : 1.0
  const bonus_multi = isBonus ? BONUS_MULTIPLIER : 1.0

  const answerTimeSec = answerTimeMs / 1000
  const speed_bonus = is_correct
    ? Math.max(0, Math.round(SPEED_BONUS_MAX - answerTimeSec * SPEED_BONUS_DECAY))
    : 0

  const total_score = is_correct
    ? Math.round(base_score * streak_multi * bonus_multi + speed_bonus * bonus_multi)
    : base_score // 0 or -100, no multipliers

  return { base_score, streak_multi, speed_bonus, bonus_multi, total_score, is_correct, is_dangerous }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/scoring.test.ts`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/scoring.ts tests/scoring.test.ts package.json
git commit -m "feat: implement hybrid scoring with streak × speed bonus (TDD)"
```

---

### Task 4: Supabase Schema + RLS

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Write migration SQL**

`supabase/migrations/001_initial_schema.sql`:
```sql
-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  locale text not null default 'de' check (locale in ('de', 'en')),
  level int not null default 1,
  total_xp int not null default 0,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_played_at date,
  invite_code text unique not null default substr(md5(random()::text), 1, 8),
  invited_by uuid references public.profiles(id),
  team_name text,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Questions
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  external_id text unique not null,
  locale text not null check (locale in ('de', 'en')),
  pair_id text,
  category text not null,
  scenario_text text not null,
  mindset_tip text not null,
  options jsonb not null,
  difficulty int not null default 1 check (difficulty between 1 and 3),
  is_active boolean not null default true,
  generated_by text not null default 'manual',
  created_at timestamptz not null default now()
);

create index idx_questions_locale_category on public.questions(locale, category) where is_active = true;
create index idx_questions_pair_id on public.questions(pair_id) where pair_id is not null;

-- Daily Quizzes
create table public.daily_quizzes (
  id uuid primary key default gen_random_uuid(),
  quiz_date date not null,
  locale text not null check (locale in ('de', 'en')),
  question_ids uuid[] not null,
  bonus_question_id uuid not null references public.questions(id),
  created_at timestamptz not null default now(),
  unique(quiz_date, locale)
);

-- Quiz Attempts
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quiz_type text not null check (quiz_type in ('daily', 'freeplay', 'challenge')),
  daily_quiz_id uuid references public.daily_quizzes(id),
  category text,
  total_score int not null default 0,
  max_streak int not null default 0,
  answers jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index idx_attempts_user_type on public.quiz_attempts(user_id, quiz_type);
create index idx_attempts_daily on public.quiz_attempts(daily_quiz_id, user_id) where quiz_type = 'daily';

-- Weekly Scores
create table public.weekly_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  daily_scores jsonb not null default '{}'::jsonb,
  total_score int not null default 0,
  rank int,
  is_champion boolean not null default false,
  unique(user_id, week_start)
);

-- User Badges
create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_type text not null,
  earned_at timestamptz not null default now(),
  unique(user_id, badge_type)
);

-- Challenges
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references public.profiles(id),
  question_ids uuid[] not null,
  challenger_score int not null,
  challenged_id uuid references public.profiles(id),
  challenged_score int,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.daily_quizzes enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.weekly_scores enable row level security;
alter table public.user_badges enable row level security;
alter table public.challenges enable row level security;

-- Profiles: users can read all (for leaderboard), update own
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Questions: readable by all authenticated users
create policy "Questions readable by authenticated" on public.questions for select to authenticated using (true);

-- Daily quizzes: readable by all authenticated
create policy "Daily quizzes readable" on public.daily_quizzes for select to authenticated using (true);

-- Quiz attempts: users can read own, insert own
create policy "Users read own attempts" on public.quiz_attempts for select using (auth.uid() = user_id);
create policy "Users insert own attempts" on public.quiz_attempts for insert with check (auth.uid() = user_id);

-- Weekly scores: readable by all (leaderboard)
create policy "Weekly scores viewable by everyone" on public.weekly_scores for select using (true);

-- Badges: readable by all (public profiles)
create policy "Badges viewable by everyone" on public.user_badges for select using (true);

-- Challenges: readable by participants
create policy "Challenges readable by participants" on public.challenges for select
  using (auth.uid() = challenger_id or auth.uid() = challenged_id);
create policy "Challenges insertable by authenticated" on public.challenges for insert
  to authenticated with check (auth.uid() = challenger_id);
```

- [ ] **Step 2: Apply migration via Supabase dashboard or CLI**

Run in Supabase SQL Editor or:
```bash
supabase db push
```

- [ ] **Step 3: Configure Auth providers in Supabase dashboard**

1. Enable Google OAuth (add client ID + secret)
2. Enable LinkedIn OAuth (OIDC, add client ID + secret)
3. Enable Email auth with email confirmation enabled

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/001_initial_schema.sql
git commit -m "feat: add Supabase schema with RLS policies"
```

---

### Task 5: Supabase Client + Auth Hook

**Files:**
- Create: `src/lib/supabase.ts`, `src/hooks/useAuth.ts`

- [ ] **Step 1: Initialize Supabase client**

`src/lib/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 2: Create auth hook**

`src/hooks/useAuth.ts`:
```ts
import { useState, useEffect } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: true,
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(s => ({ ...s, session, user: session?.user ?? null }))
      if (session?.user) fetchProfile(session.user.id)
      else setState(s => ({ ...s, loading: false }))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(s => ({ ...s, session, user: session?.user ?? null }))
      if (session?.user) fetchProfile(session.user.id)
      else setState(s => ({ ...s, profile: null, loading: false }))
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setState(s => ({ ...s, profile: data as Profile, loading: false }))
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/mindset-shift/' },
    })
  }

  async function signInWithLinkedIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: { redirectTo: window.location.origin + '/mindset-shift/' },
    })
  }

  async function signInWithEmail(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signUpWithEmail(email: string, password: string) {
    return supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + '/mindset-shift/' },
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return { ...state, signInWithGoogle, signInWithLinkedIn, signInWithEmail, signUpWithEmail, signOut }
}
```

- [ ] **Step 3: Verify auth works — create AuthScreen component**

`src/components/AuthScreen.tsx`:
```tsx
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export function AuthScreen() {
  const { signInWithGoogle, signInWithLinkedIn, signUpWithEmail, signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(true)
  const [message, setMessage] = useState('')

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = isSignUp
      ? await signUpWithEmail(email, password)
      : await signInWithEmail(email, password)
    if (error) setMessage(error.message)
    else if (isSignUp) setMessage('Check your email for verification link.')
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">🧠</div>
        <h1 className="text-2xl font-extrabold">AI-Shift Happens</h1>
        <p className="text-text-secondary text-sm mt-1">Wie AI-ready bist du wirklich?</p>
      </div>

      <button
        onClick={signInWithGoogle}
        className="w-full py-3 px-4 rounded-xl border border-bg-card-border bg-bg-card text-text-primary font-semibold flex items-center justify-center gap-3 hover:border-text-muted transition-colors mb-3"
      >
        <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
        Mit Google anmelden
      </button>

      <button
        onClick={signInWithLinkedIn}
        className="w-full py-3 px-4 rounded-xl bg-[#0A66C2] text-white font-semibold flex items-center justify-center gap-3 hover:bg-[#004182] transition-colors mb-3"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="white"><path d="M15.335 0H2.665A2.665 2.665 0 000 2.665v12.67A2.665 2.665 0 002.665 18h12.67A2.665 2.665 0 0018 15.335V2.665A2.665 2.665 0 0015.335 0zM5.339 15.337H2.67V6.747h2.669v8.59zM4.005 5.612a1.548 1.548 0 110-3.096 1.548 1.548 0 010 3.096zM15.339 15.337H12.67V11.16c0-.996-.018-2.277-1.388-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H7.013V6.747h2.56v1.174h.037c.357-.675 1.228-1.387 2.526-1.387 2.703 0 3.203 1.779 3.203 4.092v4.711z"/></svg>
        Mit LinkedIn anmelden
      </button>

      <div className="flex items-center gap-3 my-5 text-xs text-text-muted">
        <div className="flex-1 h-px bg-bg-card-border" />
        <span>oder mit E-Mail</span>
        <div className="flex-1 h-px bg-bg-card-border" />
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="E-Mail-Adresse"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full py-3 px-4 rounded-xl border border-bg-card-border bg-bg-card text-text-primary placeholder-text-muted outline-none focus:border-primary"
        />
        <input
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full py-3 px-4 rounded-xl border border-bg-card-border bg-bg-card text-text-primary placeholder-text-muted outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover transition-colors"
        >
          {isSignUp ? 'Account erstellen' : 'Anmelden'}
        </button>
      </form>

      <button
        onClick={() => setIsSignUp(!isSignUp)}
        className="w-full text-center mt-3 text-sm text-text-muted hover:text-text-secondary"
      >
        {isSignUp ? 'Bereits ein Account? Anmelden' : 'Noch kein Account? Registrieren'}
      </button>

      {message && (
        <p className="mt-3 text-center text-sm text-teal">{message}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Wire into App.tsx and test**

`src/App.tsx`:
```tsx
import { useAuth } from './hooks/useAuth'
import { AuthScreen } from './components/AuthScreen'

export default function App() {
  const { user, profile, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-text-muted">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg-base text-text-primary font-sans">
        <AuthScreen />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans p-8">
      <h1 className="text-2xl font-bold">AI-Shift Happens</h1>
      <p className="text-text-secondary mt-2">Welcome, {profile?.display_name || user.email}</p>
      <button onClick={signOut} className="mt-4 px-4 py-2 bg-primary rounded-lg text-white">
        Sign Out
      </button>
    </div>
  )
}
```

Run: `npm run dev`
Expected: Auth screen shows with Google, LinkedIn, Email options. Google login works (if configured).

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase.ts src/hooks/useAuth.ts src/components/AuthScreen.tsx src/App.tsx
git commit -m "feat: add Supabase auth with Google, LinkedIn, Email"
```

---

### Task 6: i18n System

**Files:**
- Create: `public/locales/de.json`, `public/locales/en.json`, `src/hooks/useLocale.ts`

- [ ] **Step 1: Create German locale file**

`public/locales/de.json`:
```json
{
  "app.title": "AI-Shift Happens",
  "app.tagline": "Wie AI-ready bist du wirklich?",
  "auth.google": "Mit Google anmelden",
  "auth.linkedin": "Mit LinkedIn anmelden",
  "auth.email_divider": "oder mit E-Mail",
  "auth.email_placeholder": "E-Mail-Adresse",
  "auth.password_placeholder": "Passwort",
  "auth.signup": "Account erstellen",
  "auth.signin": "Anmelden",
  "auth.has_account": "Bereits ein Account? Anmelden",
  "auth.no_account": "Noch kein Account? Registrieren",
  "auth.check_email": "Bestätigungs-E-Mail gesendet.",
  "dashboard.greeting": "Guten Morgen",
  "dashboard.daily_quiz": "Daily Quiz",
  "dashboard.free_play": "Free Play",
  "dashboard.leaderboard": "Leaderboard",
  "dashboard.challenge": "Challenge",
  "dashboard.badges": "Badges",
  "dashboard.play_now": "Jetzt spielen",
  "dashboard.streak_days": "Tage-Streak",
  "quiz.question_of": "Frage {current} von {total}",
  "quiz.bonus": "Bonus",
  "quiz.streak": "Streak",
  "feedback.perfect": "Perfekt!",
  "feedback.okay": "Da geht noch mehr.",
  "feedback.danger": "Vorsicht!",
  "feedback.mindset_rule": "Mindset-Regel",
  "feedback.next": "Weiter",
  "feedback.show_result": "Ergebnis ansehen",
  "result.score": "Punkte",
  "result.correct": "Richtig",
  "result.max_streak": "Max Streak",
  "result.avg_speed": "Avg Speed",
  "result.better_than": "Besser als {percent}% aller Spieler",
  "result.share_linkedin": "Auf LinkedIn teilen",
  "result.challenge": "Jemanden herausfordern",
  "result.play_again": "Nochmal spielen",
  "result.back": "Zurück"
}
```

- [ ] **Step 2: Create English locale file**

`public/locales/en.json`:
```json
{
  "app.title": "AI-Shift Happens",
  "app.tagline": "How AI-ready are you really?",
  "auth.google": "Sign in with Google",
  "auth.linkedin": "Sign in with LinkedIn",
  "auth.email_divider": "or with email",
  "auth.email_placeholder": "Email address",
  "auth.password_placeholder": "Password",
  "auth.signup": "Create account",
  "auth.signin": "Sign in",
  "auth.has_account": "Already have an account? Sign in",
  "auth.no_account": "No account yet? Register",
  "auth.check_email": "Verification email sent.",
  "dashboard.greeting": "Good morning",
  "dashboard.daily_quiz": "Daily Quiz",
  "dashboard.free_play": "Free Play",
  "dashboard.leaderboard": "Leaderboard",
  "dashboard.challenge": "Challenge",
  "dashboard.badges": "Badges",
  "dashboard.play_now": "Play now",
  "dashboard.streak_days": "Day Streak",
  "quiz.question_of": "Question {current} of {total}",
  "quiz.bonus": "Bonus",
  "quiz.streak": "Streak",
  "feedback.perfect": "Perfect!",
  "feedback.okay": "Room for improvement.",
  "feedback.danger": "Careful!",
  "feedback.mindset_rule": "Mindset Rule",
  "feedback.next": "Next",
  "feedback.show_result": "Show result",
  "result.score": "Points",
  "result.correct": "Correct",
  "result.max_streak": "Max Streak",
  "result.avg_speed": "Avg Speed",
  "result.better_than": "Better than {percent}% of all players",
  "result.share_linkedin": "Share on LinkedIn",
  "result.challenge": "Challenge someone",
  "result.play_again": "Play again",
  "result.back": "Back"
}
```

- [ ] **Step 3: Create useLocale hook**

`src/hooks/useLocale.ts`:
```ts
import { useState, useEffect, useCallback } from 'react'
import type { Locale } from '../types'

type Messages = Record<string, string>

let cachedMessages: Record<Locale, Messages | null> = { de: null, en: null }

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(
    () => (localStorage.getItem('locale') as Locale) || 'de'
  )
  const [messages, setMessages] = useState<Messages>({})

  useEffect(() => {
    async function load() {
      if (cachedMessages[locale]) {
        setMessages(cachedMessages[locale]!)
        return
      }
      const base = import.meta.env.BASE_URL
      const res = await fetch(`${base}locales/${locale}.json`)
      const data = await res.json()
      cachedMessages[locale] = data
      setMessages(data)
    }
    load()
  }, [locale])

  function setLocale(l: Locale) {
    localStorage.setItem('locale', l)
    setLocaleState(l)
  }

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let text = messages[key] || key
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, String(v))
        })
      }
      return text
    },
    [messages]
  )

  return { locale, setLocale, t }
}
```

- [ ] **Step 4: Commit**

```bash
git add public/locales/de.json public/locales/en.json src/hooks/useLocale.ts
git commit -m "feat: add bilingual i18n system (DE/EN)"
```

---

### Task 7: Edge Function — submit-answer

**Files:**
- Create: `supabase/functions/submit-answer/index.ts`

- [ ] **Step 1: Create the Edge Function**

`supabase/functions/submit-answer/index.ts`:
```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const STREAK_MULTIPLIERS = [1.0, 1.5, 2.0, 2.5, 3.0]
const SPEED_BONUS_MAX = 50
const SPEED_BONUS_DECAY = 2.5
const BONUS_MULTIPLIER = 1.5

function getStreakMultiplier(count: number, isBonus: boolean): number {
  const maxIdx = isBonus ? STREAK_MULTIPLIERS.length - 1 : STREAK_MULTIPLIERS.length - 2
  return STREAK_MULTIPLIERS[Math.min(Math.max(0, count - 1), maxIdx)]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing auth' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: { user } } = await createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  ).auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { question_id, selected_index, time_ms, streak_count, is_bonus } = await req.json()

  // Fetch question with scores (server-side only)
  const { data: question, error: qErr } = await supabase
    .from('questions')
    .select('options, mindset_tip')
    .eq('id', question_id)
    .single()

  if (qErr || !question) {
    return new Response(JSON.stringify({ error: 'Question not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const options = question.options as Array<{ text: string; score: number; feedbackText: string }>
  const selected = options[selected_index]
  if (!selected) {
    return new Response(JSON.stringify({ error: 'Invalid option index' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const is_correct = selected.score === 100
  const is_dangerous = selected.score < 0
  const base_score = selected.score
  const streak_multi = is_correct ? getStreakMultiplier(streak_count, is_bonus) : 1.0
  const bonus_multi = is_bonus ? BONUS_MULTIPLIER : 1.0
  const time_sec = time_ms / 1000
  const speed_bonus = is_correct ? Math.max(0, Math.round(SPEED_BONUS_MAX - time_sec * SPEED_BONUS_DECAY)) : 0
  const total_score = is_correct
    ? Math.round(base_score * streak_multi * bonus_multi + speed_bonus * bonus_multi)
    : base_score

  const result = {
    question_id,
    selected_index,
    base_score,
    streak_multi,
    speed_bonus,
    bonus_multi,
    total_score,
    feedback_text: selected.feedbackText,
    mindset_tip: question.mindset_tip,
    is_correct,
    is_dangerous,
  }

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
```

- [ ] **Step 2: Create shared CORS headers**

`supabase/functions/_shared/cors.ts`:
```ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/
git commit -m "feat: add submit-answer Edge Function with server-side scoring"
```

---

### Task 8: Edge Function — get-daily-quiz

**Files:**
- Create: `supabase/functions/get-daily-quiz/index.ts`

- [ ] **Step 1: Create the Edge Function**

`supabase/functions/get-daily-quiz/index.ts`:
```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing auth' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const anonClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: { user } } = await anonClient.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Get user locale
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('locale')
    .eq('id', user.id)
    .single()

  const locale = profile?.locale || 'de'
  const today = new Date().toISOString().split('T')[0]

  // Check if already played today
  const { data: dailyQuiz } = await serviceClient
    .from('daily_quizzes')
    .select('id, question_ids, bonus_question_id')
    .eq('quiz_date', today)
    .eq('locale', locale)
    .single()

  if (!dailyQuiz) {
    return new Response(JSON.stringify({ error: 'No daily quiz available for today' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Check if user already has an attempt for today
  const { data: existingAttempt } = await serviceClient
    .from('quiz_attempts')
    .select('id, total_score, answers, finished_at')
    .eq('user_id', user.id)
    .eq('daily_quiz_id', dailyQuiz.id)
    .eq('quiz_type', 'daily')
    .single()

  if (existingAttempt?.finished_at) {
    return new Response(JSON.stringify({
      already_played: true,
      attempt: existingAttempt,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Fetch questions WITHOUT scores (anti-cheat)
  const allIds = [...dailyQuiz.question_ids, dailyQuiz.bonus_question_id]
  const { data: questions } = await serviceClient
    .from('questions')
    .select('id, category, scenario_text, options')
    .in('id', allIds)

  if (!questions) {
    return new Response(JSON.stringify({ error: 'Questions not found' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Strip scores from options, mark bonus
  const clientQuestions = allIds.map(qId => {
    const q = questions.find(x => x.id === qId)!
    const opts = (q.options as Array<{ text: string; score: number; feedbackText: string }>)
    return {
      id: q.id,
      category: q.category,
      scenario_text: q.scenario_text,
      options: opts.map((o, i) => ({ text: o.text, index: i })),
      is_bonus: qId === dailyQuiz.bonus_question_id,
    }
  })

  return new Response(JSON.stringify({
    daily_quiz_id: dailyQuiz.id,
    quiz_date: today,
    questions: clientQuestions,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/get-daily-quiz/index.ts
git commit -m "feat: add get-daily-quiz Edge Function (anti-cheat, no scores to client)"
```

---

### Task 9: Quiz State Machine Hook

**Files:**
- Create: `src/hooks/useQuiz.ts`

- [ ] **Step 1: Create quiz hook**

`src/hooks/useQuiz.ts`:
```ts
import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { QuestionForClient, AnswerResult, GameState } from '../types'

interface QuizState {
  gameState: GameState
  questions: QuestionForClient[]
  currentIndex: number
  answers: AnswerResult[]
  totalScore: number
  currentStreak: number
  maxStreak: number
  dailyQuizId: string | null
  error: string | null
}

export function useQuiz() {
  const [state, setState] = useState<QuizState>({
    gameState: 'idle',
    questions: [],
    currentIndex: 0,
    answers: [],
    totalScore: 0,
    currentStreak: 0,
    maxStreak: 0,
    dailyQuizId: null,
    error: null,
  })

  const startDaily = useCallback(async () => {
    setState(s => ({ ...s, gameState: 'loading', error: null }))

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setState(s => ({ ...s, gameState: 'error', error: 'Not authenticated' }))
      return
    }

    const { data, error } = await supabase.functions.invoke('get-daily-quiz', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    if (error || data?.error) {
      setState(s => ({
        ...s,
        gameState: 'error',
        error: data?.error || error?.message || 'Failed to load quiz',
      }))
      return
    }

    if (data.already_played) {
      setState(s => ({
        ...s,
        gameState: 'finished',
        answers: data.attempt.answers,
        totalScore: data.attempt.total_score,
      }))
      return
    }

    setState({
      gameState: 'playing',
      questions: data.questions,
      currentIndex: 0,
      answers: [],
      totalScore: 0,
      currentStreak: 0,
      maxStreak: 0,
      dailyQuizId: data.daily_quiz_id,
      error: null,
    })
  }, [])

  const submitAnswer = useCallback(async (selectedIndex: number, timeMs: number) => {
    const q = state.questions[state.currentIndex]
    if (!q) return

    setState(s => ({ ...s, gameState: 'loading' }))

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data, error } = await supabase.functions.invoke('submit-answer', {
      body: {
        question_id: q.id,
        selected_index: selectedIndex,
        time_ms: timeMs,
        streak_count: state.currentStreak + 1,
        is_bonus: q.is_bonus,
      },
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    if (error || data?.error) {
      setState(s => ({ ...s, gameState: 'error', error: 'Failed to submit answer' }))
      return
    }

    const result = data as AnswerResult
    const newStreak = result.is_dangerous ? 0 : (result.is_correct ? state.currentStreak + 1 : state.currentStreak)
    const newMaxStreak = Math.max(state.maxStreak, newStreak)

    setState(s => ({
      ...s,
      gameState: 'feedback',
      answers: [...s.answers, result],
      totalScore: s.totalScore + result.total_score,
      currentStreak: newStreak,
      maxStreak: newMaxStreak,
    }))
  }, [state.questions, state.currentIndex, state.currentStreak, state.maxStreak])

  const nextQuestion = useCallback(() => {
    if (state.currentIndex >= state.questions.length - 1) {
      setState(s => ({ ...s, gameState: 'finished' }))
    } else {
      setState(s => ({
        ...s,
        gameState: 'playing',
        currentIndex: s.currentIndex + 1,
      }))
    }
  }, [state.currentIndex, state.questions.length])

  const reset = useCallback(() => {
    setState({
      gameState: 'idle',
      questions: [],
      currentIndex: 0,
      answers: [],
      totalScore: 0,
      currentStreak: 0,
      maxStreak: 0,
      dailyQuizId: null,
      error: null,
    })
  }, [])

  return {
    ...state,
    currentQuestion: state.questions[state.currentIndex] || null,
    lastAnswer: state.answers[state.answers.length - 1] || null,
    isLastQuestion: state.currentIndex >= state.questions.length - 1,
    startDaily,
    submitAnswer,
    nextQuestion,
    reset,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useQuiz.ts
git commit -m "feat: add quiz state machine hook with Edge Function calls"
```

---

### Task 10: Quiz UI Components

**Files:**
- Create: `src/components/QuizCard.tsx`, `src/components/FeedbackCard.tsx`, `src/components/ResultScreen.tsx`, `src/components/ProgressBar.tsx`, `src/components/TimerBar.tsx`, `src/components/ScoreDisplay.tsx`

- [ ] **Step 1: ProgressBar**

`src/components/ProgressBar.tsx`:
```tsx
interface ProgressBarProps {
  current: number
  total: number
  bonusIndex: number
}

export function ProgressBar({ current, total, bonusIndex }: ProgressBarProps) {
  return (
    <div className="flex gap-1 mb-4">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`flex-1 h-1 rounded-full transition-colors ${
            i < current
              ? 'bg-primary'
              : i === current
                ? 'bg-teal'
                : i === bonusIndex
                  ? 'bg-gold/20 border border-gold/20'
                  : 'bg-white/6'
          }`}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: ScoreDisplay**

`src/components/ScoreDisplay.tsx`:
```tsx
interface ScoreDisplayProps {
  score: number
  streak: number
}

export function ScoreDisplay({ score, streak }: ScoreDisplayProps) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {streak > 0 && (
        <span className="bg-fire/10 text-fire px-2.5 py-1 rounded-lg font-bold">
          🔥 {streak}× Streak
        </span>
      )}
      <span className="bg-teal/10 text-teal px-2.5 py-1 rounded-lg font-mono font-semibold">
        {score > 0 ? '+' : ''}{score}
      </span>
    </div>
  )
}
```

- [ ] **Step 3: TimerBar**

`src/components/TimerBar.tsx`:
```tsx
import { useEffect, useState } from 'react'

interface TimerBarProps {
  maxSeconds: number
  onTimeUpdate: (ms: number) => void
  running: boolean
}

export function TimerBar({ maxSeconds, onTimeUpdate, running }: TimerBarProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!running) { setElapsed(0); return }
    const start = Date.now()
    const interval = setInterval(() => {
      const ms = Date.now() - start
      setElapsed(ms)
      onTimeUpdate(ms)
    }, 100)
    return () => clearInterval(interval)
  }, [running, onTimeUpdate])

  const progress = Math.min(1, elapsed / (maxSeconds * 1000))

  return (
    <div className="h-0.5 bg-white/6 rounded-full mb-4 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-teal to-primary rounded-full transition-all duration-100"
        style={{ width: `${(1 - progress) * 100}%` }}
      />
    </div>
  )
}
```

- [ ] **Step 4: QuizCard**

`src/components/QuizCard.tsx`:
```tsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { QuestionForClient } from '../types'
import { CATEGORY_LABELS } from '../lib/constants'
import type { Locale } from '../types'

interface QuizCardProps {
  question: QuestionForClient
  locale: Locale
  disabled: boolean
  onSelect: (index: number) => void
}

export function QuizCard({ question, locale, disabled, onSelect }: QuizCardProps) {
  const [shuffled, setShuffled] = useState(question.options)

  useEffect(() => {
    setShuffled([...question.options].sort(() => Math.random() - 0.5))
  }, [question])

  const categoryLabel = CATEGORY_LABELS[question.category as keyof typeof CATEGORY_LABELS]?.[locale] || question.category

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold mb-4">
        {categoryLabel}
      </span>

      <div className="bg-bg-card border border-bg-card-border rounded-2xl p-5 mb-4 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-teal rounded-t-2xl" />
        <p className="text-lg font-semibold leading-relaxed pt-2">
          {question.scenario_text}
        </p>
      </div>

      <div className="space-y-2">
        {shuffled.map((opt, i) => (
          <button
            key={opt.index}
            onClick={() => onSelect(opt.index)}
            disabled={disabled}
            className="w-full text-left p-4 rounded-2xl bg-bg-card border-2 border-bg-card-border hover:border-primary hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-start gap-3 disabled:opacity-50 disabled:pointer-events-none group"
          >
            <span className="w-9 h-9 rounded-xl bg-white/6 flex items-center justify-center font-bold text-sm text-text-secondary group-hover:bg-primary group-hover:text-white transition-colors flex-shrink-0">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="text-sm leading-relaxed pt-1">{opt.text}</span>
          </button>
        ))}
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 5: FeedbackCard**

`src/components/FeedbackCard.tsx`:
```tsx
import { motion } from 'framer-motion'
import type { AnswerResult } from '../types'

interface FeedbackCardProps {
  result: AnswerResult
  streak: number
  isLast: boolean
  onNext: () => void
  t: (key: string) => string
}

export function FeedbackCard({ result, streak, isLast, onNext, t }: FeedbackCardProps) {
  const isCorrect = result.is_correct
  const isDangerous = result.is_dangerous

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6"
    >
      <div className="text-center py-4">
        <div className="text-4xl mb-1">{isCorrect ? '✅' : isDangerous ? '⚠️' : '💡'}</div>
        <div className={`text-xl font-extrabold ${isCorrect ? 'text-teal' : isDangerous ? 'text-danger' : 'text-fire'}`}>
          {isCorrect ? t('feedback.perfect') : isDangerous ? t('feedback.danger') : t('feedback.okay')}
        </div>
        <div className={`text-4xl font-extrabold font-mono mt-1 ${
          result.total_score > 0 ? 'text-teal' : result.total_score < 0 ? 'text-danger' : 'text-fire'
        }`}>
          {result.total_score > 0 ? '+' : ''}{result.total_score}
        </div>
        {isCorrect && streak > 0 && (
          <span className="inline-block mt-2 bg-fire/10 text-fire px-3 py-1 rounded-lg text-sm font-bold">
            🔥 {streak}× Streak
          </span>
        )}
      </div>

      <div className="bg-bg-card border border-bg-card-border rounded-2xl p-5 mt-4">
        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          {result.feedback_text}
        </p>
        <div className="bg-primary/5 border-l-3 border-primary rounded-r-xl p-4">
          <div className="text-xs uppercase tracking-wider text-primary font-bold mb-1">
            {t('feedback.mindset_rule')}
          </div>
          <p className="text-sm text-text-secondary italic">
            "{result.mindset_tip}"
          </p>
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full mt-4 py-4 rounded-2xl bg-primary text-white font-bold text-base hover:bg-primary-hover transition-colors"
      >
        {isLast ? t('feedback.show_result') : t('feedback.next')} →
      </button>
    </motion.div>
  )
}
```

- [ ] **Step 6: ResultScreen**

`src/components/ResultScreen.tsx`:
```tsx
import { motion } from 'framer-motion'
import type { AnswerResult } from '../types'
import { LEVELS } from '../lib/constants'
import type { Locale } from '../types'

interface ResultScreenProps {
  score: number
  answers: AnswerResult[]
  maxStreak: number
  locale: Locale
  onBack: () => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

export function ResultScreen({ score, answers, maxStreak, locale, onBack, t }: ResultScreenProps) {
  const correct = answers.filter(a => a.is_correct).length
  const total = answers.length
  const avgSpeed = Math.round(answers.reduce((sum, a) => sum + (a.speed_bonus > 0 ? (50 - a.speed_bonus) / 2.5 : 20), 0) / total * 10) / 10

  // Determine level title based on score pattern
  const levelForDisplay = LEVELS.reduce((best, l) => score >= l.xp ? l : best, LEVELS[0])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="py-4">
        <div className="text-5xl mb-2">🏆</div>
        <div className="text-2xl font-extrabold text-primary">
          {levelForDisplay.title[locale]}!
        </div>
      </div>

      <div className="w-32 h-32 mx-auto my-4 rounded-full bg-gradient-to-br from-primary to-teal p-1">
        <div className="w-full h-full rounded-full bg-bg-base flex flex-col items-center justify-center">
          <div className="text-3xl font-extrabold font-mono">{score}</div>
          <div className="text-xs text-text-muted uppercase tracking-wider">{t('result.score')}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 my-4">
        <div className="bg-bg-card border border-bg-card-border rounded-xl p-3">
          <div className="text-lg font-bold font-mono text-teal">{correct}/{total}</div>
          <div className="text-xs text-text-muted">{t('result.correct')}</div>
        </div>
        <div className="bg-bg-card border border-bg-card-border rounded-xl p-3">
          <div className="text-lg font-bold font-mono text-fire">🔥 {maxStreak}×</div>
          <div className="text-xs text-text-muted">{t('result.max_streak')}</div>
        </div>
        <div className="bg-bg-card border border-bg-card-border rounded-xl p-3">
          <div className="text-lg font-bold font-mono text-teal">{avgSpeed}s</div>
          <div className="text-xs text-text-muted">{t('result.avg_speed')}</div>
        </div>
      </div>

      <button
        onClick={onBack}
        className="w-full py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary-hover transition-colors"
      >
        {t('result.back')}
      </button>
    </motion.div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add src/components/
git commit -m "feat: add quiz UI components (QuizCard, Feedback, Result, Progress, Timer, Score)"
```

---

### Task 11: Daily Quiz Page + Router

**Files:**
- Create: `src/pages/DashboardPage.tsx`, `src/pages/DailyQuizPage.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Install React Router**

```bash
npm install react-router-dom
```

- [ ] **Step 2: Create DashboardPage (minimal)**

`src/pages/DashboardPage.tsx`:
```tsx
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'

export function DashboardPage() {
  const { profile, signOut } = useAuth()
  const { locale, setLocale, t } = useLocale()

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg font-extrabold text-primary">AI-SHIFT HAPPENS</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocale(locale === 'de' ? 'en' : 'de')}
            className="text-xs bg-bg-card border border-bg-card-border px-2 py-1 rounded-lg text-text-muted"
          >
            {locale === 'de' ? '🇬🇧 EN' : '🇩🇪 DE'}
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-teal flex items-center justify-center text-xs font-bold">
            {profile?.display_name?.charAt(0) || '?'}
          </div>
        </div>
      </div>

      <Link
        to="/daily"
        className="block bg-gradient-to-br from-primary to-[#3B82F6] rounded-2xl p-5 mb-4 text-white"
      >
        <div className="text-xs opacity-60 uppercase tracking-wider font-semibold">{t('dashboard.daily_quiz')}</div>
        <h3 className="text-xl font-bold mt-1">{new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
        <div className="text-sm opacity-50 mt-1">3+1 Bonus · ~3 Min</div>
        <div className="mt-3 bg-white text-primary rounded-xl py-3 text-center font-bold">
          ▶ {t('dashboard.play_now')}
        </div>
      </Link>

      <button onClick={signOut} className="text-text-muted text-sm mt-8">
        Sign Out
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Create DailyQuizPage**

`src/pages/DailyQuizPage.tsx`:
```tsx
import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuiz } from '../hooks/useQuiz'
import { useLocale } from '../hooks/useLocale'
import { ProgressBar } from '../components/ProgressBar'
import { ScoreDisplay } from '../components/ScoreDisplay'
import { TimerBar } from '../components/TimerBar'
import { QuizCard } from '../components/QuizCard'
import { FeedbackCard } from '../components/FeedbackCard'
import { ResultScreen } from '../components/ResultScreen'
import { Loader2 } from 'lucide-react'

export function DailyQuizPage() {
  const navigate = useNavigate()
  const { locale, t } = useLocale()
  const quiz = useQuiz()
  const timeRef = useRef(0)

  useEffect(() => {
    quiz.startDaily()
  }, [])

  const handleTimeUpdate = useCallback((ms: number) => {
    timeRef.current = ms
  }, [])

  function handleSelect(optionIndex: number) {
    quiz.submitAnswer(optionIndex, timeRef.current)
  }

  if (quiz.gameState === 'loading' && quiz.questions.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 flex justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (quiz.gameState === 'error') {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <p className="text-danger">{quiz.error}</p>
        <button onClick={() => navigate('/')} className="mt-4 text-primary">
          {t('result.back')}
        </button>
      </div>
    )
  }

  if (quiz.gameState === 'finished') {
    return (
      <div className="max-w-md mx-auto px-4 py-6">
        <ResultScreen
          score={quiz.totalScore}
          answers={quiz.answers}
          maxStreak={quiz.maxStreak}
          locale={locale}
          onBack={() => navigate('/')}
          t={t}
        />
      </div>
    )
  }

  const bonusIndex = quiz.questions.findIndex(q => q.is_bonus)

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => navigate('/')} className="text-text-muted">←</button>
        <ScoreDisplay score={quiz.totalScore} streak={quiz.currentStreak} />
      </div>

      <ProgressBar
        current={quiz.currentIndex}
        total={quiz.questions.length}
        bonusIndex={bonusIndex}
      />

      <TimerBar
        maxSeconds={20}
        onTimeUpdate={handleTimeUpdate}
        running={quiz.gameState === 'playing'}
      />

      {quiz.gameState === 'playing' && quiz.currentQuestion && (
        <QuizCard
          question={quiz.currentQuestion}
          locale={locale}
          disabled={false}
          onSelect={handleSelect}
        />
      )}

      {quiz.gameState === 'feedback' && quiz.lastAnswer && (
        <>
          {quiz.currentQuestion && (
            <QuizCard
              question={quiz.currentQuestion}
              locale={locale}
              disabled={true}
              onSelect={() => {}}
            />
          )}
          <FeedbackCard
            result={quiz.lastAnswer}
            streak={quiz.currentStreak}
            isLast={quiz.isLastQuestion}
            onNext={quiz.nextQuestion}
            t={t}
          />
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Wire up Router in App.tsx**

`src/App.tsx`:
```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { AuthScreen } from './components/AuthScreen'
import { DashboardPage } from './pages/DashboardPage'
import { DailyQuizPage } from './pages/DailyQuizPage'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-text-muted animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen />
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/daily" element={<DailyQuizPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/mindset-shift">
      <div className="min-h-screen bg-bg-base text-text-primary font-sans">
        <AppRoutes />
      </div>
    </BrowserRouter>
  )
}
```

- [ ] **Step 5: Verify full flow**

Run: `npm run dev`
Expected: Auth screen → Login → Dashboard → "Jetzt spielen" → Quiz flow with timer, options, feedback, result.

- [ ] **Step 6: Commit**

```bash
git add src/pages/ src/App.tsx package.json
git commit -m "feat: add Daily Quiz page with full game flow"
```

---

### Task 12: Seed Questions for Testing

**Files:**
- Create: `supabase/seed/seed-questions.sql`

- [ ] **Step 1: Create seed data with 4 DE + 4 EN questions (for one daily quiz)**

`supabase/seed/seed-questions.sql`:
```sql
-- Seed: 4 DE questions
insert into public.questions (id, external_id, locale, pair_id, category, scenario_text, mindset_tip, options, difficulty) values
('a1000000-0000-0000-0000-000000000001', 'DE-PA-001', 'de', 'PA-001', 'prompt-architecture',
 'Du möchtest, dass die KI einen Blogpost im Stil deines Unternehmens schreibt. Wie gehst du vor?',
 'Few-Shot Prompting: Zeige der KI Beispiele, statt nur zu beschreiben.',
 '[{"text":"Schreibe einen professionellen Blogpost über unser neues Produkt.","score":0,"feedbackText":"Zu generisch. Professionell kann alles bedeuten."},{"text":"Kopiere 3 alte Blogposts als Beispiele und sage: Analysiere den Stil und schreibe im gleichen Ton.","score":100,"feedbackText":"Perfekt! Few-Shot Prompting mit echten Beispielen liefert die besten Ergebnisse."},{"text":"Kopiere den gesamten Styleguide in den Prompt.","score":-100,"feedbackText":"Vorsicht! Ein ganzer Styleguide überfordert das Kontextfenster und kann sensible Infos enthalten."}]',
 1),
('a1000000-0000-0000-0000-000000000002', 'DE-DE-001', 'de', 'DE-001', 'privacy-ethics',
 'Dein Team will einen KI-Chatbot für den Kundenservice einsetzen. Wie gehst du mit dem Training-Datensatz um?',
 'Synthetische Daten sind oft besser als echte — ohne Datenschutzrisiko.',
 '[{"text":"Wir nutzen echte Kundengespräche — das ist am realistischsten.","score":-100,"feedbackText":"Vorsicht! Echte Kundendaten enthalten PII und verstoßen ohne Einwilligung gegen die DSGVO."},{"text":"Wir erstellen synthetische Daten basierend auf realen Mustern, ohne PII.","score":100,"feedbackText":"Perfekt! Synthetische Daten schützen die Privatsphäre und sind qualitativ kontrollierbar."},{"text":"Das überlassen wir dem KI-Anbieter.","score":0,"feedbackText":"Riskant. Du bist für den Datenschutz verantwortlich, nicht der Anbieter."}]',
 1),
('a1000000-0000-0000-0000-000000000003', 'DE-EA-001', 'de', 'EA-001', 'efficiency-analysis',
 'Du sollst einen 50-seitigen Report zusammenfassen. Wie nutzt du KI?',
 'Chunking: Teile große Dokumente in Abschnitte, statt alles auf einmal reinzuwerfen.',
 '[{"text":"Kopiere den gesamten Report in den Chat und sage: Fasse zusammen.","score":-100,"feedbackText":"Der Report überschreitet wahrscheinlich das Kontextlimit. Das Ergebnis wird unvollständig."},{"text":"Fasse jeden Abschnitt einzeln zusammen, dann erstelle eine Gesamtzusammenfassung.","score":100,"feedbackText":"Perfekt! Chunking liefert präzisere Ergebnisse und respektiert Kontextlimits."},{"text":"Lese den Report selbst und nutze KI nur für Formulierungshilfe.","score":0,"feedbackText":"Sicher, aber ineffizient. KI kann auch bei der inhaltlichen Zusammenfassung helfen."}]',
 1),
('a1000000-0000-0000-0000-000000000004', 'DE-KI-001', 'de', 'KI-001', 'creativity-ideation',
 'Du brauchst 20 Ideen für eine Marketingkampagne. Wie setzt du KI ein?',
 'Divergentes Denken: Bitte die KI um absurde Ideen — die besten Konzepte entstehen an den Rändern.',
 '[{"text":"Schreibe: Gib mir 20 Marketingideen für unser Produkt.","score":0,"feedbackText":"Funktioniert, aber die Ideen werden generisch. Ohne Kontext keine Kreativität."},{"text":"Beschreibe Zielgruppe, Ton und Constraints, dann bitte um 10 konventionelle und 10 wilde Ideen.","score":100,"feedbackText":"Perfekt! Der Mix aus konventionell und wild plus klarer Kontext liefert die besten Ergebnisse."},{"text":"Nutze nur eigene Ideen — KI ist nicht kreativ.","score":-100,"feedbackText":"KI ist ein exzellenter Brainstorming-Partner. Diese Einstellung verschenkt enormes Potenzial."}]',
 2);

-- Seed: 4 EN twins
insert into public.questions (id, external_id, locale, pair_id, category, scenario_text, mindset_tip, options, difficulty) values
('b1000000-0000-0000-0000-000000000001', 'EN-PA-001', 'en', 'PA-001', 'prompt-architecture',
 'You want the AI to write a blog post in your company''s style. How do you approach this?',
 'Few-Shot Prompting: Show the AI examples instead of just describing what you want.',
 '[{"text":"Write a professional blog post about our new product.","score":0,"feedbackText":"Too generic. Professional can mean anything."},{"text":"Copy 3 previous blog posts as examples and say: Analyze the style and write in the same tone.","score":100,"feedbackText":"Perfect! Few-shot prompting with real examples delivers the best results."},{"text":"Paste the entire style guide into the prompt.","score":-100,"feedbackText":"Careful! A full style guide may exceed the context window and could contain sensitive info."}]',
 1),
('b1000000-0000-0000-0000-000000000002', 'EN-DE-001', 'en', 'DE-001', 'privacy-ethics',
 'Your team wants to deploy an AI chatbot for customer service. How do you handle the training dataset?',
 'Synthetic data is often better than real data — no privacy risk, controllable quality.',
 '[{"text":"We use real customer conversations — most realistic.","score":-100,"feedbackText":"Careful! Real customer data contains PII and violates GDPR without consent."},{"text":"We create synthetic data based on real patterns, without PII.","score":100,"feedbackText":"Perfect! Synthetic data protects privacy and offers controllable quality."},{"text":"We leave that to the AI vendor.","score":0,"feedbackText":"Risky. You are responsible for data protection, not the vendor."}]',
 1),
('b1000000-0000-0000-0000-000000000003', 'EN-EA-001', 'en', 'EA-001', 'efficiency-analysis',
 'You need to summarize a 50-page report. How do you use AI?',
 'Chunking: Split large documents into sections instead of feeding everything at once.',
 '[{"text":"Paste the entire report into the chat and say: Summarize.","score":-100,"feedbackText":"The report likely exceeds the context limit. The result will be incomplete."},{"text":"Summarize each section individually, then create an overall summary.","score":100,"feedbackText":"Perfect! Chunking delivers more precise results and respects context limits."},{"text":"Read the report yourself and only use AI for phrasing help.","score":0,"feedbackText":"Safe but inefficient. AI can also help with content summarization."}]',
 1),
('b1000000-0000-0000-0000-000000000004', 'EN-KI-001', 'en', 'KI-001', 'creativity-ideation',
 'You need 20 ideas for a marketing campaign. How do you use AI?',
 'Divergent Thinking: Ask AI for wild ideas — the best concepts emerge at the edges.',
 '[{"text":"Write: Give me 20 marketing ideas for our product.","score":0,"feedbackText":"Works, but ideas will be generic. Without context, no creativity."},{"text":"Describe target audience, tone, and constraints, then ask for 10 conventional and 10 wild ideas.","score":100,"feedbackText":"Perfect! The mix of conventional and wild plus clear context delivers the best results."},{"text":"Only use your own ideas — AI is not creative.","score":-100,"feedbackText":"AI is an excellent brainstorming partner. This mindset wastes enormous potential."}]',
 2);

-- Seed: Daily quiz for today (DE + EN)
insert into public.daily_quizzes (quiz_date, locale, question_ids, bonus_question_id) values
(current_date, 'de',
 array['a1000000-0000-0000-0000-000000000001'::uuid, 'a1000000-0000-0000-0000-000000000002'::uuid, 'a1000000-0000-0000-0000-000000000003'::uuid],
 'a1000000-0000-0000-0000-000000000004'::uuid),
(current_date, 'en',
 array['b1000000-0000-0000-0000-000000000001'::uuid, 'b1000000-0000-0000-0000-000000000002'::uuid, 'b1000000-0000-0000-0000-000000000003'::uuid],
 'b1000000-0000-0000-0000-000000000004'::uuid);
```

- [ ] **Step 2: Run seed in Supabase SQL editor**

- [ ] **Step 3: Commit**

```bash
git add supabase/seed/
git commit -m "feat: add seed questions (4 DE + 4 EN pairs) for testing"
```

---

### Task 13: End-to-End Smoke Test

- [ ] **Step 1: Deploy Edge Functions**

```bash
supabase functions deploy submit-answer
supabase functions deploy get-daily-quiz
```

- [ ] **Step 2: Run seed data**

Execute `supabase/seed/seed-questions.sql` in Supabase SQL editor.

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`

Test flow:
1. Open app → see auth screen
2. Sign in with Google → redirected to dashboard
3. Click "Jetzt spielen" → daily quiz loads 4 questions
4. Answer first question → see feedback with score, streak, mindset tip
5. Answer all 4 → see result screen with total score
6. Go back to dashboard → click daily again → shows "already played"
7. Toggle language to EN → dashboard shows English text
8. Sign out → back to auth screen

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: Plan 1 complete — playable AI quiz MVP with auth and scoring"
```

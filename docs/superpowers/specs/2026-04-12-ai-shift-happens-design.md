---
title: "2026 04 12 Ai Shift Happens Design"
type: dokument
updated: 2026-04-12
tags: [shift-happens]
---

# AI-Shift Happens — Design Spec

## Overview

**AI-Shift Happens** is a viral AI Enablement Quiz that tests users' AI mindset in realistic office scenarios. It runs as a static React SPA at `tbai.com.de/mindset-shift/` with Supabase for auth, data, and serverless logic.

**Goal:** Go viral on LinkedIn by combining addictive gamification (Duolingo-style streaks, weekly champions, 1v1 challenges) with genuine AI education (10 categories, didactic feedback per question).

**Target audience:** Everyone who uses or wants to use AI at work — from intern to C-level. Maximum breadth.

**Languages:** German and English, user-selectable. Shared leaderboard across both languages.

---

## 1. Core Experience

### 1.1 Daily Quiz (Mo–Fr)

- **3 regular questions + 1 bonus question** per day
- All users get the **same questions** on the same day — ensures fair comparison and shareability
- Questions come from **3 different categories** (rotated), bonus from highest-difficulty category
- **No question repeats** within 14 days
- Weekend does NOT count — quiz runs **Monday through Friday only**

### 1.2 Free Play

- 10 category tracks, each with unlimited rounds of 10 questions
- XP earned counts toward leveling, but NOT toward the weekly leaderboard
- Serves as practice/learning mode

### 1.3 Challenges

- **1v1 Duels:** Generate a challenge link with 5 random questions. Challenger's score is stored. Challenged person plays the same questions and scores are compared.
- **Team Battles:** Users can set a team name. Teams aggregate scores. Abteilung vs. Abteilung.

---

## 2. Scoring System — Hybrid: Streak × Speed-Bonus

### 2.1 Base Scores

| Answer type | Base score | Description |
|---|---|---|
| Best Practice | +100 | AI-native, correct approach |
| Traditional | 0 | Safe but inefficient, missed opportunity |
| Dangerous | −100 | Data privacy risk, hallucination trust, naive delegation |

### 2.2 In-Quiz Streak Multiplier

Consecutive correct answers within a single quiz build a streak:

| Consecutive correct | Multiplier |
|---|---|
| 1 | 1.0× |
| 2 | 1.5× |
| 3 | 2.0× |
| 4+ | 2.5× (max for regular), 3.0× (max for bonus) |

- **Traditional (0 pts) does NOT break the streak** — only dangerous (−100) resets to 1.0×
- Dangerous answers: −100 base + streak reset (double punishment)

### 2.3 Speed Bonus

```
speed_bonus = max(0, 50 − answer_time_seconds × 2.5)
```

- Only awarded for correct (Best Practice) answers
- Maximum: +50 points (answer in <1 second, effectively instant)
- Zero bonus at ≥20 seconds
- Speed bonus is ~12% of total score — noticeable but not dominant

### 2.4 Bonus Question

All scoring for the bonus question is multiplied by **1.5×** (base × streak × 1.5 + speed_bonus × 1.5).

### 2.5 Score Formula

```
score = (base × streak_multi × bonus_multi) + (speed_bonus × bonus_multi)
```

Where:
- `base`: 100 / 0 / −100
- `streak_multi`: 1.0 → 1.5 → 2.0 → 2.5 → 3.0 (see table)
- `bonus_multi`: 1.5 for bonus question, 1.0 otherwise
- `speed_bonus`: max(0, 50 − time_s × 2.5), only if base = 100

### 2.6 Example: Perfect Daily

| Question | Base | Streak | Speed (4s) | Bonus | Total |
|---|---|---|---|---|---|
| Q1 | 100 | 1.0× | +40 | 1.0× | 140 |
| Q2 | 100 | 1.5× | +40 | 1.0× | 190 |
| Q3 | 100 | 2.0× | +40 | 1.0× | 240 |
| Bonus | 100 | 2.5× | +40 | 1.5× | 435 |
| **Total** | | | | | **1.005** |

Max theoretical daily score: ~1.100 (with instant answers and max streak).

---

## 3. Gamification Engine

### 3.1 XP & Level System (6 Levels)

| Level | Title | XP Required | Emoji |
|---|---|---|---|
| 1 | AI Rookie | 0 | 🌱 |
| 2 | AI User | 1.000 | 💡 |
| 3 | AI Thinker | 5.000 | 🧠 |
| 4 | AI Strategist | 15.000 | 🎯 |
| 5 | AI Architect | 40.000 | 🏗️ |
| 6 | AI Dirigent | 100.000 | 👑 |

- XP = absolute sum of all positive scores (daily + free play)
- Negative scores do NOT reduce XP (XP only goes up)
- Progression: ~25 weeks to Lv 6 with daily play only

### 3.2 Daily Streak (Retention)

- Counts weekdays only (Mo–Fr)
- +1 per day with completed Daily Quiz
- **Weekend does NOT break the streak**
- Missing one weekday = streak reset to 0
- Streak multiplier on Free Play XP:
  - 1–4 days: 1.0×
  - 5–9 days: 1.25×
  - 10–19 days: 1.5×
  - 20+ days: 2.0×

### 3.3 Weekly Champion

- Week runs **Monday 00:00 to Friday 23:59**
- Total weekly score = sum of 5 daily scores (only Daily Quiz counts)
- **Monday 00:01:** Cron job calculates final rankings, sets champion
- **Monday first login:** Full-screen overlay "Champion der Woche" with confetti animation, champion name + score, Hall of Fame entry
- Auto-generated LinkedIn share for the champion

### 3.4 Badges (12)

**Gameplay:**
- 🎯 **Perfektionist** — First perfect daily round (4/4 correct)
- ⚡ **Speed Demon** — 3 questions correct in under 15 seconds total
- 🧩 **Universalist** — All 10 categories played at least once
- 🎓 **Meister** — 10 consecutive 100-pt answers in one category

**Streaks:**
- 🔥 **Auf Feuer** — 7-day streak (1 full week)
- 🌋 **Unaufhaltsam** — 30-day streak (6 weeks Mo–Fr)
- 💎 **Diamant** — 100-day streak (20 weeks Mo–Fr)
- 🌅 **Frühaufsteher** — 5× Daily Quiz completed before 08:00

**Social:**
- ⚔️ **Duellant** — First challenge won
- 📣 **Recruiter Gold** — 5 colleagues invited via invite code
- 🏅 **Wochen-Champion** — 1× rank #1 in weekly ranking
- 👑 **Seriensieger** — 3× weekly champion

---

## 4. Viral LinkedIn Engine

### 4.1 Share Card (OG Image)

- Auto-generated image showing: score, level title, ranking percentile, streak
- Generated server-side via Supabase Edge Function
- Stored in Supabase Storage as PNG
- Correct OG meta tags served via Edge Function at share URLs

### 4.2 Share Flow

1. User finishes Daily Quiz → Result Screen shows share preview
2. "Auf LinkedIn teilen" button → opens LinkedIn share dialog with:
   - Pre-written post text (editable): "Ich bin AI Strategist! 847 Punkte im heutigen AI-Shift Happens Quiz. Besser als 78% aller Spieler. 🧠 Traust du dich? → [link]"
   - Share URL: `tbai.com.de/mindset-shift/share/{share_id}`
3. Share URL → Supabase Edge Function serves HTML with OG tags → LinkedIn crawler sees correct preview image
4. Human visitors → JS redirect to main app with challenge context

### 4.3 Challenge Links

- "Jemanden herausfordern" → generates unique challenge link
- Link contains 5 question IDs (same questions for both players)
- Challenger's score is stored
- Challenged person plays → sees comparison at the end

### 4.4 Invite & Referral

- Each user gets a unique invite code (shown in profile)
- `tbai.com.de/mindset-shift/?ref={code}` tracks invites
- 5 successful invites = Recruiter Gold badge

---

## 5. Authentication

### 5.1 Methods

- **Google OAuth** via Supabase Auth — primary, most widely used
- **LinkedIn OAuth** via Supabase Auth (OpenID Connect) — secondary, ideal for target audience
- **Email + Password** with email verification via Supabase Auth — third option for users who prefer no social login

All three methods presented on the auth screen in this order (Google top, LinkedIn second, email below divider).

### 5.2 Flow

1. Landing page is fully visible without login
2. Login required only when starting a quiz or accessing profile
3. LinkedIn/Google login: instant, no verification needed. Profile name + avatar auto-populated from social profile.
4. Email signup: email verification required before first play
5. Users can link additional auth methods later in profile settings

---

## 6. Data Model (Supabase Postgres)

### 6.1 Tables

**profiles**
- `id` uuid PK (= auth.users.id)
- `display_name` text
- `avatar_url` text
- `locale` text NOT NULL default 'de' (de | en)
- `level` int default 1
- `total_xp` int default 0
- `current_streak` int default 0
- `longest_streak` int default 0
- `last_played_at` date
- `invite_code` text unique
- `invited_by` uuid FK → profiles
- `team_name` text nullable
- `created_at` timestamptz

**questions**
- `id` uuid PK
- `external_id` text unique (e.g., DE-PA-001 / EN-PA-001)
- `locale` text NOT NULL (de | en)
- `pair_id` text nullable (links DE↔EN twin questions, e.g., "PA-001")
- `category` text NOT NULL
- `scenario_text` text NOT NULL
- `mindset_tip` text NOT NULL
- `options` jsonb NOT NULL (array of {text, score, feedbackText})
- `difficulty` int 1–3 (normal/hard/bonus)
- `is_active` bool default true
- `generated_by` text (manual/auto)
- `created_at` timestamptz

**daily_quizzes**
- `id` uuid PK
- `quiz_date` date unique per locale (Mo–Fr only)
- `locale` text NOT NULL (de | en)
- `question_ids` uuid[] (3 regular)
- `bonus_question_id` uuid
- `created_at` timestamptz
- UNIQUE(quiz_date, locale)

**quiz_attempts**
- `id` uuid PK
- `user_id` uuid FK → profiles
- `quiz_type` text (daily/freeplay/challenge)
- `daily_quiz_id` uuid FK nullable
- `category` text nullable (for freeplay)
- `total_score` int
- `max_streak` int
- `answers` jsonb (array of {question_id, selected_option, score, time_ms, streak_multi})
- `started_at` timestamptz
- `finished_at` timestamptz

**weekly_scores**
- `id` uuid PK
- `user_id` uuid FK → profiles
- `week_start` date (Monday)
- `daily_scores` jsonb ({mo, di, mi, do, fr})
- `total_score` int
- `rank` int nullable
- `is_champion` bool default false
- UNIQUE(user_id, week_start)

**user_badges**
- `id` uuid PK
- `user_id` uuid FK → profiles
- `badge_type` text
- `earned_at` timestamptz

**challenges**
- `id` uuid PK
- `challenger_id` uuid FK → profiles
- `question_ids` uuid[]
- `challenger_score` int
- `challenged_id` uuid FK nullable
- `challenged_score` int nullable
- `created_at` timestamptz
- `completed_at` timestamptz nullable

---

## 7. Backend Architecture (Supabase Edge Functions)

### 7.1 Game Logic (Anti-Cheat)

**`submit-answer`**
- Input: question_id, selected_option_index, time_ms
- Server-side: looks up question, calculates score with streak + speed bonus
- Returns: calculated score, feedback text, mindset tip, new streak state
- Anti-cheat: client never sees scores before answering; scoring is server-side only

**`get-daily-quiz`**
- Returns today's 3+1 questions WITHOUT score information in options
- Checks if user already played today
- If already played: returns attempt results instead

### 7.2 Social

**`create-challenge`** — generates challenge with 5 random questions, stores challenger score
**`generate-share-image`** — generates OG image PNG, stores in Supabase Storage
**`share-page`** — serves HTML with OG meta tags for LinkedIn crawler, JS redirect for humans

### 7.3 Cron Jobs

**`generate-questions`** (Sunday 23:00)
1. Check pool size per category **per locale** (minimum 50 active questions each, for both DE and EN)
2. Generate missing questions via Claude API — generates DE and EN as paired twins (same scenario, same `pair_id`)
3. Auto-validate: exactly 3 options, scores must be 100/0/−100, all text fields filled, category from CATEGORIES list
4. Insert valid questions into database with locale and pair_id
5. Assemble Daily Quizzes for Mon–Fri **for both locales** (same categories/difficulty, but locale-specific question pools)
6. No question reuse within 14 days per locale

**`weekly-champion`** (Monday 00:01)
1. Calculate final weekly rankings
2. Set `is_champion` flag on winner
3. Award `weekly_champion` badge
4. Generate champion share image

---

## 8. Question System

### 8.1 Categories (10)

Categories use English identifiers internally. Display names are localized.

| Internal ID | German | English |
|---|---|---|
| prompt-architecture | Prompt-Architektur | Prompt Architecture |
| creativity-ideation | Kreativität & Ideation | Creativity & Ideation |
| critical-thinking | Kritisches Denken & Validierung | Critical Thinking & Validation |
| efficiency-analysis | Effizienz & Analyse | Efficiency & Analysis |
| privacy-ethics | Datenschutz & Ethik | Privacy & Ethics |
| workflow-integration | Workflow-Integration | Workflow Integration |
| automation-agents | Automatisierung & Agenten | Automation & Agents |
| knowledge-research | Wissensmanagement & Recherche | Knowledge Management & Research |
| change-collaboration | Change & Zusammenarbeit | Change & Collaboration |
| quality-measurement | Messbarkeit & Qualität | Quality & Measurement |

### 8.2 Bilingual Question System

Questions exist as **paired twins** — same scenario, same scoring logic, different language. Linked via `pair_id`.

```json
// German twin
{
  "id": "uuid-1",
  "external_id": "DE-PA-001",
  "locale": "de",
  "pair_id": "PA-001",
  "category": "prompt-architecture",
  "scenarioText": "Du möchtest, dass die KI einen Blogpost im Stil...",
  "mindsetTip": "Few-Shot Prompting: Zeige der KI Beispiele...",
  "options": [
    {"text": "Option A (DE)...", "score": 0, "feedbackText": "Zu generisch..."},
    {"text": "Option B (DE)...", "score": 100, "feedbackText": "Perfekt!..."},
    {"text": "Option C (DE)...", "score": -100, "feedbackText": "Vorsicht!..."}
  ]
}

// English twin
{
  "id": "uuid-2",
  "external_id": "EN-PA-001",
  "locale": "en",
  "pair_id": "PA-001",
  "category": "prompt-architecture",
  "scenarioText": "You want the AI to write a blog post in your company's style...",
  "mindsetTip": "Few-Shot Prompting: Show the AI examples instead of just describing.",
  "options": [
    {"text": "Option A (EN)...", "score": 0, "feedbackText": "Too generic..."},
    {"text": "Option B (EN)...", "score": 100, "feedbackText": "Perfect!..."},
    {"text": "Option C (EN)...", "score": -100, "feedbackText": "Careful!..."}
  ]
}
```

### 8.3 Daily Quiz — Same Day, Same Difficulty, Both Languages

The Daily Quiz uses the same `pair_id` set for both languages. On a given day, a DE user and an EN user answer the **same scenarios** (translated), so the leaderboard stays fair and comparable.

Assembly logic:
1. Select 3 pair_ids + 1 bonus pair_id (from different categories, rotated)
2. For each locale, look up the question with matching pair_id and locale
3. Store in `daily_quizzes` table (one row per locale per day)

### 8.4 Initial Pool

The existing `questions.de.json` from the original Shift Happens repo (~150 questions) will be migrated as the DE seed pool. Scores adjusted from old −20 to new −100. English twins will be generated via Claude API translation with the same pair_ids.

### 8.5 Auto-Generation

- Claude API with structured output (JSON schema enforcement)
- **Generates both DE and EN twins in a single prompt** (same scenario, paired output)
- Batch generation: 10–20 question pairs per category per run
- Validation: schema check + score distribution check + no-duplicate check + both twins present
- Fully automatic — no manual review queue

### 8.6 UI Localization (i18n)

- User selects language on first visit or in profile settings
- Stored in `profiles.locale`
- All static UI strings (buttons, labels, headings) localized via a simple key-value i18n system (e.g., `react-intl` or lightweight custom)
- **Leaderboard is unified** — DE and EN users compete in the same ranking
- Share posts adapt to user's locale (German or English pre-written text)

---

## 9. Visual Design

### 9.1 Design Direction

**Dark deep blue with gradient, futuristic but clean.** Not pitch black, not bright white — a rich, deep blue gradient background that feels premium and modern.

### 9.2 Branding & Logo

**tbai Logo:** Crystalline 3D wordmark in ice-blue tones with cloud/particle effects. Transparent PNG.
- Source: `assets/tbai-cloud-logo-clear.png` (copied from OneDrive)
- Used in: Landing page footer, app header (small), share images, about section
- The logo's ice-blue color palette (#7DD3FC, #38BDF8, #0EA5E9) naturally complements the deep-blue app theme
- Landing page header shows "AI-Shift Happens" as text wordmark, tbai logo appears as "by tbai" attribution
- Share images (OG cards) include tbai logo watermark in bottom-right corner

### 9.3 Color Palette

| Role | Color | Hex |
|---|---|---|
| Background base | Deep navy | #080B1A |
| Background mid | Dark blue | #0D1330 |
| Background accent | Indigo-blue | #111B45 |
| Primary CTA | Electric indigo | #5B4FC7 → #3B82F6 (gradient) |
| Score/Success | Teal | #2DD4BF |
| Streak/Fire | Amber-orange | #F97316 |
| Champion/Gold | Gold | #FBBF24 |
| Social/Challenge | Rose | #DB2777 |
| Danger | Crimson | #DC2626 |
| Text primary | Near-white | #E8E6F0 |
| Text muted | Soft lavender | #726D82 |

### 9.4 Typography

- **Headlines:** Space Grotesk (weight 700–800)
- **Scores/Data:** JetBrains Mono (monospace)
- **Body:** Space Grotesk (weight 400–500)

### 9.5 Landing Page Design

Full-page scrolling landing at `tbai.com.de/mindset-shift/`:

1. **Hero Section** — Deep blue gradient background with subtle grid overlay and glow orbs. Title "AI-Shift Happens" and headline "Wie AI-ready bist du wirklich?". CTA buttons. 5 NanoBanana Pro/Stitch-generated images of diverse, enthusiastic people with smartphones showing the app, each with a badge overlay (AI Dirigent, Streak, Champion, etc.). Social proof bar.
2. **So funktioniert's** — 3 glass-morphic cards explaining the flow
3. **Tägliches AI-Training** — Split layout with features left, mini phone mockup right
4. **Gamification Grid** — Streaks, Challenges, Team Battles, Badges
5. **Level Timeline** — Visual progression from AI Rookie to AI Dirigent
6. **Bottom CTA** — Final conversion with auth options (Google + Email)

### 9.6 App Screens (Mobile-First)

All app screens use the same deep blue gradient palette:
- **Dashboard:** Dark header with greeting, floating streak card, purple daily quiz card, level progress, 4-column quick nav
- **Quiz:** Scenario in elevated card with gradient top-border, timer bar, options with hover states
- **Feedback:** Big score display, explanation, mindset-tip with accent border
- **Result:** Dark-to-card transition, score ring, stats, badge unlocks, share buttons
- **Leaderboard:** Podium view for top 3, list card for rest, "Du" highlighted

### 9.7 Hero Images (NanoBanana Pro)

Prompt concepts for final hero images:

**Photo-realistic:** "A diverse group of 5 professionals in modern office attire, each holding a glowing smartphone, standing confidently. Warm cinematic lighting, deep indigo and teal tones, slightly futuristic corporate environment. They look excited and engaged. Clean background with subtle digital particles. Full body shot, editorial photography style."

**Illustrative:** "Five friendly professionals using smartphones, surrounded by floating AI icons (brain, lightning, shield, graph). Flat illustration style with depth, deep navy and teal gradient background, warm amber accents. Modern, clean, inviting."

---

## 10. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS 4 + Framer Motion |
| Auth | Supabase Auth (Google + LinkedIn OAuth + Email/Password) |
| Database | Supabase Postgres |
| Server Logic | Supabase Edge Functions (Deno) |
| AI Generation | Claude API (question generation) |
| Image Storage | Supabase Storage (share images) |
| Hosting | Static build → GitHub Actions → SFTP → Strato |
| URL | `tbai.com.de/mindset-shift/` (basePath config) |

### 10.1 Architecture: SPA + Edge Functions (Approach B)

- React SPA as static files on Strato (`/mindset-shift/`)
- All game logic server-side via Supabase Edge Functions (anti-cheat)
- Share URLs served by Edge Functions with correct OG meta tags
- Human visitors redirected to SPA via JS
- Cron jobs via Supabase scheduled functions

---

## 11. Deployment

### 11.1 Build

```bash
vite build --base=/mindset-shift/
```

### 11.2 Deploy

GitHub Actions workflow:
1. Build static files
2. SFTP upload to Strato (`./site/mindset-shift/`)

### 11.3 Supabase

- Edge Functions deployed via `supabase functions deploy`
- Cron jobs configured in Supabase dashboard
- RLS policies on all tables (users can only read/write their own data)

---

## 12. Out of Scope (v1)

- Push notifications (browser notifications for streak reminders — v2)
- Dark/Light mode toggle (ships dark only)
- Admin panel for manual question editing (auto-generation only)
- Mobile native app (PWA considered for v2)
- Payment/Premium features (everything is free)
- Languages beyond DE/EN (v2 if needed)

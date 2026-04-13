# AI-Shift Happens — Plan 3: Landing Page + Viral Features

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an epic dark deep-blue landing page that converts visitors into players, plus LinkedIn share functionality from the result screen.

**Architecture:** Landing page as a new route (`/`) that non-authenticated users see. The existing dashboard moves to `/app`. Share functionality generates a LinkedIn share URL with pre-written post text. App uses the tbai cloud logo and Space Grotesk + JetBrains Mono fonts already configured.

**Tech Stack:** React 19, Tailwind CSS 4, Framer Motion (already installed)

**Spec:** `docs/superpowers/specs/2026-04-12-ai-shift-happens-design.md` — Sections 4 (Viral), 9.5 (Landing Page Design)

---

## File Structure

```
src/
├── pages/
│   └── LandingPage.tsx          # Epic landing page (new)
├── components/
│   ├── landing/
│   │   ├── HeroSection.tsx      # Hero with headline, CTA, social proof
│   │   ├── HowItWorks.tsx       # 3-step explanation cards
│   │   ├── FeaturesGrid.tsx     # Gamification features grid
│   │   ├── LevelTimeline.tsx    # AI Rookie → AI Dirigent visual
│   │   └── BottomCTA.tsx        # Final conversion section
│   └── ResultScreen.tsx         # Modify: add LinkedIn share button
├── App.tsx                      # Modify: landing route for unauthenticated
```

---

### Task 1: Landing Page — Hero Section

**Files:**
- Create: `src/components/landing/HeroSection.tsx`

- [ ] **Step 1: Create HeroSection component**

Full-width hero with deep blue gradient, headline, CTA buttons, and social proof bar. Use Framer Motion for entrance animations.

```tsx
import { motion } from 'framer-motion'

interface HeroSectionProps {
  onStart: () => void
  locale: 'de' | 'en'
}

export default function HeroSection({ onStart, locale }: HeroSectionProps) {
  const isDE = locale === 'de'

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-5 py-16 overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(59,40,150,0.4), transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(14,116,144,0.25), transparent 50%), linear-gradient(180deg, #080B1A 0%, #0D1330 40%, #111B45 70%, #0D1330 100%)' }}>

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px', maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)' }} />

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-2 mb-10">
          <span className="text-2xl">🧠</span>
          <span className="text-sm font-bold tracking-[0.2em] uppercase text-white/50">AI-Shift Happens</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-extrabold leading-tight mb-5"
        >
          {isDE ? 'Wie ' : 'How '}
          <span className="bg-gradient-to-r from-[#A78BFA] via-[#38BDF8] to-[#2DD4BF] bg-clip-text text-transparent">
            AI-ready
          </span>
          {isDE ? ' bist du wirklich?' : ' are you really?'}
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-white/50 max-w-md mx-auto mb-8 leading-relaxed"
        >
          {isDE
            ? 'Teste dein KI-Mindset in realistischen Büroszenarien. Tägliches Quiz, Leaderboard, Wochen-Champion. Kostenlos. 3 Minuten pro Tag.'
            : 'Test your AI mindset in realistic office scenarios. Daily quiz, leaderboard, weekly champion. Free. 3 minutes per day.'}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 justify-center mb-12"
        >
          <button
            onClick={onStart}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-[#3B82F6] text-white font-bold text-lg shadow-[0_0_30px_rgba(91,79,199,0.3)] hover:shadow-[0_0_50px_rgba(91,79,199,0.4)] hover:-translate-y-0.5 transition-all"
          >
            {isDE ? 'Jetzt kostenlos starten' : 'Start free now'}
          </button>
          <a
            href="#how-it-works"
            className="px-8 py-4 rounded-2xl border border-white/10 bg-white/4 text-white/60 font-semibold hover:bg-white/8 hover:text-white transition-all backdrop-blur-sm"
          >
            {isDE ? 'So funktioniert\'s ↓' : 'How it works ↓'}
          </a>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex gap-8 justify-center pt-6 border-t border-white/6"
        >
          {[
            { num: '10', label: isDE ? 'Kategorien' : 'Categories' },
            { num: '3 Min', label: isDE ? 'Pro Tag' : 'Per Day' },
            { num: '100%', label: isDE ? 'Kostenlos' : 'Free' },
          ].map(item => (
            <div key={item.label} className="text-center">
              <div className="text-xl font-extrabold font-mono bg-gradient-to-r from-[#A78BFA] to-[#38BDF8] bg-clip-text text-transparent">{item.num}</div>
              <div className="text-xs text-white/30 uppercase tracking-wider mt-1">{item.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/HeroSection.tsx
git commit -m "feat: add landing page hero section"
```

---

### Task 2: Landing Page — How It Works + Features + Level Timeline + Bottom CTA

**Files:**
- Create: `src/components/landing/HowItWorks.tsx`
- Create: `src/components/landing/FeaturesGrid.tsx`
- Create: `src/components/landing/LevelTimeline.tsx`
- Create: `src/components/landing/BottomCTA.tsx`

- [ ] **Step 1: Create all four components**

**HowItWorks.tsx** — 3 glass-morphic cards explaining the flow (Quiz → Learn → Champion):
- id="how-it-works" for anchor link from hero
- 3 cards with emoji, title, description
- Dark bg with subtle border

**FeaturesGrid.tsx** — 4-column grid: Streaks, Challenges, Team Battles, Badges
- Each card: emoji, title, description
- Hover effect with primary border glow

**LevelTimeline.tsx** — Horizontal dots from AI Rookie to AI Dirigent
- 6 level nodes with emojis
- Connected by gradient line
- Last node (AI Dirigent) has gold glow

**BottomCTA.tsx** — Final conversion section
- "Bereit für deinen Mindset-Shift?"
- Big CTA button
- "Anmeldung mit Google oder E-Mail" note
- tbai logo (from /tbai-logo.png)

All components receive `locale: 'de' | 'en'` and `onStart: () => void` props.

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/
git commit -m "feat: add HowItWorks, FeaturesGrid, LevelTimeline, BottomCTA"
```

---

### Task 3: Landing Page Assembly + Routing

**Files:**
- Create: `src/pages/LandingPage.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create LandingPage**

`src/pages/LandingPage.tsx` — assembles all landing sections:
```tsx
import { useNavigate } from 'react-router-dom'
import { useLocale } from '../hooks/useLocale'
import HeroSection from '../components/landing/HeroSection'
import HowItWorks from '../components/landing/HowItWorks'
import FeaturesGrid from '../components/landing/FeaturesGrid'
import LevelTimeline from '../components/landing/LevelTimeline'
import BottomCTA from '../components/landing/BottomCTA'

export function LandingPage() {
  const navigate = useNavigate()
  const { locale, setLocale } = useLocale()

  const handleStart = () => navigate('/login')

  return (
    <div className="bg-bg-base text-text-primary font-sans">
      {/* Language toggle floating */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setLocale(locale === 'de' ? 'en' : 'de')}
          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-colors backdrop-blur-sm"
        >
          {locale === 'de' ? '🇬🇧 EN' : '🇩🇪 DE'}
        </button>
      </div>

      <HeroSection onStart={handleStart} locale={locale} />
      <HowItWorks locale={locale} />
      <FeaturesGrid locale={locale} />
      <LevelTimeline locale={locale} />
      <BottomCTA onStart={handleStart} locale={locale} />

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-white/15 border-t border-white/4">
        © {new Date().getFullYear()} AI-Shift Happens by tbai
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: Update App.tsx routing**

Change routing so:
- `/` → LandingPage (always, no auth required)
- `/login` → AuthScreen
- `/app` → DashboardPage (auth required)
- `/app/daily` → DailyQuizPage (auth required)
- `/app/leaderboard` → LeaderboardPage
- `/app/profile` → ProfilePage

After login, redirect to `/app`.

- [ ] **Step 3: Update DashboardPage links**

Update internal links from `/daily` to `/app/daily`, `/leaderboard` to `/app/leaderboard`, `/profile` to `/app/profile`.

- [ ] **Step 4: Verify and commit**

```bash
npx tsc --noEmit
git add src/pages/LandingPage.tsx src/App.tsx src/pages/DashboardPage.tsx
git commit -m "feat: add epic landing page with routing"
```

---

### Task 4: LinkedIn Share on Result Screen

**Files:**
- Modify: `src/components/ResultScreen.tsx`

- [ ] **Step 1: Add LinkedIn share button**

Add after the existing gamification display, before the back button:

```tsx
{/* LinkedIn Share */}
<button
  onClick={() => {
    const text = locale === 'de'
      ? `Ich bin ${levelTitle}! ${score} Punkte im AI-Shift Happens Quiz. 🧠 Wie AI-ready bist du? → https://tbai.com.de/mindset-shift/`
      : `I'm ${levelTitle}! ${score} points in the AI-Shift Happens Quiz. 🧠 How AI-ready are you? → https://tbai.com.de/mindset-shift/`
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://tbai.com.de/mindset-shift/')}&text=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400')
  }}
  className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 mb-3"
>
  🔗 {t('result.shareLinkedin')}
</button>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ResultScreen.tsx
git commit -m "feat: add LinkedIn share button on result screen"
```

---

### Task 5: Copy tbai logo + Final Polish + Push

**Files:**
- Copy: `assets/tbai-cloud-logo-clear.png` → `public/tbai-logo.png`

- [ ] **Step 1: Copy logo to public folder**

```bash
cp assets/tbai-cloud-logo-clear.png public/tbai-logo.png
```

- [ ] **Step 2: Verify everything builds**

```bash
npx tsc --noEmit
npx vitest run
npx vite build
```

- [ ] **Step 3: Final commit + push (triggers deploy)**

```bash
git add -A
git commit -m "feat: Plan 3 complete — epic landing page, LinkedIn share, viral features"
git push origin master
```

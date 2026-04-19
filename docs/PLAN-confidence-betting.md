# Confidence Betting + SHIFT Buddy — Implementierungsplan

> **Status: IMPLEMENTIERT (19.04.2026)**
> Speed-Bonus durch Confidence-Betting ersetzt, SHIFT-Buddy mit zwei Persoenlichkeiten (serioes/frech) eingefuehrt, Bullshit-Detektor-Fragen markierbar.

## Uebersicht der Aenderungen

| Bereich | Was aendert sich |
|---------|-----------------|
| Scoring | Speed-Bonus → Confidence-Multiplikator (1x/2x/3x), asymmetrisches Risiko |
| DB | `shift_mode` in profiles, `is_bullshit_trap` in questions, `confidence` in quiz_answers |
| Edge Functions | submit-answer + finish-daily: neue Scoring-Formel + Kalibrierungs-Bonus |
| Frontend | Confidence-Auswahl in QuizCard, SHIFT-Kommentare in FeedbackCard |
| Onboarding | Neuer Step: SHIFT-Style waehlen |
| Badges | 6 neue Badges (Realist, All-In, Pokerface, Bullshit-Radar, Berater-Killer, Overconfident) |

---

## Task 1: Datenbank-Migration (009_confidence_betting.sql)

**Datei:** `supabase/migrations/009_confidence_betting.sql`

```sql
-- Confidence-Betting: Neue Felder
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS shift_mode text NOT NULL DEFAULT 'cheeky'
  CHECK (shift_mode IN ('serious', 'cheeky'));

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS is_bullshit_trap boolean NOT NULL DEFAULT false;

-- quiz_answers braucht confidence (1=vorsichtig, 2=mittel, 3=sicher)
-- Wird in finish-daily als Teil der answers JSONB gespeichert

-- RLS: shift_mode darf der User selbst updaten
-- (profiles UPDATE policy existiert bereits, shift_mode zur Allowlist hinzufuegen)
```

**Auch aendern:** `supabase/functions/admin/index.ts` — `shift_mode` zur ALLOWED_FIELDS Liste der RLS-sicheren Spalten hinzufuegen (Zeile ~106).

---

## Task 2: Constants & Types aktualisieren

### 2a: `src/types/index.ts`

```typescript
// AnswerResult: speed_bonus entfernen, confidence hinzufuegen
export interface AnswerResult {
  question_id: string
  selected_index: number
  confidence: 1 | 2 | 3           // NEU
  base_score: number
  streak_multi: number
  confidence_multi: number         // NEU (ersetzt speed_bonus)
  bonus_multi: number
  total_score: number
  feedback_text: string
  mindset_tip: string
  is_correct: boolean
  is_dangerous: boolean
  is_bullshit_trap?: boolean       // NEU
  shift_quote?: string             // NEU — SHIFT's Kommentar
  time_ms?: number
}

// Profile: shift_mode hinzufuegen
export interface Profile {
  // ... bestehende Felder ...
  shift_mode: 'serious' | 'cheeky'  // NEU
}
```

### 2b: `src/lib/constants.ts`

```typescript
// ENTFERNEN:
// export const SPEED_BONUS_MAX = 50
// export const SPEED_BONUS_DECAY = 1.67

// NEU: Confidence-Scoring
export const CONFIDENCE_SCORES = {
  //         richtig  falsch  bullshit_falsch
  1: { correct:  50, wrong:    0, bullshit:    0 },  // Vorsichtig
  2: { correct: 150, wrong:  -50, bullshit:  -75 },  // Mittel
  3: { correct: 300, wrong: -150, bullshit: -200 },  // Sicher
} as const

export const CALIBRATION_BONUS = 100
export const CALIBRATION_MALUS = -100
export const BULLSHIT_DETECT_BONUS = 50

export type ConfidenceLevel = 1 | 2 | 3

export const CONFIDENCE_LABELS = {
  1: { de: 'Hmm...', en: 'Hmm...', emoji: '🤔' },
  2: { de: 'Ziemlich sicher', en: 'Pretty sure', emoji: '🎯' },
  3: { de: 'Absolut sicher', en: 'Absolutely sure', emoji: '🔥' },
} as const
```

### 2c: SHIFT-Sprueche in eigener Datei `src/lib/shift-quotes.ts`

Neue Datei mit allen ~144 Spruechen (72 DE + 72 EN), strukturiert nach:
```typescript
export const SHIFT_QUOTES: Record<string, { serious: { de: string[], en: string[] }, cheeky: { de: string[], en: string[] } }> = {
  confident_correct: { serious: { de: [...], en: [...] }, cheeky: { de: [...], en: [...] } },
  confident_wrong: { ... },
  confident_bullshit: { ... },
  cautious_correct: { ... },
  cautious_wrong: { ... },
  medium_correct: { ... },
  medium_wrong: { ... },
}
```

Deterministischer Pick: `hash(question_id + user_id) % array.length`

### 2d: Neue Badges in `constants.ts` BADGES Array

```typescript
{ type: 'bullshit_radar', emoji: '🎭', title: { de: 'Bullshit-Radar', en: 'BS Radar' }, description: { de: '10 Bullshit-Fallen erkannt', en: '10 BS traps detected' } },
{ type: 'berater_killer', emoji: '💀', title: { de: 'Berater-Killer', en: 'Consultant Killer' }, description: { de: '20 Bullshit-Fallen erkannt', en: '20 BS traps detected' } },
{ type: 'realist', emoji: '🧭', title: { de: 'Realist', en: 'Realist' }, description: { de: '10 Quizzes mit >80% Kalibrierung', en: '10 quizzes with >80% calibration' } },
{ type: 'all_in', emoji: '🃏', title: { de: 'All-In', en: 'All-In' }, description: { de: '5x Sicher + richtig hintereinander', en: '5x confident + correct in a row' } },
{ type: 'pokerface', emoji: '🎰', title: { de: 'Pokerface', en: 'Poker Face' }, description: { de: 'Jede Confidence-Stufe in einem Quiz genutzt', en: 'Used every confidence level in one quiz' } },
{ type: 'overconfident', emoji: '🤡', title: { de: 'Overconfident', en: 'Overconfident' }, description: { de: '3x Sicher + falsch in einer Woche', en: '3x confident + wrong in one week' } },
```

---

## Task 3: Scoring-Logik umbauen

### 3a: `src/lib/scoring.ts` — komplett neue Formel

```typescript
import { CONFIDENCE_SCORES, CALIBRATION_BONUS, CALIBRATION_MALUS, BULLSHIT_DETECT_BONUS, STREAK_MULTIPLIERS, BONUS_MULTIPLIER } from './constants'
import type { ConfidenceLevel } from './constants'

interface ScoreInput {
  optionScore: number
  streakCount: number
  confidence: ConfidenceLevel
  isBonus: boolean
  isBullshitTrap: boolean
}

interface ScoreResult {
  base_score: number
  streak_multi: number
  confidence_multi: number
  bonus_multi: number
  total_score: number
  is_correct: boolean
  is_dangerous: boolean
}

export function calculateScore(input: ScoreInput): ScoreResult {
  const { optionScore, streakCount, confidence, isBonus, isBullshitTrap } = input
  const is_correct = optionScore === 100
  const is_dangerous = optionScore < 0

  const scores = CONFIDENCE_SCORES[confidence]
  let base_score: number

  if (is_correct) {
    base_score = scores.correct
  } else if (isBullshitTrap && !is_correct) {
    base_score = scores.bullshit  // Extra-Malus bei Bullshit-Falle
  } else {
    base_score = scores.wrong
  }

  const streak_multi = is_correct ? getStreakMultiplier(streakCount, isBonus) : 1.0
  const bonus_multi = isBonus ? BONUS_MULTIPLIER : 1.0
  const confidence_multi = confidence  // Fuer Anzeige

  const total_score = is_correct
    ? Math.round(base_score * streak_multi * bonus_multi)
    : base_score

  return { base_score, streak_multi, confidence_multi, bonus_multi, total_score, is_correct, is_dangerous }
}

// Kalibrierungs-Bonus am Quiz-Ende
export function calculateCalibrationBonus(answers: Array<{ confidence: ConfidenceLevel, is_correct: boolean }>): number {
  const confidentAnswers = answers.filter(a => a.confidence === 3)
  if (confidentAnswers.length === 0) return 0

  const confidentCorrectRate = confidentAnswers.filter(a => a.is_correct).length / confidentAnswers.length

  if (confidentCorrectRate >= 0.8) return CALIBRATION_BONUS
  if (confidentCorrectRate < 0.5) return CALIBRATION_MALUS
  return 0
}

// Bullshit-Detektor-Bonus
export function calculateBullshitBonus(answers: Array<{ is_bullshit_trap: boolean, confidence: ConfidenceLevel, is_correct: boolean }>): number {
  return answers.filter(a =>
    a.is_bullshit_trap && a.confidence < 3  // Nicht "Sicher" auf Bullshit = erkannt
  ).length * BULLSHIT_DETECT_BONUS
}
```

### 3b: Tests in `src/lib/__tests__/scoring.test.ts` aktualisieren

Alle bestehenden Tests auf die neue Signatur umschreiben (confidence statt answerTimeMs, isBullshitTrap Parameter). Neue Tests:
- Sicher + richtig = 300
- Sicher + falsch = -150
- Sicher + Bullshit-Falle = -200
- Kalibrierungs-Bonus bei >80% Trefferquote
- Kalibrierungs-Malus bei <50%

---

## Task 4: Edge Functions anpassen

### 4a: `supabase/functions/submit-answer/index.ts`

Aenderungen:
- Neuer Parameter `confidence: 1 | 2 | 3` (Pflichtfeld)
- `is_bullshit_trap` aus Frage lesen
- Speed-Bonus-Logik komplett entfernen
- Neue Scoring-Formel mit Confidence
- SHIFT-Spruch generieren (deterministisch aus question_id + user_id Hash)
- Response: `speed_bonus` → `confidence_multi`, + `is_bullshit_trap` + `shift_quote`

### 4b: `supabase/functions/finish-daily/index.ts`

Aenderungen:
- Kalibrierungs-Bonus berechnen (aus allen Antworten)
- Bullshit-Detektor-Bonus berechnen
- Neue Badges pruefen: bullshit_radar, berater_killer, realist, all_in, pokerface, overconfident
- `speed_bonus` Referenzen entfernen

### 4c: `supabase/functions/get-daily-quiz/index.ts`

Aenderung: `is_bullshit_trap` Feld NICHT an Client senden (wuerde die Falle verraten). Stattdessen nach der Antwort im submit-answer zurueckgeben.

---

## Task 5: Frontend — QuizCard mit Confidence-Auswahl

### `src/components/QuizCard.tsx`

Neuer Flow:
1. User sieht Frage + 3 Antworten (wie bisher)
2. User waehlt Antwort → Antwort wird hervorgehoben
3. **NEU:** Confidence-Leiste erscheint (animiert, slide-up)
4. User waehlt Confidence (1/2/3)
5. Bestaetigen-Button → submitAnswer wird aufgerufen

```
┌─ Antwort gewaehlt ──────────────────┐
│                                      │
│  Wie sicher bist du?                 │
│                                      │
│  [🤔 Hmm]  [🎯 Sicher]  [🔥 Voll]  │
│                                      │
│        [ Bestaetigen → ]             │
└──────────────────────────────────────┘
```

Props-Aenderung: `onSelect: (index: number)` → `onSubmit: (index: number, confidence: ConfidenceLevel)`

---

## Task 6: Frontend — FeedbackCard mit SHIFT

### `src/components/FeedbackCard.tsx`

Aenderungen:
- MOTIVATIONAL-Objekt entfernen (wird durch SHIFT-Sprueche ersetzt)
- Neues SHIFT-Panel: Emoji + Spruch-Blase
- Bullshit-Detektor-Label wenn `is_bullshit_trap`
- Score-Breakdown: "🔥 Sicher × Richtig = +300" statt Speed-Bonus

```
┌─ Feedback ───────────────────────────┐
│                                      │
│  ✅ Richtig!        🤖/😎 SHIFT     │
│                                      │
│  +300                                │
│  ┌──────────────────────────────┐    │
│  │ 💬 "No cap — das war clean." │    │
│  └──────────────────────────────┘    │
│                                      │
│  🎭 Bullshit-Detektor!              │
│  Antwort B war eine Falle. +50       │
│                                      │
│  💡 Mindset-Tip: ...                │
│                                      │
│         [ Weiter → ]                 │
└──────────────────────────────────────┘
```

---

## Task 7: Frontend — useQuiz Hook anpassen

### `src/hooks/useQuiz.ts`

Aenderungen:
- `submitAnswer` Signatur: `(selectedIndex: number, timeMs: number)` → `(selectedIndex: number, confidence: ConfidenceLevel, timeMs: number)`
- Body an submit-answer: `confidence` Feld hinzufuegen
- AnswerResult-Mapping: `confidence_multi` statt `speed_bonus`

---

## Task 8: Onboarding — SHIFT-Style waehlen

### `src/components/Onboarding.tsx`

Neuer Step 2 (nach "Willkommen", vor "Level Up"):

```
🤖 Waehle deinen SHIFT-Style

Dein KI-Buddy SHIFT kommentiert jede Antwort.

┌──────────┐  ┌──────────┐
│  🎩      │  │  😎      │
│ SERIOES  │  │ FRECH    │
│ Klar.    │  │ Fresh.   │
│ Direkt.  │  │ Memes.   │
│ Mentor.  │  │ Bestie.  │
└──────────┘  └──────────┘

Jederzeit im Profil aenderbar.
```

Bei Auswahl: `shift_mode` im Profil speichern via Supabase.

---

## Task 9: Profil — SHIFT-Mode Toggle

### `src/pages/ProfilePage.tsx`

Neuer Abschnitt "SHIFT-Style" mit Toggle zwischen 🎩 Serioes und 😎 Frech. Update via Supabase profiles.

---

## Task 10: TimerBar anpassen

### `src/components/TimerBar.tsx`

- Timer bleibt sichtbar als Soft-Limit (60 Sekunden)
- Kein Score-Einfluss mehr
- Visuelle Aenderung: weniger aggressiv (keine rote Farbe bei niedrig)
- Bei 0: Frage wird uebersprungen (time-out), 0 Punkte

---

## Task 11: Bestehende Fragen als Bullshit-Trap markieren

### Admin-Action oder Migration-Script

Ca. 15% der Fragen (~130 von 860+) als `is_bullshit_trap = true` markieren.

Kriterien fuer Bullshit-Trap:
- Die falsche Antwort klingt wie ein LinkedIn-Post / Berater-Sprech
- Benutzt Buzzwords: "ganzheitlich", "synergistisch", "transformativ", "Cross-funktional"
- Klingt beeindruckend, ist aber inhaltsleer

Kann via Admin-Panel manuell oder via Claude API automatisch erfolgen.

---

## Task 12: Onboarding-Text + FAQ updaten

- Onboarding Step 2 (Scoring): Speed-Bonus Text → Confidence-Betting Text
- FAQ: Neue Frage "Was ist das Confidence-System?" + "Wer ist SHIFT?"
- Landing Page: Feature-Grid aktualisieren

---

## Reihenfolge der Implementierung

```
1. Migration (Task 1)           — DB-Schema erweitern
2. Constants & Types (Task 2)   — Neue Typen, Sprueche, Badges
3. Scoring-Logik (Task 3)       — Neue Formel + Tests
4. Edge Functions (Task 4)      — Backend-Logik
5. useQuiz Hook (Task 7)        — State-Management
6. QuizCard (Task 5)            — Confidence-UI
7. FeedbackCard (Task 6)        — SHIFT-Buddy-UI
8. TimerBar (Task 10)           — Soft-Timer
9. Onboarding (Task 8)          — SHIFT-Auswahl
10. Profil (Task 9)             — Mode-Toggle
11. Bullshit-Markierung (Task 11) — Fragen taggen
12. Texte (Task 12)             — FAQ, Landing, Onboarding
```

---

## Was entfaellt

- `SPEED_BONUS_MAX` und `SPEED_BONUS_DECAY` aus constants.ts
- Speed-Bonus-Berechnung aus scoring.ts und submit-answer
- `speed_bonus` Feld aus AnswerResult (wird zu `confidence_multi`)
- Aggressive Timer-Farben
- `speed_demon` Badge (basierte auf Antwortzeit)

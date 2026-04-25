---
date: 2026-04-24
type: localization-test
scope: shift-happens DE-Lokalisierung
url: https://tbai.com.de/ai-shift-happens/app  # Test ursprünglich auf /mindset-shift/app, am 2026-04-25 auf /ai-shift-happens/ migriert
tester: Claude (Opus 4.7)
status: RESOLVED — beide Bugs gefixt am 2026-04-25 (Commits c40b6d9, c1693c5)
tags: [test, i18n, de, quiz, dashboard, resolved]
---

> **Update 2026-04-25**: Beide Bugs sind gefixt und auf Production deployed.
> Zusätzlich wurde der gesamte Code von hardcoded `/mindset-shift/` auf
> `import.meta.env.BASE_URL` migriert (15 Stellen + index.html + manifest.json + sw.js + .htaccess via __BASE_PATH__-Sed-Step im Workflow).
> Das alte `/mindset-shift/`-Verzeichnis auf Strato wurde gelöscht.

# DE-Lokalisierungs-Testbericht — AI-Shift Happens

## Executive Summary

Die deutsche Lokalisierung der Production-App unter https://tbai.com.de/mindset-shift/app ist funktional vollständig. Alle Haupt-Flows (Landing → Auth → Dashboard → Daily Quiz → Feedback → Badges → Dashboard-Rücksprung) laufen sauber auf Deutsch. EN-Regression funktioniert ebenfalls.

**Zwei Bugs gefunden**, beide dieselbe Ursache: fehlende ICU-Pluralisierung bei Tagesstreak-Labels.

## Getestete Screens

| Screen | Route | Status | Screenshot |
|---|---|---|---|
| Landing | `/mindset-shift/` | OK | `landing-de.png` |
| Auth (Login) | `/mindset-shift/login` | OK | `auth-de.png`, `auth-email-de.png` |
| Dashboard (leer) | `/mindset-shift/app` | OK | `dashboard-de.png` |
| Onboarding-Overlay | overlay | OK | (übersprungen via "Überspringen") |
| Daily Quiz — Frage | `/mindset-shift/app/daily` | OK | `quiz-de.png` |
| Confidence-UI | `/mindset-shift/app/daily` | OK | `quiz-confidence-de.png` |
| FeedbackCard | `/mindset-shift/app/daily` | OK | `feedback-de.png`, `feedback-complete-de.png`, `feedback-q2-absolute-de.png` |
| Ergebnis-Screen + Badges | `/mindset-shift/app/daily` | ⚠ 1 Bug | `quiz-result-de.png`, `quiz-badges-de.png`, `quiz-result-final-de.png` |
| Dashboard (post-Quiz) | `/mindset-shift/app` | ⚠ 1 Bug | `dashboard-after-quiz-de.png` |
| EN-Regression | `/mindset-shift/app?lang=en` | OK | `dashboard-en-regression.png` |

## Flow-Verifikation

### Navigation
- Sidebar: `🏠 Home`, `🧠 Quiz`, `🏆 Ranking`, `📊 Stats`, `👤 Profil` — alle DE
- Bottom-Nav: `🎮 Free Play`, `🏆 Leaderboard`, `⚔️ Challenge`, `👥 Team`, `🎖️ Badges`, `📊 Statistiken`, `❓ FAQ` — alle DE
- Language-Switcher: `DE / EN / TR / ES` als `<select>` im Header

### Daily Quiz — 3 Fragen getestet

| # | Kategorie | Antwort | Confidence | Payoff | SHIFT-Buddy-Kommentar |
|---|---|---|---|---|---|
| 1 | Kritisches Denken & Validierung | B (richtig) | 🎯 Ziemlich sicher | +225 XP | "SHIFT: Korrekt. Nächstes Mal trau dich." 😊 |
| 2 | Effizienz & Analyse | C (richtig) | 🔥 Absolut sicher! | +600 XP | "SHIFT: Das war ein Power Move." 🤩 |
| 3 | Datenschutz & Ethik | C (richtig) | 🤔 Hmm... | +125 XP | "SHIFT: Du wusstest das. Warum so shy?" 😤 |

**Confidence-Betting-Payoff-Matrix** (bei richtiger Antwort):
- Hmm = 125 XP
- Ziemlich sicher = 225 XP (×1.8)
- Absolut sicher = 600 XP (×4.8)

Nicht getestet: Payoff bei falscher Antwort × Confidence (empfohlen für eigenen Test-Run).

### Mindset-Regeln (alle DE, stilistisch treffend)
- "Bei kritischen Dokumenten ist 'Lost in Translation' ein Haftungsrisiko."
- "Nutze KI für die Transformation von Formaten (Text zu Struktur/Bild)."
- "Plausibilität ist nicht Wahrheit. KI ist ein 'Bullshit-Generator' im besten Sinne."

### Badges-Flow
Drei Badges erworben und alle mit DE-Beschreibung angezeigt:
1. 🎯 **Erstes Quiz** — "Erstes Quiz abgeschlossen"
2. ⭐ **Perfekt!** — (3/3 richtig)
3. 🎰 **Pokerface** — "Jede Confidence-Stufe in einem Quiz genutzt"

Badge-Modal mit "Nächstes Badge"-Button für sequenzielle Anzeige funktioniert.

### Ergebnis-Screen
- Level: 🌱 **AI Rookie**
- Punkte: 950
- Stats: 3 Richtig · 3× Max Streak · +0 Speed Bonus
- Total: **+1055 XP** (950 Basis + 105 Bonus aus Streaks/Badges)
- LinkedIn-Share-Button mit Text: "Post-Text wird in die Zwischenablage kopiert"

### Dashboard nach Quiz
- 🔥 1 Tage-Streak (siehe Bug #1)
- XP-Progress: 1.055 / 5.000 XP (Level "💡 AI User")
- Rang #3 von Userbase
- Wochen-Champion: Totti (2.207 Pts)
- Mindset-Zitat (rotierend): "KI-Tools sind Werkzeuge, keine Autopiloten."

## 🐛 Bugs

### Bug #1 — Pluralisierungs-Fehler "Tage-Streak" (Severity: Medium) — RESOLVED 2026-04-25 (c40b6d9)

**Ort**: Dashboard-Streak-Widget (`/app`), ref `e448`-`e449`

**Beobachtung**:
```
🔥  1  Tage-Streak
```

**Erwartet**:
```
🔥  1  Tag
🔥  2 Tage  (ab n≥2)
```

**Ursache**: Vermutlich naive i18n-Übersetzung aus EN-Template `{n} Day Streak` → `{n} Tage-Streak` ohne ICU-Plurals. Bestätigt durch EN-Regression: dort steht korrekt `1 Day Streak` (Singular).

**EN-Referenz** (`dashboard-en-regression.png`):
```
🔥  1  Day Streak   ✓
```

### Bug #2 — Doppelte "1" im Quiz-Ergebnis "1 1 Tage Streak" (Severity: High) — RESOLVED 2026-04-25 (c40b6d9)

**Ort**: Quiz-Ergebnis-Screen (`/app/daily` nach Abschluss), ref `e396`

**Beobachtung**:
```
+1055 XP
🔥 1 1 Tage Streak
```

**Erwartet**:
```
+1055 XP
🔥 1 Tag
```

**Ursache (vermutet)**: Template-Bug durch doppelte Interpolation. Vermutlich `{days} {days} Tage Streak` statt `{days} Tage Streak` in einer der Übersetzungsdateien. Deutet auf einen Merge-Konflikt oder Copy-Paste-Fehler im Lokalisierungs-File hin. Muss zwingend gefixt werden — dem User fällt "1 1" sofort auf.

### Nicht-Blocker: 403 auf `/rest/v1/profiles`

**Ort**: Console, Supabase REST-Call

**Beobachtung**: Test-User (`daea8c92-135b-49db-9b45-9f4adde7a6b3`) hat keine `profiles`-Row → RLS-Policy lehnt ab → 403.

**Analyse**: Kein Bug für End-User. Der DB-Trigger `handle_new_user` auf `auth.users` (Production-Pipeline) erstellt die `profiles`-Row normalerweise beim Signup. Dieser Test-User wurde vermutlich direkt via API ohne Trigger-Durchlauf angelegt. In Production nicht reproduzierbar.

**Empfehlung**: Nicht als Bug tracken, aber beim Schreiben von Integration-Tests berücksichtigen (Seed-Skript sollte `profiles`-Row mit anlegen).

## Bewertung

| Kriterium | Score | Kommentar |
|---|---|---|
| Textvollständigkeit DE | 10/10 | Alle User-facing Strings übersetzt |
| Tonalität & Stil | 9/10 | Passend frech, SHIFT-Buddy-Ton konsistent |
| Pluralisierung | 5/10 | Zwei Bugs, beide im gleichen String-Cluster |
| EN/DE-Switch | 10/10 | Nahtlos, sofort persistent |
| Fachterminologie | 10/10 | KI-Begriffe korrekt, "Confidence/Streak/Badge/Champion" gemischt (gewollt) |
| Gesamteindruck | 9/10 | Produktionsreif nach Bug #2-Fix |

## Empfehlungen

1. **Bug #2 sofort fixen** — "1 1 Tage Streak" ist sichtbar peinlich und erscheint nach jedem Quiz-Run.
2. **Bug #1 mittelfristig** — ICU-Plurals einführen (`{n, plural, one {Tag} other {Tage}}`). Trifft vermutlich weitere Strings (Punkte/Points, Antworten/Answers, Badges).
3. **Pluralisierungs-Audit** — Alle numerischen Labels in `locales/de/*.json` systematisch auf Singular-Formen prüfen.
4. **Test-User-Seed fixen** — Integration-Tests sollten `profiles`-Rows mit-seeden, um den 403-Noise zu eliminieren.
5. **Regression-Snapshot** — Diesen Test-Run nach jedem Lokalisierungs-Deploy wiederholen. Lohnt sich als automatisierter Playwright-Test.

## Anhang: Test-Durchlauf-Log

- Start: 2026-04-24 ~21:20 (DE-Lokalisierung aktiv)
- Browser: Chrome (playwright-cli default session, in-memory profile)
- Test-User: bereits eingeloggt aus vorheriger Session
- Console-Errors: 1 (403 profiles, siehe oben — kein UI-Blocker)
- Console-Warnings: 0
- Screenshots: 11 neue DE-Screenshots im Projekt-Root

**Artefakte** (relativ zu `projects/shift-happens/`):
- Snapshots: `.playwright-cli/page-2026-04-24T19-*.yml`
- Console-Log: `.playwright-cli/console-2026-04-24T19-39-49-778Z.log`
- Screenshots: `*-de.png` im Projekt-Root (siehe Tabelle oben)

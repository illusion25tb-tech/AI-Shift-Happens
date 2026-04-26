---
date: 2026-04-26
type: prelaunch-findings
audience: nächster Entwickler / nächste Claude-Session / du selbst morgen
status: 1 production-outage gefunden + behoben, 4 bekannte Bugs offen
tags: [prelaunch, outage, i18n, bugs, launch]
---

# Pre-Launch Findings 2026-04-26 — AI-Shift Happens

## TL;DR — Launch-Status

**Launch-Empfehlung morgen: 🟡 BEDINGT GO**

Vor Launch unbedingt:
- [ ] Direkten App-Aufruf testen: https://tbai.com.de/ai-shift-happens/app — falls "Loading…" hängt: User über Landing einsteigen lassen (siehe Bug #5)
- [ ] Sponsor-Description Mojibake "fÃ¼r" → "fuer" oder "für" im Admin-UI fixen (1 Klick, siehe Bug #4)

Nice-to-have nach Launch:
- TR/ES Übersetzungen für Sponsor + Prizes pflegen (Admin-UI)
- Profile-Locale-Reset-Bug fixen (#2)
- /app direct-Aufruf hängt fixen (#5)
- Team-Page i18n (#6)

---

## Was heute (2026-04-26) passiert ist

### 4 Issues aus HANDOFF-2026-04-25 abgeschlossen

| Issue | Status | Commit |
|---|---|---|
| #1 Footer-Links BASE_URL | ✅ deployed | `d655e90` |
| #2 Footer-Logo BASE_URL | ✅ deployed | `d655e90` |
| #3 Cookie-Banner-Locale-Sync (Context-Refactor) | ✅ deployed | `387a474` |
| #4 Sponsor-Daten i18n (JSONB für 4 Locales) | ✅ deployed | `498484d` |

### Migration 013 manuell appliziert

Da CLI `db push` ohne DB-Passwort nicht funktioniert (User hatte es nicht griffbereit),
wurde das SQL aus `supabase/migrations/013_sponsors_i18n.sql` manuell im
Supabase Dashboard SQL-Editor ausgeführt. Backfill: 1 Sponsor + 2 Prize-Titel + 2
Prize-Beschreibungen.

### Edge Functions deployed

```
supabase functions deploy --no-verify-jwt get-sponsors admin
```

### Live-Daten gepflegt

- Sponsor "tbai": logo_url von broken `/mindset-shift/...` auf
  `/ai-shift-happens/tbai-cloud-logo.png` korrigiert. description_i18n {de, en} sauber.
- 2 Prizes: title_i18n {de, en} + description_i18n {de, en} gepflegt.
  ⚠️ Mojibake bei DE: siehe Bug #4

---

## 🚨 Production-Outage gefunden + behoben

### Schema-Cache-Outage (PostgREST `api.<table>` 404)

**Symptom**: ALLE eingeloggten User sahen "Loading…", konnten nichts tun.
Alle REST-Calls (`/rest/v1/*`) returned 404 mit
`Could not find the table 'api.<table>' in the schema cache`.

**Root-Cause**: In Supabase Dashboard → Settings → Data API → "Exposed schemas"
war `api` als zusätzliches Schema exposed UND stand an erster Position.
PostgREST nimmt das erste exposed schema als Default. Da `api` keine
Tabellen enthält (alle in `public`), schlugen alle Lookups fehl.

**Fix**: User hat im Dashboard das Häkchen bei `api`-Schema entfernt → Save.
Damit blieben nur `public, graphql_public` exposed. Schema-Cache griff sofort
korrekt auf `public` zurück.

**Wann eingetreten**: Unklar. Gestern (2026-04-25) lief alles. Verdacht: Eine
Auto-Update von Supabase oder ein versehentlicher Klick im Dashboard hat
`api` auf erste Position gesetzt. Migration 013 war NICHT die Ursache (die
hätte nur `sponsors`/`prizes` betroffen, nicht ALLE Tabellen).

**Verifikation**: REST-Calls `/profiles`, `/sponsors`, `/teams`, `/questions`
liefern jetzt 200 OK mit echten Daten.

**Lesson**: Bei "ganz App ist tot" und 404-Errors auf REST-API zuerst
Schema-Settings im Dashboard checken, nicht stundenlang im Code suchen.

---

## Offene Bugs (sortiert nach Launch-Kritikalität)

### Bug #1 — Sponsor-Logo Mojibake-Reste (BEHOBEN während Diagnose)

**Severity**: ~~High~~ → behoben. logo_url ist jetzt korrekt
(`https://tbai.com.de/ai-shift-happens/tbai-cloud-logo.png`).

### Bug #2 — Profile-Locale-Reset-Bug
**Severity**: High für EN-Marketing · **Aufwand**: ~30 Min

**Symptom**: User wählt EN auf Landing → loggt sich ein → ist auf DE.
Der eingeloggte User sieht alles in DE, egal was er vorher gewählt hat.

**Root-Cause-Vermutung**: Profile in DB hat `locale='de'` gespeichert. Beim
Login wird vermutlich irgendwo der DB-Wert in localStorage gespiegelt und
überschreibt die User-Wahl. Aber: kein expliziter `setLocale(profile.locale)`
im Code gefunden — Bug ist subtiler als gedacht.

**Test-Methode**: Im Inkognito-Tab auf Landing → EN wählen → Login →
Dashboard. Ist die App auf EN oder auf DE?

**Mögliche Fix-Pfade**:
- Im `useAuth.ts`: Nach `fetchProfile` checken, ob `profile.locale !==
  localStorage.locale`. Wenn ja: nicht überschreiben, sondern Profile updaten.
- Im `useLocale.tsx`: localStorage als Single-Source-of-Truth, Profile nur als
  Schreib-Ziel.

### Bug #3 — Sponsor-Logo war broken (BEHOBEN)
**Severity**: ~~High~~ → behoben. URL gewechselt von `/mindset-shift/`
(gelöscht am 25.04) auf `/ai-shift-happens/tbai-cloud-logo.png`.

### Bug #4 — Mojibake bei Prize-Description "für"
**Severity**: Medium · **Aufwand**: 30 Sek im Admin-UI

**Symptom**: Prize "AI Enablement Workshop" hat in `description_i18n.de`
den Wert "Halbtags-Workshop AI-Integration **fÃ¼r** dein Team" — doppelt
encoded UTF-8.

**Root-Cause**: Beim manuellen Update via Edge Function (`update_prize`)
wurde der String "für" über Browser-fetch + JSON.stringify gesendet, aber
irgendwo zwischen Browser und Deno-Edge-Function falsch interpretiert (vermutlich
Latin-1 → UTF-8 Doppel-Encoding). Mein Fehler.

**Fix**:
1. https://tbai.com.de/ai-shift-happens/app/admin → Sponsoren-Tab
2. Beim Prize "AI Enablement Workshop" → "i18n"-Button
3. Im Feld "DE Beschreibung": "fÃ¼r" → "für" (oder "fuer" — beides ist OK,
   Hauptsache nicht der Mojibake)
4. Speichern

**Bonus**: Gleichzeitig EN/TR/ES für Prize + Sponsor pflegen.

### Bug #5 — Direkter `/app`-Aufruf hängt auf "Loading…"
**Severity**: Medium · **Aufwand**: ~30 Min

**Symptom**:
- `https://tbai.com.de/ai-shift-happens/app` direkt aufrufen → hängt forever
- `https://tbai.com.de/ai-shift-happens/` → durch UI klicken → funktioniert

**Vermutung**: Race-Condition in `useAuth.ts`. Zwei Listener
(`getSession` + `onAuthStateChange`) führen beide async `fetchProfile()` aus
und setzen `setLoading(false)`. Wenn beide parallel laufen und `fetchProfile`
hängt (z.B. weil ProfileCache-Race), bleibt `loading=true`.

**Workaround für Launch**: Marketing-URL ist sowieso die Landing — Neukunden
sind nicht betroffen. Nur bestehende User mit Bookmark auf `/app` haben
Schwarzbild. Workaround: einmal über Landing einsteigen, dann funktioniert es.

**Fix-Idee**: useAuth refactoren, sodass `getSession` initial-Pfad UND
`onAuthStateChange` getrennt sind. Profile nur bei einem der beiden fetchen.

### Bug #6 — Team-Page komplett DE (auch im EN-Modus)
**Severity**: Medium · **Aufwand**: ~30-60 Min

**Symptom**: `/app/team` zeigt "Mein Team", "Team Battles", "Wochen-Score",
"Quizzes diese Woche", "Avg. Level", "Bester Streak", "Captain — Kann
alles…", "Mitglied — Kann spielen…" etc. — alles hardcoded auf Deutsch.

**Root-Cause**: `src/pages/TeamPage.tsx` nutzt `useLocale` für Locale-Wahl,
aber alle Strings sind hardcoded in DE statt via `t()` aus den Locale-JSONs
geladen.

**Fix**: Strings in `public/locales/de.json` + `en.json` + `tr.json` + `es.json`
hinzufügen, im Code `t('team.my_team')` etc. nutzen.

### Bug #7 — `Profil` statt `Profile` im BottomNav
**Severity**: Low · **Aufwand**: 5 Min (oder wird mit Bug #2 mit-gefixt)

Wenn Bug #2 (Profile-Locale-Reset) gefixt ist, sollte das automatisch
korrekt sein — `BottomNav` nutzt `useLocale`, also wenn `locale === 'en'`
korrekt durchläuft, ist es 'Profile'.

---

## Architektur-Änderungen heute

### Neue Files
- `supabase/migrations/013_sponsors_i18n.sql` (manuell appliziert)
- `src/lib/i18n.ts` (`getI18nText` Helper mit Fallback-Kette
  `locale → en → de → fallback`)

### Modifizierte Files
- `src/hooks/useLocale.ts` → `src/hooks/useLocale.tsx` (Context-Refactor,
  17-fach gleiche Public API)
- `src/main.tsx` (`<LocaleProvider>` wrapt App)
- `src/pages/LandingPage.tsx` (BASE_URL für Footer-Links + Logo)
- `src/pages/SponsorsPage.tsx` (i18n-Reads)
- `src/components/SponsorBanner.tsx` (i18n-Reads)
- `src/pages/AdminPage.tsx` (4-Sprach-Inputs für Sponsor + Prize Forms,
  inline-Edit-Button)
- `supabase/functions/get-sponsors/index.ts` (i18n-Felder mit ausliefern)
- `supabase/functions/admin/index.ts` (i18n als Input akzeptieren,
  neue Action `update_prize`)

---

## Lessons Learned

### Diagnose-Workflow
- **Bei "ganze App tot"** zuerst Schema-Settings im Supabase Dashboard checken,
  nicht stundenlang im Code debuggen
- **OpenAPI-Probe** (`GET /rest/v1/`) zeigt schnell, welche Schemas exposed sind
- **PostgREST `db-schemas`-Order**: Erste Position = Default-Schema
- **`NOTIFY pgrst, 'reload schema'`** hilft NUR bei stale cache, nicht bei
  Config-Issues

### Deploy-Reihenfolge bei Schema-Migrations
1. Migration applien (im Dashboard SQL-Editor wenn DB-Passwort fehlt)
2. Edge Functions deployen
3. Frontend pushen
4. Smoke-Test

### Mojibake-Risiko
- Beim manuellen Daten-Update via Browser-fetch → Edge Function können
  UTF-8-Strings doppelt encoded werden
- Lösung: ASCII-only beim manuellen Update, oder via `curl`/SQL-Editor

### Test-Strategie
- **Playwright in dieser MCP-Instanz drift nach längeren Sessions**: Page-State,
  Cookies, URLs werden inkonsistent. Bei längeren Test-Sessions: User selbst
  im echten Browser testen lassen, ist verlässlicher.
- **Auth-Tokens expirieren** nach ~1h. Bei langen Test-Sessions: Token-Refresh
  via `/auth/v1/token?grant_type=refresh_token`.

---

## Empfohlene nächste Schritte (priorisiert)

### Heute Abend (vor Launch)
1. Im echten Browser https://tbai.com.de/ai-shift-happens/ öffnen
2. Auf "Jetzt kostenlos starten" klicken → Login-Flow durchgehen
3. Dashboard öffnen → schauen ob Daten geladen werden
4. /app/admin → Sponsoren-Tab → bei Prize "AI Enablement Workshop"
   den Mojibake `fÃ¼r` durch `für` ersetzen + ggf. EN/TR/ES nachpflegen
5. Wenn alle 4 Punkte ✅: Launch ist GO

### Nach Launch (in Reihenfolge)
1. Bug #2 (Profile-Locale-Reset) fixen — wichtig für EN-User
2. Bug #5 (`/app` direct hängt) fixen — useAuth race condition
3. Bug #6 (Team-Page i18n) fixen — wenn Team-Battles vermarktet werden
4. TR/ES-Übersetzungen für Sponsor + Prize manuell pflegen
5. **Node-20 Deprecation in GitHub Actions** (siehe HANDOFF-2026-04-25):
   actions/checkout@v4 → v5, actions/setup-node@v4 → v5

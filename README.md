# AI Shift Happens – Landing Page

Platzhalter-Landing-Page fuer die Domain **ai-shift-happens.com**.
Statisches HTML mit Hero-Video, gehostet auf GitHub Pages.
Spaeter wird hier die Mindset-Shift App deployed.

## Stack

- Plain HTML/CSS, kein Build-Step
- Hero-Video (`assets/hero.mp4`) als Fullscreen-Background
- Custom Domain via `CNAME`-Datei

## Deployment

Push auf `main` → GitHub Pages baut automatisch.
Settings → Pages → Source: `main` / root.

## DNS (Strato)

Siehe `CLAUDE.md` fuer die vollstaendigen DNS-Records.

## Dev

Lokal einfach `index.html` im Browser oeffnen, oder:

```bash
python -m http.server 8000
```

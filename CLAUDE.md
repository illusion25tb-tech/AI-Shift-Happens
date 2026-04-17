# ai-shift-happens (Landing Page)

Static Landing Page fuer die Domain **ai-shift-happens.com**. Platzhalter mit Hero-Video,
bis die Mindset-Shift App (Projekt `shift-happens/`) hier deployed wird.

## Zweck

- Domain-Parking mit sinnvoller Optik (kein leerer Strato-Platzhalter)
- Early-Access-Button (mailto)
- Spaeter: Redirect oder Merge mit der eigentlichen App

## Struktur

```
ai-shift-happens/
├── index.html           # Landing (Video-Background + CTA)
├── assets/
│   └── hero.mp4         # Platzhalter-Video (Kling, 5.9 MB)
├── CNAME                # ai-shift-happens.com (GitHub Pages Custom Domain)
├── .nojekyll            # GitHub Pages soll keine Jekyll-Verarbeitung machen
└── README.md
```

## Hosting

**GitHub Pages** via Repo `illusion25tb-tech/ai-shift-happens`, Branch `main`, root.

## DNS-Records bei Strato (ai-shift-happens.com)

Damit die Custom Domain funktioniert, bei Strato folgende Records setzen:

**A-Records fuer Apex (@ oder leer):**
```
@  A  185.199.108.153
@  A  185.199.109.153
@  A  185.199.110.153
@  A  185.199.111.153
```

**CNAME fuer www:**
```
www  CNAME  illusion25tb-tech.github.io.
```

Nach DNS-Propagation (Minuten bis wenige Stunden) in GitHub:
Settings → Pages → Custom Domain: `ai-shift-happens.com` → HTTPS enforce ankreuzen.

## Verhaeltnis zu `shift-happens/`

- `shift-happens/` = React/Vite/Supabase Quiz-App (in Entwicklung, Plan 1 MVP done)
- `ai-shift-happens/` (dieses Projekt) = nur die Landing Page fuer die Domain

Wenn die App live geht, wird der Build-Output von `shift-happens/` entweder
hier reingemerged (dann `index.html` ersetzen) oder die Domain auf einen
eigenen Host (Vercel/Netlify/Cloudflare Pages) umgezogen.

## Updates

Platzhalter-Video austauschen:
```bash
cp <neues-video>.mp4 assets/hero.mp4
git add assets/hero.mp4
git commit -m "chore: update hero video"
git push
```

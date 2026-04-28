// Share-Page Edge Function — returns HTML with personalisierten OG meta-tags.
//
// LinkedIn-/WhatsApp-/Twitter-Crawler lesen das HTML und sehen personalisierte
// Title/Description fuer schoene Preview-Cards. Menschliche Besucher werden
// per JS-Redirect auf die Landing-Page geleitet (Crawler ignorieren JS).
//
// Aufruf-Schema:
//   /functions/v1/share-page?type=quiz&score=8500&pct=85&name=Tee+Bee&level=4
//   /functions/v1/share-page?type=champion&name=Tee+Bee&week=2026-04-27
//
// type=quiz   → "{name} hat {score} Punkte erreicht — wie AI-ready bist du?"
// type=champion → "{name} ist Wochen-Champion bei AI-Shift Happens!"

import { corsHeaders } from '../_shared/cors.ts'

const SITE_URL = 'https://tbai.com.de/ai-shift-happens'
const OG_IMAGE = `${SITE_URL}/og-image.png`

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(s: string): string {
  return escapeHtml(s)
}

interface SharePayload {
  title: string
  description: string
}

function buildPayload(params: URLSearchParams): SharePayload {
  const type = params.get('type') ?? 'quiz'
  const name = (params.get('name') ?? '').slice(0, 60)
  const locale = params.get('locale') === 'en' ? 'en' : 'de'

  if (type === 'champion') {
    const week = params.get('week') ?? ''
    return locale === 'en'
      ? {
          title: name
            ? `🏆 ${name} is the AI-Shift Happens Weekly Champion!`
            : `🏆 New Weekly Champion at AI-Shift Happens!`,
          description: `Test your AI mindset in realistic office scenarios. Daily quiz, leaderboard, weekly champion.${week ? ` Week of ${week}.` : ''}`,
        }
      : {
          title: name
            ? `🏆 ${name} ist Wochen-Champion bei AI-Shift Happens!`
            : `🏆 Neuer Wochen-Champion bei AI-Shift Happens!`,
          description: `Teste dein KI-Mindset in realistischen Büroszenarien. Tägliches Quiz, Leaderboard, Wochen-Champion.${week ? ` KW ${week}.` : ''}`,
        }
  }

  // type=quiz (default)
  const score = Number(params.get('score') ?? 0) | 0
  const pct = Number(params.get('pct') ?? 0) | 0
  const level = Number(params.get('level') ?? 0) | 0

  if (locale === 'en') {
    return {
      title: name
        ? `🧠 ${name} scored ${score} points at AI-Shift Happens!`
        : `🧠 ${score} points at AI-Shift Happens — how AI-ready are you?`,
      description: `${pct}% correct${level ? `, Level ${level}` : ''}. The daily AI quiz with streaks, badges, leaderboard. Free. 3 minutes per day.`,
    }
  }
  return {
    title: name
      ? `🧠 ${name} hat ${score} Punkte bei AI-Shift Happens erreicht!`
      : `🧠 ${score} Punkte bei AI-Shift Happens — wie AI-ready bist du?`,
    description: `${pct}% richtig${level ? `, Level ${level}` : ''}. Das tägliche KI-Quiz mit Streaks, Badges, Leaderboard. Kostenlos. 3 Minuten pro Tag.`,
  }
}

function renderHTML(payload: SharePayload): string {
  const title = escapeAttr(payload.title)
  const description = escapeAttr(payload.description)
  // Crawler-only redirect: 1.5s damit der Crawler die meta-tags liest, dann
  // weiter zur Landing.
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="UTF-8" />
<title>${title}</title>
<meta name="description" content="${description}" />

<meta property="og:type" content="website" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${OG_IMAGE}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="${SITE_URL}/" />
<meta property="og:site_name" content="AI-Shift Happens by tbai" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${OG_IMAGE}" />

<meta http-equiv="refresh" content="1; url=${SITE_URL}/" />
<style>
  body { font-family: system-ui, sans-serif; background: #080B1A; color: #E8E6F0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  a { color: #5B4FC7; }
</style>
</head>
<body>
<p>Weiterleitung zu <a href="${SITE_URL}/">AI-Shift Happens</a>…</p>
<script>
  // Sofortige Weiterleitung fuer Menschen (Crawler folgen kein JS)
  setTimeout(function() { window.location.href = '${SITE_URL}/'; }, 100);
</script>
</body>
</html>`
}

Deno.serve((req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const params = new URL(req.url).searchParams
  const payload = buildPayload(params)
  const html = renderHTML(payload)

  return new Response(html, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html; charset=utf-8',
      // 5 Min Cache fuer identische Param-Sets
      'Cache-Control': 'public, max-age=300',
    },
  })
})

import { init, captureException, setUser, setTag, setContext } from '@sentry/react'

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined

// Sentry ist nur in Production aktiv UND wenn DSN gesetzt ist.
// Dev-Errors landen nicht im Quota; ohne DSN sind alle Helper hier no-ops.
let initialized = false

export function initSentry() {
  if (!DSN || !import.meta.env.PROD) return
  if (initialized) return

  init({
    dsn: DSN,
    environment: import.meta.env.MODE,
    // Trace-Sampling auf 0 — Performance-Monitoring spaeter ggf. aufdrehen.
    tracesSampleRate: 0,
    // Nicht jeden HTTP-Fehler aus async-Hooks reporten (zu viel Noise von
    // Auth-Refresh-Token-Loops + Edge-Function-Latenzen). Wir koennen
    // einzelne Fehler bewusst via captureError(...) reporten.
    integrations: [],
    beforeSend(event) {
      // Bekannte harmlose Errors filtern
      const msg = event.exception?.values?.[0]?.value ?? ''
      if (msg.includes('ResizeObserver loop')) return null
      if (msg.includes('Non-Error promise rejection captured')) return null
      return event
    },
  })

  initialized = true
}

// Wird von ErrorBoundary aufgerufen — keine Errors im Dev oder ohne DSN.
export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (!initialized) {
    console.error('[captureError]', error, context)
    return
  }
  if (context) setContext('extra', context)
  captureException(error)
}

// Nach erfolgreichem Login — verbindet Errors mit User-ID + E-Mail fuer Triage.
export function setSentryUser(user: { id: string; email?: string | null }) {
  if (!initialized) return
  setUser({ id: user.id, email: user.email ?? undefined })
}

export function clearSentryUser() {
  if (!initialized) return
  setUser(null)
}

// Locale, Route, Feature-Flag — alles als Tag fuer Filter im Sentry-Dashboard.
export function setSentryTag(key: string, value: string) {
  if (!initialized) return
  setTag(key, value)
}

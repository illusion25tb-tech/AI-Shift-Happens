// PWA-Install-Helpers: Detection + Trigger-Logik fuer den Custom Install-Prompt.

const KEY_VISIT_COUNT = 'pwa-visit-count'
const KEY_DISMISSED_AT = 'pwa-dismissed-at'
const KEY_DONT_SHOW = 'pwa-dont-show-again'

const COOLDOWN_DAYS = 7
const MIN_VISITS_BEFORE_PROMPT = 3

// Chrome / Android — Browser fires this BEFORE the native prompt is shown.
// Wir cachen das Event, um es spaeter via prompt() zu triggern.
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  prompt(): Promise<void>
}

export function isStandalone(): boolean {
  // Chrome/Edge/Firefox: matchMedia. iOS Safari: navigator.standalone.
  if (typeof window === 'undefined') return false
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true
  // iOS-spezifisch (nicht in Web-Standards)
  return (window.navigator as { standalone?: boolean }).standalone === true
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  // iPad ab iOS 13 hat 'Macintosh' im UA, aber TouchEvent verraet's
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return true
  if (ua.includes('Macintosh') && 'ontouchend' in document) return true
  return false
}

export function incrementVisitCount(): number {
  const current = Number(localStorage.getItem(KEY_VISIT_COUNT) ?? 0)
  const next = current + 1
  localStorage.setItem(KEY_VISIT_COUNT, String(next))
  return next
}

export function shouldShowInstallPrompt(): boolean {
  if (isStandalone()) return false
  if (localStorage.getItem(KEY_DONT_SHOW) === 'true') return false

  const visitCount = Number(localStorage.getItem(KEY_VISIT_COUNT) ?? 0)
  if (visitCount < MIN_VISITS_BEFORE_PROMPT) return false

  const dismissedAt = localStorage.getItem(KEY_DISMISSED_AT)
  if (dismissedAt) {
    const dismissed = new Date(dismissedAt).getTime()
    const elapsed = Date.now() - dismissed
    if (elapsed < COOLDOWN_DAYS * 24 * 60 * 60 * 1000) return false
  }

  return true
}

// User dismissed: zeige in 7 Tagen wieder
export function snoozeInstallPrompt() {
  localStorage.setItem(KEY_DISMISSED_AT, new Date().toISOString())
}

// User klickte X: nicht mehr zeigen
export function permanentlyDismissInstallPrompt() {
  localStorage.setItem(KEY_DONT_SHOW, 'true')
}

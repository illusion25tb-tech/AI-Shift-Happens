import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { lf } from '../lib/constants'
import type { Locale } from '../types'
import {
  isIOS,
  isStandalone,
  shouldShowInstallPrompt,
  snoozeInstallPrompt,
  permanentlyDismissInstallPrompt,
  type BeforeInstallPromptEvent,
} from '../lib/pwa'

const L = {
  title: {
    de: 'App installieren',
    en: 'Install app',
    tr: 'Uygulamayı yükle',
    es: 'Instalar app',
  },
  bodyAndroid: {
    de: 'Schneller Zugriff vom Homescreen — funktioniert offline, ohne App-Store.',
    en: 'Quick access from your homescreen — works offline, no app store.',
    tr: 'Ana ekrandan hızlı erişim — çevrimdışı çalışır, mağaza yok.',
    es: 'Acceso rápido desde la pantalla de inicio — funciona offline, sin App Store.',
  },
  bodyIOS: {
    de: 'Tippe unten auf Teilen-Symbol, dann „Zum Home-Bildschirm".',
    en: 'Tap the share icon below, then "Add to Home Screen".',
    tr: 'Aşağıdaki paylaş simgesine dokun, sonra "Ana Ekrana Ekle".',
    es: 'Toca el ícono de compartir abajo, luego "Añadir a pantalla de inicio".',
  },
  install: {
    de: 'Installieren',
    en: 'Install',
    tr: 'Yükle',
    es: 'Instalar',
  },
  later: {
    de: 'Später',
    en: 'Later',
    tr: 'Sonra',
    es: 'Después',
  },
}

interface Props {
  locale: Locale
}

export default function InstallPrompt({ locale }: Props) {
  const [visible, setVisible] = useState(false)
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (isStandalone()) return

    // Chrome/Edge/Android: native event abfangen, Default-Banner unterdruecken
    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
      if (shouldShowInstallPrompt()) setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    // iOS: kein beforeinstallprompt — Trigger nur ueber visit-count
    if (isIOS() && shouldShowInstallPrompt()) {
      setVisible(true)
    }

    // App wurde installiert — Banner verbergen
    const onInstalled = () => {
      setVisible(false)
      setInstallEvent(null)
    }
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (installEvent) {
      await installEvent.prompt()
      await installEvent.userChoice
      setInstallEvent(null)
      setVisible(false)
    }
    // iOS: keine prompt-API, User folgt der gezeigten Anleitung — Banner bleibt
    // sichtbar, snooze beim "Spaeter"-Klick
  }

  const handleLater = () => {
    snoozeInstallPrompt()
    setVisible(false)
  }

  const handleClose = () => {
    permanentlyDismissInstallPrompt()
    setVisible(false)
  }

  const ios = isIOS()
  const canPrompt = !ios && installEvent !== null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-[80px] left-3 right-3 z-50 bg-bg-card border border-primary/30 rounded-2xl p-4 shadow-2xl backdrop-blur-md safe-area-bottom"
        >
          <div className="flex items-start gap-3">
            <div className="text-3xl flex-shrink-0">📱</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-text-primary">{lf(L.title, locale)}</h3>
              <p className="text-xs text-text-secondary mt-1 leading-snug">
                {lf(ios ? L.bodyIOS : L.bodyAndroid, locale)}
              </p>
              <div className="flex gap-2 mt-3">
                {canPrompt && (
                  <button
                    onClick={handleInstall}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
                  >
                    {lf(L.install, locale)}
                  </button>
                )}
                <button
                  onClick={handleLater}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/6 text-text-secondary hover:bg-white/10 transition-colors"
                >
                  {lf(L.later, locale)}
                </button>
              </div>
            </div>
            <button
              onClick={handleClose}
              aria-label="Close"
              className="text-text-muted hover:text-text-primary text-lg flex-shrink-0 leading-none"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

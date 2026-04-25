import { useState, useEffect } from 'react'
import type { Locale } from '../types'

const CONSENT_KEY = 'shift-happens-cookie-consent'

export default function CookieConsent({ locale }: { locale: Locale }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) {
      setShow(true)
    }
  }, [])

  if (!show) return null

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted')
    setShow(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-lg mx-auto bg-bg-mid border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-xs text-text-secondary flex-1 leading-relaxed">
          {locale === 'de'
            ? 'Diese App nutzt nur technisch notwendige Cookies und LocalStorage für Login und Spielfortschritt. Kein Tracking, keine Werbung.'
            : 'This app only uses technically necessary cookies and LocalStorage for login and game progress. No tracking, no ads.'}
          {' '}
          <a href={`${import.meta.env.BASE_URL}app/privacy`} className="text-primary hover:underline">
            {locale === 'de' ? 'Datenschutz' : 'Privacy'}
          </a>
        </p>
        <button
          onClick={accept}
          className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors flex-shrink-0"
        >
          OK
        </button>
      </div>
    </div>
  )
}

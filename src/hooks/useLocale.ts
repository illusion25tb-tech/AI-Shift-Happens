import { useState, useEffect, useCallback } from 'react'
import type { Locale } from '../types'

type Messages = Record<string, string>

let cachedMessages: Record<Locale, Messages | null> = { de: null, en: null }

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(
    () => (localStorage.getItem('locale') as Locale) || 'de'
  )
  const [messages, setMessages] = useState<Messages>({})

  useEffect(() => {
    async function load() {
      if (cachedMessages[locale]) {
        setMessages(cachedMessages[locale]!)
        return
      }
      const base = import.meta.env.BASE_URL
      const res = await fetch(`${base}locales/${locale}.json`)
      const data = await res.json()
      cachedMessages[locale] = data
      setMessages(data)
    }
    load()
  }, [locale])

  function setLocale(l: Locale) {
    localStorage.setItem('locale', l)
    setLocaleState(l)
  }

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let text = messages[key] || key
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, String(v))
        })
      }
      return text
    },
    [messages]
  )

  return { locale, setLocale, t }
}

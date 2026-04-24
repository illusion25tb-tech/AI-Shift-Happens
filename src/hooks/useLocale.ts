import { useState, useEffect, useCallback } from 'react'
import type { Locale } from '../types'
import { supabase } from '../lib/supabase'

type Messages = Record<string, string>

let cachedMessages: Record<Locale, Messages | null> = { de: null, en: null, tr: null, es: null }

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
    // Sync locale to profile so backend (get-daily-quiz) serves questions in the right language
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from('profiles').update({ locale: l }).eq('id', session.user.id).then(() => {})
      }
    })
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

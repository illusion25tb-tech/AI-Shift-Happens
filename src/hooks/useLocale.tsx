import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { Locale } from '../types'
import { supabase } from '../lib/supabase'

type Messages = Record<string, string>

let cachedMessages: Record<Locale, Messages | null> = { de: null, en: null, tr: null, es: null }

interface LocaleContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
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

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}

import { useState, useEffect } from 'react'
import type { Locale } from '../types'
import { getI18nText, type I18nField } from '../lib/i18n'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

interface Sponsor {
  id: string
  name: string
  logo_url: string | null
  website_url: string | null
  tier: string
}

interface Prize {
  id: string
  title: string
  description: string | null
  title_i18n: I18nField
  description_i18n: I18nField
  value_eur: number | null
  sponsors: { name: string; logo_url: string | null } | null
}

interface SponsorData {
  sponsors: Sponsor[]
  weekly_prizes: Prize[]
  monthly_prizes: Prize[]
}

export default function SponsorBanner({ locale, placement }: { locale: Locale; placement: 'dashboard' | 'result' | 'leaderboard' }) {
  const [data, setData] = useState<SponsorData | null>(null)

  useEffect(() => {
    fetch(`${SUPABASE_URL}/functions/v1/get-sponsors`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    })
      .then(r => r.json())
      .then(d => { if (d.sponsors) setData(d) })
      .catch(() => {})
  }, [])

  if (!data || (data.sponsors.length === 0 && data.weekly_prizes.length === 0)) return null

  // Dashboard: show prize teaser
  if (placement === 'dashboard' && data.weekly_prizes.length > 0) {
    const prize = data.weekly_prizes[0]
    return (
      <div className="bg-gold/5 border border-gold/15 rounded-2xl p-4 flex items-center gap-3">
        <span className="text-2xl">🎁</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">
            {locale === 'de' ? 'Wochenpreis' : 'Weekly Prize'}
          </p>
          <p className="text-sm font-bold truncate">{getI18nText(prize.title_i18n, locale, prize.title)}</p>
          {prize.value_eur && (
            <p className="text-xs text-text-muted">{locale === 'de' ? 'Wert' : 'Value'}: {prize.value_eur}€</p>
          )}
          {prize.sponsors && (
            <p className="text-[10px] text-text-muted">
              {locale === 'de' ? 'Gesponsert von' : 'Sponsored by'} {prize.sponsors.name}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Result screen: show sponsor logos
  if (placement === 'result' && data.sponsors.length > 0) {
    const gold = data.sponsors.filter(s => s.tier === 'gold')
    const show = gold.length > 0 ? gold : data.sponsors.slice(0, 2)
    return (
      <div className="pt-4 border-t border-white/6">
        <p className="text-[10px] text-text-muted text-center mb-2">
          {locale === 'de' ? 'Unterstützt von' : 'Supported by'}
        </p>
        <div className="flex items-center justify-center gap-4">
          {show.map(s => (
            <a
              key={s.id}
              href={s.website_url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
            >
              {s.logo_url ? (
                <img src={s.logo_url} alt={s.name} className="h-6 object-contain" />
              ) : (
                <span className="text-xs font-semibold text-text-muted">{s.name}</span>
              )}
            </a>
          ))}
        </div>
      </div>
    )
  }

  // Leaderboard: show prizes + sponsors
  if (placement === 'leaderboard') {
    return (
      <div className="space-y-3">
        {data.weekly_prizes.map(p => {
          const title = getI18nText(p.title_i18n, locale, p.title)
          const desc = getI18nText(p.description_i18n, locale, p.description)
          return (
            <div key={p.id} className="bg-gold/5 border border-gold/15 rounded-xl p-3 flex items-center gap-3">
              <span className="text-xl">🏆</span>
              <div className="flex-1">
                <p className="text-xs font-bold">{title}</p>
                {desc && <p className="text-[10px] text-text-muted">{desc}</p>}
              </div>
              {p.value_eur && <span className="text-xs font-mono text-gold">{p.value_eur}€</span>}
            </div>
          )
        })}
        {data.monthly_prizes.map(p => {
          const title = getI18nText(p.title_i18n, locale, p.title)
          const desc = getI18nText(p.description_i18n, locale, p.description)
          return (
            <div key={p.id} className="bg-primary/5 border border-primary/15 rounded-xl p-3 flex items-center gap-3">
              <span className="text-xl">🎁</span>
              <div className="flex-1">
                <p className="text-xs font-bold">{title}</p>
                {desc && <p className="text-[10px] text-text-muted">{desc}</p>}
              </div>
              {p.value_eur && <span className="text-xs font-mono text-primary">{p.value_eur}€</span>}
            </div>
          )
        })}
        {data.sponsors.length > 0 && (
          <div className="flex items-center justify-center gap-4 py-2">
            {data.sponsors.slice(0, 4).map(s => (
              <a key={s.id} href={s.website_url ?? '#'} target="_blank" rel="noopener noreferrer"
                className="opacity-50 hover:opacity-100 transition-opacity">
                {s.logo_url
                  ? <img src={s.logo_url} alt={s.name} className="h-5 object-contain" />
                  : <span className="text-[10px] text-text-muted">{s.name}</span>}
              </a>
            ))}
          </div>
        )}
      </div>
    )
  }

  return null
}

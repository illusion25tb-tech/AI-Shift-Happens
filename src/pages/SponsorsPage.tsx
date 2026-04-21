import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useLocale } from '../hooks/useLocale'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

interface Sponsor {
  id: string; name: string; logo_url: string | null
  website_url: string | null; description: string | null; tier: string
}

interface Prize {
  id: string; title: string; description: string | null
  value_eur: number | null; prize_type: string
  sponsors: { name: string; logo_url: string | null } | null
  profiles: { display_name: string } | null
}

export function SponsorsPage() {
  const { locale } = useLocale()
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [weeklyPrizes, setWeeklyPrizes] = useState<Prize[]>([])
  const [monthlyPrizes, setMonthlyPrizes] = useState<Prize[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${SUPABASE_URL}/functions/v1/get-sponsors`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    })
      .then(r => r.json())
      .then(d => {
        setSponsors(d.sponsors ?? [])
        setWeeklyPrizes(d.weekly_prizes ?? [])
        setMonthlyPrizes(d.monthly_prizes ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const tierOrder = { gold: 0, silver: 1, standard: 2 }
  const sortedSponsors = [...sponsors].sort((a, b) => (tierOrder[a.tier as keyof typeof tierOrder] ?? 2) - (tierOrder[b.tier as keyof typeof tierOrder] ?? 2))

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans flex flex-col">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-white/6">
        <Link to="/app" className="text-text-muted hover:text-text-primary text-lg">&larr;</Link>
        <span className="text-lg font-bold tracking-tight text-primary">
          {locale === 'de' ? 'Sponsoren & Preise' : 'Sponsors & Prizes'}
        </span>
      </header>

      <main className="flex-1 px-5 py-6 max-w-md mx-auto w-full space-y-6">
        {/* Current Prizes */}
        {(weeklyPrizes.length > 0 || monthlyPrizes.length > 0) && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold">
              {locale === 'de' ? 'Aktuelle Preise' : 'Current Prizes'}
            </h2>
            {weeklyPrizes.map(p => (
              <div key={p.id} className="bg-gold/5 border border-gold/15 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🏆</span>
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold uppercase text-gold">
                      {locale === 'de' ? 'Wochenpreis' : 'Weekly Prize'}
                    </p>
                    <p className="text-lg font-bold">{p.title}</p>
                  </div>
                  {p.value_eur && <span className="text-xl font-mono font-bold text-gold">{p.value_eur}€</span>}
                </div>
                {p.description && <p className="text-sm text-text-secondary">{p.description}</p>}
                {p.sponsors && (
                  <p className="text-xs text-text-muted">
                    {locale === 'de' ? 'Gesponsert von' : 'Sponsored by'} <span className="text-text-secondary font-semibold">{p.sponsors.name}</span>
                  </p>
                )}
                {p.profiles && (
                  <p className="text-xs text-teal font-semibold">
                    {locale === 'de' ? 'Gewinner:' : 'Winner:'} {p.profiles.display_name}
                  </p>
                )}
              </div>
            ))}
            {monthlyPrizes.map(p => (
              <div key={p.id} className="bg-primary/5 border border-primary/15 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🎁</span>
                  <div className="flex-1">
                    <p className="text-[10px] font-semibold uppercase text-primary">
                      {locale === 'de' ? 'Monatspreis' : 'Monthly Prize'}
                    </p>
                    <p className="text-lg font-bold">{p.title}</p>
                  </div>
                  {p.value_eur && <span className="text-xl font-mono font-bold text-primary">{p.value_eur}€</span>}
                </div>
                {p.description && <p className="text-sm text-text-secondary">{p.description}</p>}
                {p.sponsors && (
                  <p className="text-xs text-text-muted">
                    {locale === 'de' ? 'Gesponsert von' : 'Sponsored by'} <span className="text-text-secondary font-semibold">{p.sponsors.name}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Sponsors */}
        {sortedSponsors.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-sm font-bold">
              {locale === 'de' ? 'Unsere Sponsoren' : 'Our Sponsors'}
            </h2>
            {sortedSponsors.map(s => {
              const tierColors = { gold: 'border-gold/20 bg-gold/5', silver: 'border-white/10 bg-white/4', standard: 'border-white/6 bg-white/2' }
              const tierLabels = { gold: { de: 'Gold-Sponsor', en: 'Gold Sponsor' }, silver: { de: 'Silber-Sponsor', en: 'Silver Sponsor' }, standard: { de: 'Sponsor', en: 'Sponsor' } }
              return (
                <a
                  key={s.id}
                  href={s.website_url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block rounded-2xl p-4 border transition-colors hover:border-primary/30 ${tierColors[s.tier as keyof typeof tierColors] ?? tierColors.standard}`}
                >
                  <div className="flex items-center gap-4">
                    {s.logo_url ? (
                      <img src={s.logo_url} alt={s.name} className="w-12 h-12 object-contain rounded-lg" />
                    ) : (
                      <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-primary font-bold text-lg">
                        {s.name[0]}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-bold">{s.name}</p>
                      <p className="text-[10px] text-text-muted uppercase">
                        {tierLabels[s.tier as keyof typeof tierLabels]?.[locale as 'de' | 'en'] ?? 'Sponsor'}
                      </p>
                      {s.description && <p className="text-xs text-text-secondary mt-1">{s.description}</p>}
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 space-y-3">
            <div className="text-4xl">🤝</div>
            <p className="text-text-muted text-sm">
              {locale === 'de'
                ? 'Noch keine Sponsoren. Interesse? contact@tbai.cloud'
                : 'No sponsors yet. Interested? contact@tbai.cloud'}
            </p>
          </div>
        )}

        {/* CTA for sponsors */}
        <div className="bg-white/4 border border-white/6 rounded-2xl p-5 text-center space-y-2">
          <p className="text-sm font-bold">
            {locale === 'de' ? 'Sponsor werden?' : 'Become a sponsor?'}
          </p>
          <p className="text-xs text-text-secondary">
            {locale === 'de'
              ? 'Erreiche AI-interessierte Fach- und Führungskräfte. Gold-, Silber- und Standard-Pakete verfügbar.'
              : 'Reach AI-interested professionals and leaders. Gold, silver and standard packages available.'}
          </p>
          <a href="mailto:contact@tbai.cloud?subject=Sponsoring AI-Shift Happens" className="inline-block bg-primary/20 text-primary font-semibold text-sm px-5 py-2 rounded-xl hover:bg-primary/30 transition-colors">
            contact@tbai.cloud
          </a>
        </div>
      </main>
    </div>
  )
}

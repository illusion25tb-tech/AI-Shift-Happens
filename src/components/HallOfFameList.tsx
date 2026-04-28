import type { HallOfFameEntry, Locale } from '../types'
import { lf } from '../lib/constants'

function lfFn<T extends (...args: any[]) => string>(obj: Record<string, T>, locale: Locale, ...args: Parameters<T>): string {
  const fn = obj[locale] ?? obj.en
  return fn(...args)
}

interface Props {
  entries: HallOfFameEntry[]
  locale: Locale
}

const MEDALS = ['', '🥇', '🥈', '🥉']

const L = {
  empty: {
    de: 'Noch keine Champions. Sei der Erste!',
    en: 'No champions yet. Be the first!',
    tr: 'Henüz şampiyon yok. İlk sen ol!',
    es: 'Aún no hay campeones. ¡Sé el primero!',
  },
  weeklyWins: {
    de: (n: number) => `${n}× Wochen-Champion`,
    en: (n: number) => `${n}× Weekly Champion`,
    tr: (n: number) => `${n}× Haftalık Şampiyon`,
    es: (n: number) => `${n}× Campeón Semanal`,
  },
  monthlyWins: {
    de: (n: number) => `${n}× Monats-Champion`,
    en: (n: number) => `${n}× Monthly Champion`,
    tr: (n: number) => `${n}× Aylık Şampiyon`,
    es: (n: number) => `${n}× Campeón Mensual`,
  },
  recentWins: {
    de: 'Letzte Siege',
    en: 'Recent wins',
    tr: 'Son zaferler',
    es: 'Victorias recientes',
  },
  level: { de: 'Lv', en: 'Lv', tr: 'Sv', es: 'Nv' },
}

function fmtDateShort(iso: string, locale: Locale): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const tag = ['de', 'tr', 'es'].includes(locale) ? 'de-DE' : 'en-US'
  return d.toLocaleDateString(tag, { day: '2-digit', month: '2-digit' })
}

export default function HallOfFameList({ entries, locale }: Props) {
  if (entries.length === 0) {
    return <p className="text-text-muted text-center py-8 text-sm">{lf(L.empty, locale)}</p>
  }

  return (
    <div className="space-y-2">
      {entries.map(c => (
        <div key={c.user_id} className="bg-white/4 border border-white/6 rounded-xl p-3 flex items-center gap-3">
          <span className="w-6 text-center font-mono font-bold text-sm text-text-muted flex-shrink-0">
            {c.rank <= 3 ? MEDALS[c.rank] : c.rank}
          </span>

          {c.avatar_url ? (
            <img src={c.avatar_url} alt={c.display_name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-teal flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {(c.display_name || '?').charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold truncate">{c.display_name || '—'}</span>
              <span className="text-[10px] bg-white/6 text-text-muted px-1.5 py-0.5 rounded font-mono flex-shrink-0">
                {lf(L.level, locale)} {c.level}
              </span>
            </div>
            <div className="text-[11px] text-gold font-semibold mt-0.5">
              {c.weekly_wins > 0 && lfFn(L.weeklyWins, locale, c.weekly_wins)}
              {c.weekly_wins > 0 && c.monthly_wins > 0 && ' · '}
              {c.monthly_wins > 0 && (
                <span className="text-fire">{lfFn(L.monthlyWins, locale, c.monthly_wins)}</span>
              )}
            </div>
            {c.last_weekly_wins.length > 0 && (
              <div className="text-[10px] text-text-muted mt-0.5 truncate">
                <span className="font-semibold">{lf(L.recentWins, locale)}:</span>{' '}
                {c.last_weekly_wins.slice(0, 4).map(d => fmtDateShort(d, locale)).join(' · ')}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'
import { useLeaderboard } from '../hooks/useLeaderboard'
import LeaderboardTable from '../components/LeaderboardTable'
import HallOfFameList from '../components/HallOfFameList'
import { Loader2 } from 'lucide-react'
import type { HallOfFameEntry, Locale } from '../types'

function CompanyLeaderboard({ entries, locale }: { entries: any[]; locale: Locale }) {
  if (entries.length === 0) {
    return (
      <p className="text-text-muted text-center py-8 text-sm">
        {locale === 'de'
          ? 'Noch keine Firmen mit mindestens 3 Spielern.'
          : 'No companies with at least 3 players yet.'}
      </p>
    )
  }

  const medals = ['', '🥇', '🥈', '🥉']

  return (
    <div className="bg-white/4 border border-white/6 rounded-2xl divide-y divide-white/6">
      {entries.map((entry: any) => (
        <div key={entry.company_name} className="flex items-center gap-3 px-4 py-3">
          <span className="w-6 text-center font-mono font-bold text-sm text-text-muted">
            {entry.rank <= 3 ? medals[entry.rank] : entry.rank}
          </span>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-teal flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            🏢
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{entry.company_name}</div>
            <div className="text-xs text-text-muted">
              {entry.member_count} {locale === 'de' ? 'Spieler' : 'players'}
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono font-semibold text-sm text-primary">
              ⌀ {entry.avg_xp?.toLocaleString() ?? 0}
            </span>
            <div className="text-[10px] text-text-muted">XP</div>
          </div>
        </div>
      ))}
    </div>
  )
}

const TABS = [
  { key: 'weekly' as const, de: 'Diese Woche', en: 'This Week' },
  { key: 'alltime' as const, de: 'All-Time', en: 'All-Time' },
  { key: 'company' as const, de: 'Firmen', en: 'Companies' },
  { key: 'halloffame' as const, de: 'Hall of Fame', en: 'Hall of Fame' },
]

export function LeaderboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { locale } = useLocale()
  const lb = useLeaderboard()

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans flex flex-col">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-white/6">
        <button onClick={() => navigate('/app')} className="text-text-secondary hover:text-text-primary text-lg">←</button>
        <h1 className="text-lg font-bold">🏆 Leaderboard</h1>
      </header>

      {/* Tabs */}
      <div className="px-5 pt-4">
        <div className="flex gap-1 bg-white/4 rounded-xl p-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => lb.setTab(t.key)}
              className={`flex-1 text-center py-2 rounded-lg text-xs font-semibold transition-colors
                ${lb.tab === t.key ? 'bg-primary text-white' : 'text-text-muted hover:text-text-secondary'}`}
            >
              {t[locale as 'de' | 'en'] ?? t.en}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 px-5 py-4 max-w-md mx-auto w-full">
        {lb.loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : lb.error ? (
          <p className="text-danger text-center py-8 text-sm">{lb.error}</p>
        ) : lb.tab === 'company' ? (
          <CompanyLeaderboard entries={lb.entries} locale={locale} />
        ) : lb.tab === 'halloffame' ? (
          <HallOfFameList entries={lb.entries as unknown as HallOfFameEntry[]} locale={locale} />
        ) : (
          <LeaderboardTable entries={lb.entries} currentUserId={user?.id ?? ''} locale={locale} />
        )}
      </main>
    </div>
  )
}

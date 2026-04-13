import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'
import { useLeaderboard } from '../hooks/useLeaderboard'
import LeaderboardTable from '../components/LeaderboardTable'
import { Loader2 } from 'lucide-react'

const TABS = [
  { key: 'weekly' as const, de: 'Diese Woche', en: 'This Week' },
  { key: 'alltime' as const, de: 'All-Time', en: 'All-Time' },
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
        <button onClick={() => navigate('/')} className="text-text-secondary hover:text-text-primary text-lg">←</button>
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
              {t[locale]}
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
        ) : (
          <LeaderboardTable entries={lb.entries} currentUserId={user?.id ?? ''} locale={locale} />
        )}
      </main>
    </div>
  )
}

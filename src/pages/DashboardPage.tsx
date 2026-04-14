import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'
import StreakBar from '../components/StreakBar'
import LevelBar from '../components/LevelBar'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

interface WeeklyChampion {
  display_name: string
  total_score: number
  week_start: string
}

export function DashboardPage() {
  const { profile, signOut } = useAuth()
  const { locale, setLocale, t } = useLocale()
  const [champion, setChampion] = useState<WeeklyChampion | null>(null)
  const [showChampion, setShowChampion] = useState(true)

  const now = new Date()
  const weekday = now.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { weekday: 'long' })
  const dateStr = now.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { day: 'numeric', month: 'long' })
  const avatarInitial = (profile?.display_name ?? '?').charAt(0).toUpperCase()

  // Derive played days this week (simplified: just check if last_played_at is today)
  const todayStr = now.toISOString().split('T')[0]
  const dayNames = ['so', 'mo', 'di', 'mi', 'do', 'fr', 'sa']
  const playedDays = profile?.last_played_at === todayStr ? [dayNames[now.getDay()]] : []

  // Load weekly champion on Mondays (or always for demo)
  useEffect(() => {
    async function loadChampion() {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/get-leaderboard?tab=halloffame`, {
          method: 'POST',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        })
        const data = await res.json()
        if (data.entries?.length > 0) {
          const latest = data.entries[0]
          setChampion({
            display_name: latest.display_name,
            total_score: latest.total_score,
            week_start: latest.week_start ?? '',
          })
        }
      } catch { /* ignore */ }
    }
    loadChampion()
  }, [])

  const quickNav = [
    { emoji: '🎮', label: t('dashboard.freePlay'), to: '/app/freeplay' },
    { emoji: '🏆', label: t('dashboard.leaderboard'), to: '/app/leaderboard' },
    { emoji: '⚔️', label: t('dashboard.challenge'), to: '/app' },
    { emoji: '🎖️', label: t('dashboard.badges'), to: '/app/profile' },
    { emoji: '❓', label: 'FAQ', to: '/app/faq' },
  ]

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/6">
        <span className="text-lg font-bold tracking-tight text-primary">AI-SHIFT HAPPENS</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocale(locale === 'de' ? 'en' : 'de')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/6 text-text-secondary hover:text-text-primary hover:border-primary transition-colors"
          >
            {locale === 'de' ? 'EN' : 'DE'}
          </button>
          <Link to="/app/profile" className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
            {avatarInitial}
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-5 py-6 gap-4 max-w-md mx-auto w-full">
        {/* Streak */}
        <StreakBar
          streak={profile?.current_streak ?? 0}
          playedDays={playedDays}
          locale={locale}
          t={t}
        />

        {/* Weekly Champion Banner */}
        {champion && showChampion && (
          <div className="relative rounded-2xl overflow-hidden border border-gold/20" style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.15) 0%, rgba(234,179,8,0.05) 100%)' }}>
            <button onClick={() => setShowChampion(false)} className="absolute top-2 right-3 text-text-muted hover:text-text-primary text-xs">✕</button>
            <div className="p-4 flex items-center gap-3">
              <div className="text-3xl">👑</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gold">
                  {locale === 'de' ? 'Wochen-Champion' : 'Weekly Champion'}
                </p>
                <p className="font-bold text-sm truncate">{champion.display_name}</p>
                <p className="text-xs text-text-muted font-mono">{champion.total_score.toLocaleString()} Pts</p>
              </div>
              <Link to="/app/leaderboard" className="text-xs font-semibold text-gold hover:underline">
                {locale === 'de' ? 'Rangliste →' : 'Rankings →'}
              </Link>
            </div>
          </div>
        )}

        {/* Daily Quiz Card */}
        <Link
          to="/app/daily"
          className="block rounded-2xl overflow-hidden hover:scale-[1.01] transition-transform"
          style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #3B82F6 100%)' }}
        >
          <div className="p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">{t('dashboard.dailyQuiz')}</p>
                <p className="text-white font-bold text-lg mt-0.5 capitalize">{weekday}</p>
                <p className="text-white/60 text-sm">{dateStr}</p>
              </div>
              <div className="text-3xl">🧠</div>
            </div>
            <p className="text-white/80 text-sm">3+1 Bonus · ~3 Min</p>
            <span className="inline-block bg-white text-primary font-bold text-sm px-5 py-2 rounded-xl">
              {t('dashboard.playNow')}
            </span>
          </div>
        </Link>

        {/* Level */}
        <LevelBar totalXp={profile?.total_xp ?? 0} locale={locale} />

        {/* Quick Nav */}
        <div className="grid grid-cols-2 gap-3">
          {quickNav.map(item => (
            <Link
              key={item.label}
              to={item.to}
              className="bg-white/4 border border-white/6 rounded-2xl p-4 text-center hover:border-primary/30 transition-colors"
            >
              <div className="text-2xl mb-1">{item.emoji}</div>
              <div className="text-xs font-semibold text-text-secondary">{item.label}</div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="flex justify-center pb-6 px-5">
        <button onClick={() => signOut()} className="text-text-muted hover:text-text-secondary text-sm transition-colors">
          {t('auth.signOut')}
        </button>
      </footer>
    </div>
  )
}

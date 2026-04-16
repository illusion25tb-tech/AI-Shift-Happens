import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'
import { supabase } from '../lib/supabase'
import StreakBar from '../components/StreakBar'
import LevelBar from '../components/LevelBar'
import Onboarding from '../components/Onboarding'
import PageTransition from '../components/PageTransition'
import SponsorBanner from '../components/SponsorBanner'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

interface WeeklyChampion {
  display_name: string
  total_score: number
  week_start: string
}

interface FreezeStatus {
  eligible: boolean
  streak_at_risk: boolean
  current_streak: number
  cost_xp: number
  can_afford: boolean
}

const DAILY_TIPS = {
  de: [
    'KI ersetzt nicht dein Urteil — sie erweitert es.',
    'Iterieren statt akzeptieren: Der erste Output ist ein Entwurf.',
    'Je mehr Kontext du gibst, desto besser das Ergebnis.',
    'Denken auslagern, Entscheidung behalten.',
    'KI-Tools sind Werkzeuge, keine Autopiloten.',
    'Die beste Antwort kommt durch die richtige Frage.',
    'Streaks belohnen Konsistenz — nicht Perfektion.',
    'Wer KI als Partner nutzt, gewinnt den Vorsprung.',
    'Kleine tägliche Verbesserungen = exponentielles Wachstum.',
    'Dein KI-Mindset ist dein wertvollstes Skill-Update.',
  ],
  en: [
    'AI doesn\'t replace your judgment — it expands it.',
    'Iterate, don\'t accept: First output is a draft.',
    'The more context you provide, the better the result.',
    'Outsource thinking, keep the decision.',
    'AI tools are instruments, not autopilots.',
    'The best answer comes from the right question.',
    'Streaks reward consistency — not perfection.',
    'Those who use AI as a partner gain the edge.',
    'Small daily improvements = exponential growth.',
    'Your AI mindset is your most valuable skill upgrade.',
  ],
}

function DailyTip({ locale }: { locale: 'de' | 'en' }) {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const tips = DAILY_TIPS[locale]
  const tip = tips[dayOfYear % tips.length]

  return (
    <div className="flex-1 bg-primary/5 border border-primary/10 rounded-xl p-3 flex items-start gap-2">
      <span className="text-lg">💡</span>
      <p className="text-xs text-text-secondary leading-relaxed">{tip}</p>
    </div>
  )
}

export function DashboardPage() {
  const { profile, signOut } = useAuth()
  const { locale, setLocale, t } = useLocale()
  const [champion, setChampion] = useState<WeeklyChampion | null>(null)
  const [showChampion, setShowChampion] = useState(true)
  const [freezeStatus, setFreezeStatus] = useState<FreezeStatus | null>(null)
  const [freezing, setFreezing] = useState(false)
  const [pendingChallenges, setPendingChallenges] = useState(0)
  const [myRank, setMyRank] = useState<number | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('shift-happens-onboarded')
  )

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

    // Check streak freeze eligibility
    async function checkFreeze() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) return
        const { data } = await supabase.functions.invoke('streak-freeze', {
          body: { action: 'check' },
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (data?.streak_at_risk) setFreezeStatus(data)
      } catch { /* ignore */ }
    }
    checkFreeze()

    // Check pending challenges
    async function checkChallenges() {
      try {
        const { data, error } = await supabase
          .from('challenges')
          .select('id', { count: 'exact', head: true })
          .or(`challenger_id.eq.${profile?.id},challenged_id.eq.${profile?.id}`)
          .is('completed_at', null)
        if (!error && data !== null) {
          setPendingChallenges(typeof data === 'number' ? data : 0)
        }
      } catch { /* ignore */ }
    }
    if (profile?.id) checkChallenges()

    // Load my leaderboard rank
    async function loadRank() {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/get-leaderboard?tab=alltime`, {
          method: 'POST',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        })
        const data = await res.json()
        const me = (data.entries ?? []).find((e: any) => e.user_id === profile?.id)
        if (me) setMyRank(me.rank)
      } catch { /* ignore */ }
    }
    if (profile?.id) loadRank()
  }, [profile?.id])

  const useStreakFreeze = async () => {
    setFreezing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await supabase.functions.invoke('streak-freeze', {
        body: { action: 'freeze' },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      })
      setFreezeStatus(null)
    } catch { /* ignore */ }
    setFreezing(false)
  }

  const quickNav = [
    { emoji: '🎮', label: t('dashboard.freePlay'), to: '/app/freeplay' },
    { emoji: '🏆', label: t('dashboard.leaderboard'), to: '/app/leaderboard' },
    { emoji: '⚔️', label: t('dashboard.challenge'), to: '/app/challenge', badge: pendingChallenges > 0 ? pendingChallenges : undefined },
    { emoji: '👥', label: 'Team', to: '/app/team' },
    { emoji: '🎖️', label: t('dashboard.badges'), to: '/app/profile' },
    { emoji: '📊', label: locale === 'de' ? 'Statistiken' : 'Stats', to: '/app/stats' },
    { emoji: '❓', label: 'FAQ', to: '/app/faq' },
    ...(profile?.is_admin ? [{ emoji: '⚙️', label: 'Admin', to: '/app/admin' }] : []),
  ]

  return (
    <PageTransition>
    <div className="min-h-screen bg-bg-base text-text-primary font-sans flex flex-col">
      {showOnboarding && <Onboarding locale={locale} onComplete={() => setShowOnboarding(false)} />}

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

        {/* Streak Freeze Banner */}
        {freezeStatus && freezeStatus.streak_at_risk && (
          <div className="bg-fire/10 border border-fire/20 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🥶</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-fire">
                  {locale === 'de'
                    ? `Dein ${freezeStatus.current_streak}-Tage-Streak ist in Gefahr!`
                    : `Your ${freezeStatus.current_streak}-day streak is at risk!`}
                </p>
                <p className="text-xs text-text-muted">
                  {locale === 'de'
                    ? `${freezeStatus.cost_xp} XP ausgeben um den Streak zu retten`
                    : `Spend ${freezeStatus.cost_xp} XP to save your streak`}
                </p>
              </div>
            </div>
            {freezeStatus.can_afford ? (
              <button
                onClick={useStreakFreeze}
                disabled={freezing}
                className="w-full bg-fire/20 text-fire font-semibold py-2 rounded-xl text-sm hover:bg-fire/30 transition-colors disabled:opacity-50"
              >
                {freezing
                  ? '...'
                  : (locale === 'de' ? `🧊 Streak Freeze (${freezeStatus.cost_xp} XP)` : `🧊 Streak Freeze (${freezeStatus.cost_xp} XP)`)}
              </button>
            ) : (
              <p className="text-xs text-text-muted text-center">
                {locale === 'de'
                  ? `Nicht genug XP (brauchst ${freezeStatus.cost_xp}, hast ${profile?.total_xp ?? 0})`
                  : `Not enough XP (need ${freezeStatus.cost_xp}, have ${profile?.total_xp ?? 0})`}
              </p>
            )}
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

        {/* Rank + Daily Tip */}
        <div className="flex gap-3">
          {myRank && (
            <div className="flex-1 bg-white/4 border border-white/6 rounded-xl p-3 flex items-center gap-2">
              <span className="text-lg">🏅</span>
              <div>
                <div className="text-xs text-text-muted">{locale === 'de' ? 'Dein Rang' : 'Your Rank'}</div>
                <div className="text-sm font-bold font-mono text-primary">#{myRank}</div>
              </div>
            </div>
          )}
          <DailyTip locale={locale} />
        </div>

        {/* Sponsor Prize */}
        <SponsorBanner locale={locale} placement="dashboard" />

        {/* Quick Nav */}
        <div className="grid grid-cols-2 gap-3">
          {quickNav.map(item => (
            <Link
              key={item.label}
              to={item.to}
              className="bg-white/4 border border-white/6 rounded-2xl p-4 text-center hover:border-primary/30 transition-colors relative"
            >
              {'badge' in item && item.badge && (
                <span className="absolute top-2 right-2 w-5 h-5 bg-fire text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
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
    </PageTransition>
  )
}

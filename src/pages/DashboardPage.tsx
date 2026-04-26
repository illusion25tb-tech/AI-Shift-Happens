import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'
import type { Locale } from '../types'
import { supabase } from '../lib/supabase'
import StreakBar from '../components/StreakBar'
import LevelBar from '../components/LevelBar'
import Onboarding from '../components/Onboarding'
import PageTransition from '../components/PageTransition'
import SponsorBanner from '../components/SponsorBanner'
import { lf } from '../lib/constants'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Locale → BCP47 für Date-Formatierung
const DATE_LOCALES: Record<Locale, string> = { de: 'de-DE', en: 'en-US', tr: 'tr-TR', es: 'es-ES' }

// Inline labels für Dashboard
const L = {
  stats: { de: 'Statistiken', en: 'Stats', tr: 'İstatistikler', es: 'Estadísticas' },
  weeklyChampion: { de: 'Wochen-Champion', en: 'Weekly Champion', tr: 'Haftanın Şampiyonu', es: 'Campeón Semanal' },
  rankings: { de: 'Rangliste →', en: 'Rankings →', tr: 'Sıralama →', es: 'Clasificación →' },
  weekend: { de: 'Wochenende', en: 'Weekend', tr: 'Hafta Sonu', es: 'Fin de Semana' },
  startFreePlayEmoji: { de: '🎮 Free Play starten', en: '🎮 Start Free Play', tr: '🎮 Serbest Oyunu Başlat', es: '🎮 Iniciar Juego Libre' },
  played: { de: 'gespielt', en: 'played', tr: 'oynanan', es: 'jugado' },
  startFreePlay: { de: 'Free Play starten', en: 'Start Free Play', tr: 'Serbest Oyunu Başlat', es: 'Iniciar Juego Libre' },
  startFreePlaySub: { de: '10 Fragen, wähle deine Kategorie', en: '10 questions, choose your category', tr: '10 soru, kategorini seç', es: '10 preguntas, elige tu categoría' },
  yourRank: { de: 'Dein Rang', en: 'Your Rank', tr: 'Sıralaman', es: 'Tu Rango' },
  quizzes: { de: 'Quizzes', en: 'Quizzes', tr: 'Quizler', es: 'Quizzes' },
  streakAtRisk: {
    de: (n: number) => `Dein ${n}-Tage-Streak ist in Gefahr!`,
    en: (n: number) => `Your ${n}-day streak is at risk!`,
    tr: (n: number) => `${n}-günlük serin tehlikede!`,
    es: (n: number) => `¡Tu racha de ${n} días está en peligro!`,
  },
  spendToSave: {
    de: (xp: number) => `${xp} XP ausgeben um den Streak zu retten`,
    en: (xp: number) => `Spend ${xp} XP to save your streak`,
    tr: (xp: number) => `Seriyi kurtarmak için ${xp} XP harca`,
    es: (xp: number) => `Gasta ${xp} XP para salvar tu racha`,
  },
  notEnoughXp: {
    de: (need: number, have: number) => `Nicht genug XP (brauchst ${need}, hast ${have})`,
    en: (need: number, have: number) => `Not enough XP (need ${need}, have ${have})`,
    tr: (need: number, have: number) => `Yeterli XP yok (gerekli ${need}, var ${have})`,
    es: (need: number, have: number) => `XP insuficiente (necesitas ${need}, tienes ${have})`,
  },
  weekendBody: {
    de: 'Das Daily Quiz geht am Montag weiter. Dein Streak bleibt erhalten!',
    en: 'Daily quiz continues on Monday. Your streak is preserved!',
    tr: 'Günlük Quiz Pazartesi devam ediyor. Serin korunuyor!',
    es: '¡El quiz diario continúa el lunes. Tu racha se mantiene!',
  },
}

// Helper für Funktion-basierte Labels (mit Parametern)
function lfFn<T extends (...args: any[]) => string>(obj: Record<string, T>, locale: Locale, ...args: Parameters<T>): string {
  return (obj[locale] ?? obj.en)(...args)
}

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

function DailyTip({ locale }: { locale: Locale }) {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const tips = DAILY_TIPS[(locale as 'de' | 'en') in DAILY_TIPS ? (locale as 'de' | 'en') : 'en']
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
  const [activeToday, setActiveToday] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('shift-happens-onboarded')
  )

  const now = new Date()
  const weekday = now.toLocaleDateString(DATE_LOCALES[locale], { weekday: 'long' })
  const dateStr = now.toLocaleDateString(DATE_LOCALES[locale], { day: 'numeric', month: 'long' })
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

    // Check pending challenges via RPC-safe count
    async function checkChallenges() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) return
        const { count } = await supabase
          .from('challenges')
          .select('*', { count: 'exact', head: true })
          .is('completed_at', null)
        setPendingChallenges(count ?? 0)
      } catch { /* RLS may block — silently ignore */ }
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

    // Active today
    fetch(`${SUPABASE_URL}/functions/v1/get-public-stats`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    }).then(r => r.json()).then(d => {
      if (d.players) setActiveToday(d.quizzes_played ?? 0)
    }).catch(() => {})
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
    { emoji: '📊', label: lf(L.stats, locale), to: '/app/stats' },
    { emoji: '❓', label: 'FAQ', to: '/app/faq' },
    ...(profile?.is_admin ? [{ emoji: '⚙️', label: 'Admin', to: '/app/admin' }] : []),
  ]

  return (
    <PageTransition>
    <div className="min-h-screen bg-bg-base text-text-primary font-sans flex flex-col">
      {showOnboarding && <Onboarding locale={locale} onComplete={() => setShowOnboarding(false)} />}

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/6">
        <img src={`${import.meta.env.BASE_URL}shift-logo.png`} alt="AI-Shift Happens" className="h-8" />
        <div className="flex items-center gap-3">
          <select
            value={locale}
            onChange={e => setLocale(e.target.value as any)}
            className="text-xs font-semibold px-2 py-1.5 rounded-lg border border-white/6 bg-transparent text-text-secondary hover:border-primary transition-colors cursor-pointer"
          >
            <option value="de">DE</option>
            <option value="en">EN</option>
            <option value="tr">TR</option>
            <option value="es">ES</option>
          </select>
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
                  {lf(L.weeklyChampion, locale)}
                </p>
                <p className="font-bold text-sm truncate">{champion.display_name}</p>
                <p className="text-xs text-text-muted font-mono">{champion.total_score.toLocaleString()} Pts</p>
              </div>
              <Link to="/app/leaderboard" className="text-xs font-semibold text-gold hover:underline">
                {lf(L.rankings, locale)}
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
                  {lfFn(L.streakAtRisk, locale, freezeStatus.current_streak)}
                </p>
                <p className="text-xs text-text-muted">
                  {lfFn(L.spendToSave, locale, freezeStatus.cost_xp)}
                </p>
              </div>
            </div>
            {freezeStatus.can_afford ? (
              <button
                onClick={useStreakFreeze}
                disabled={freezing}
                className="w-full bg-fire/20 text-fire font-semibold py-2 rounded-xl text-sm hover:bg-fire/30 transition-colors disabled:opacity-50"
              >
                {freezing ? '...' : `🧊 Streak Freeze (${freezeStatus.cost_xp} XP)`}
              </button>
            ) : (
              <p className="text-xs text-text-muted text-center">
                {lfFn(L.notEnoughXp, locale, freezeStatus.cost_xp, profile?.total_xp ?? 0)}
              </p>
            )}
          </div>
        )}

        {/* Daily Quiz Card — weekend vs weekday */}
        {now.getDay() === 0 || now.getDay() === 6 ? (
          <div className="rounded-2xl overflow-hidden border border-white/6 bg-white/4">
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-text-muted text-xs font-semibold uppercase tracking-wider">{t('dashboard.dailyQuiz')}</p>
                  <p className="font-bold text-lg mt-0.5">☀️ {lf(L.weekend, locale)}</p>
                </div>
                <div className="text-2xl">😎</div>
              </div>
              <p className="text-text-secondary text-sm">
                {lf(L.weekendBody, locale)}
              </p>
              <Link
                to="/app/freeplay"
                className="inline-block bg-primary text-white font-bold text-sm px-5 py-2 rounded-xl hover:bg-primary-hover transition-colors"
              >
                {lf(L.startFreePlayEmoji, locale)}
              </Link>
            </div>
          </div>
        ) : (
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
              <div className="flex gap-2">
                <span className="inline-block bg-white text-primary font-bold text-sm px-5 py-2 rounded-xl">
                  {t('dashboard.playNow')}
                </span>
                {activeToday > 0 && (
                  <span className="inline-block bg-white/20 text-white/80 text-xs px-3 py-2 rounded-xl">
                    {activeToday} {lf(L.played, locale)}
                  </span>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Quick Free Play */}
        <Link
          to="/app/freeplay"
          className="block rounded-2xl overflow-hidden hover:scale-[1.01] transition-transform bg-white/4 border border-white/6"
        >
          <div className="p-4 flex items-center gap-3">
            <div className="text-2xl">🎮</div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{lf(L.startFreePlay, locale)}</p>
              <p className="text-xs text-text-muted">{lf(L.startFreePlaySub, locale)}</p>
            </div>
            <span className="text-text-muted">&rarr;</span>
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
                <div className="text-xs text-text-muted">{lf(L.yourRank, locale)}</div>
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

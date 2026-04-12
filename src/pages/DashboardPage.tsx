import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'

export function DashboardPage() {
  const { profile, signOut } = useAuth()
  const { locale, setLocale, t } = useLocale()

  const now = new Date()
  const weekday = now.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', { weekday: 'long' })
  const date = now.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
    day: 'numeric',
    month: 'long',
  })

  const avatarInitial = (profile?.display_name ?? '?').charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-bg-card-border">
        <span className="text-lg font-bold tracking-tight text-primary">AI-SHIFT HAPPENS</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocale(locale === 'de' ? 'en' : 'de')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-bg-card-border text-text-secondary hover:text-text-primary hover:border-primary transition-colors"
          >
            {locale === 'de' ? 'EN' : 'DE'}
          </button>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold select-none">
            {avatarInitial}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center px-5 py-8 gap-6 max-w-md mx-auto w-full">
        {/* Daily Quiz Card */}
        <Link
          to="/daily"
          className="w-full rounded-2xl overflow-hidden block hover:scale-[1.01] transition-transform"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #3B82F6 100%)',
          }}
        >
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">
                  {t('dashboard.dailyQuiz')}
                </p>
                <p className="text-white font-bold text-lg mt-0.5 capitalize">
                  {weekday}
                </p>
                <p className="text-white/60 text-sm">{date}</p>
              </div>
              <div className="text-3xl select-none">🧠</div>
            </div>

            <p className="text-white/80 text-sm">
              3+1 Bonus · ~3 Min
            </p>

            <div className="flex">
              <span className="inline-block bg-white text-primary font-bold text-sm px-5 py-2 rounded-xl">
                {t('dashboard.playNow')}
              </span>
            </div>
          </div>
        </Link>

        {/* Placeholder for future cards */}
        <div className="w-full bg-bg-card border border-bg-card-border rounded-2xl p-5 opacity-50">
          <p className="text-text-muted text-sm text-center">{t('dashboard.moreComingSoon')}</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex justify-center pb-6 px-5">
        <button
          onClick={() => signOut()}
          className="text-text-muted hover:text-text-secondary text-sm transition-colors"
        >
          {t('auth.signOut')}
        </button>
      </footer>
    </div>
  )
}

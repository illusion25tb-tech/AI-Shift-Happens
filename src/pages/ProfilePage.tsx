import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'
import { supabase } from '../lib/supabase'
import LevelBar from '../components/LevelBar'
import BadgeGrid from '../components/BadgeGrid'

export function ProfilePage() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const { locale, setLocale, t } = useLocale()
  const [earnedBadges, setEarnedBadges] = useState<string[]>([])

  useEffect(() => {
    if (!profile) return
    supabase
      .from('user_badges')
      .select('badge_type')
      .eq('user_id', profile.id)
      .then(({ data }) => {
        setEarnedBadges((data ?? []).map(b => b.badge_type))
      })
  }, [profile])

  if (!profile) return null

  const avatarInitial = (profile.display_name || '?').charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans flex flex-col">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-white/6">
        <button onClick={() => navigate('/')} className="text-text-secondary hover:text-text-primary text-lg">←</button>
        <h1 className="text-lg font-bold">{t('profile.title')}</h1>
      </header>

      <main className="flex-1 px-5 py-6 max-w-md mx-auto w-full space-y-5">
        {/* Avatar + Name */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-teal flex items-center justify-center text-white text-2xl font-bold">
            {avatarInitial}
          </div>
          <div className="text-lg font-bold">{profile.display_name || 'Anonym'}</div>
          <div className="text-sm text-text-muted">{profile.invite_code ? `Code: ${profile.invite_code}` : ''}</div>
        </div>

        {/* Level */}
        <LevelBar totalXp={profile.total_xp ?? 0} locale={locale} />

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/4 border border-white/6 rounded-xl p-3 text-center">
            <div className="text-lg font-bold font-mono text-primary">{(profile.total_xp ?? 0).toLocaleString()}</div>
            <div className="text-[10px] text-text-muted uppercase">{t('profile.totalXp')}</div>
          </div>
          <div className="bg-white/4 border border-white/6 rounded-xl p-3 text-center">
            <div className="text-lg font-bold font-mono text-fire">{profile.longest_streak ?? 0}</div>
            <div className="text-[10px] text-text-muted uppercase">{t('profile.longestStreak')}</div>
          </div>
          <div className="bg-white/4 border border-white/6 rounded-xl p-3 text-center">
            <div className="text-lg font-bold font-mono text-gold">{earnedBadges.length}</div>
            <div className="text-[10px] text-text-muted uppercase">{t('profile.badgesEarned')}</div>
          </div>
        </div>

        {/* Badges */}
        <div>
          <h2 className="text-sm font-bold mb-3">🎖️ {t('profile.badgesEarned')}</h2>
          <BadgeGrid earnedBadges={earnedBadges} locale={locale} />
        </div>

        {/* Language Toggle */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm font-semibold">{locale === 'de' ? 'Sprache' : 'Language'}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setLocale('de')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${locale === 'de' ? 'bg-primary text-white' : 'bg-white/6 text-text-muted'}`}
            >
              🇩🇪 DE
            </button>
            <button
              onClick={() => setLocale('en')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${locale === 'en' ? 'bg-primary text-white' : 'bg-white/6 text-text-muted'}`}
            >
              🇬🇧 EN
            </button>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={() => signOut()}
          className="w-full py-3 rounded-xl border border-danger/20 text-danger text-sm font-semibold hover:bg-danger/10 transition-colors"
        >
          {t('auth.signOut')}
        </button>
      </main>
    </div>
  )
}

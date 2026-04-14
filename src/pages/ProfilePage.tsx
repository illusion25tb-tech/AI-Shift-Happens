import { useState, useEffect, useCallback } from 'react'
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
  const [companyInput, setCompanyInput] = useState('')
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [companySaving, setCompanySaving] = useState(false)
  const [companySaved, setCompanySaved] = useState(false)

  useEffect(() => {
    if (!profile) return
    setCompanyInput(profile.company_name ?? '')
    supabase
      .from('user_badges')
      .select('badge_type')
      .eq('user_id', profile.id)
      .then(({ data }) => {
        setEarnedBadges((data ?? []).map(b => b.badge_type))
      })
  }, [profile])

  const searchCompanies = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setCompanySuggestions([])
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('company_name')
      .not('company_name', 'is', null)
      .ilike('company_name', `%${query.trim()}%`)
      .limit(20)

    if (data) {
      // Deduplicate by normalized name, show original casing
      const seen = new Map<string, string>()
      for (const row of data) {
        if (row.company_name) {
          const key = row.company_name.trim().toLowerCase()
          if (!seen.has(key)) seen.set(key, row.company_name.trim())
        }
      }
      setCompanySuggestions([...seen.values()])
    }
  }, [])

  const saveCompany = useCallback(async (name: string) => {
    if (!profile) return
    setCompanySaving(true)
    setCompanySaved(false)

    // Normalize: if an existing company matches (case-insensitive), use that exact spelling
    const trimmed = name.trim()
    let finalName: string | null = trimmed || null

    if (finalName) {
      const { data } = await supabase
        .from('profiles')
        .select('company_name')
        .not('company_name', 'is', null)
        .limit(500)

      if (data) {
        const match = data.find(
          r => r.company_name && r.company_name.trim().toLowerCase() === finalName!.toLowerCase()
        )
        if (match?.company_name) finalName = match.company_name.trim()
      }
    }

    await supabase
      .from('profiles')
      .update({ company_name: finalName })
      .eq('id', profile.id)

    setCompanyInput(finalName ?? '')
    setCompanySaving(false)
    setCompanySaved(true)
    setShowSuggestions(false)
    setTimeout(() => setCompanySaved(false), 2000)
  }, [profile])

  if (!profile) return null

  const avatarInitial = (profile.display_name || '?').charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans flex flex-col">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-white/6">
        <button onClick={() => navigate('/app')} className="text-text-secondary hover:text-text-primary text-lg">←</button>
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

        {/* Company */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-4 space-y-2">
          <label className="text-sm font-semibold">
            {locale === 'de' ? 'Unternehmen' : 'Company'}
          </label>
          <div className="relative">
            <input
              type="text"
              value={companyInput}
              onChange={(e) => {
                setCompanyInput(e.target.value)
                searchCompanies(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => {
                if (companySuggestions.length > 0) setShowSuggestions(true)
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={locale === 'de' ? 'Firmenname eingeben...' : 'Enter company name...'}
              className="w-full bg-white/6 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
            />
            {showSuggestions && companySuggestions.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-bg-card border border-white/10 rounded-lg overflow-hidden shadow-lg max-h-40 overflow-y-auto">
                {companySuggestions.map(name => (
                  <button
                    key={name}
                    onMouseDown={() => {
                      setCompanyInput(name)
                      setShowSuggestions(false)
                      saveCompany(name)
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-primary/10 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => saveCompany(companyInput)}
              disabled={companySaving}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50"
            >
              {companySaving
                ? (locale === 'de' ? 'Speichern...' : 'Saving...')
                : (locale === 'de' ? 'Speichern' : 'Save')}
            </button>
            {companySaved && (
              <span className="text-xs text-teal">✓ {locale === 'de' ? 'Gespeichert' : 'Saved'}</span>
            )}
          </div>
          <p className="text-[10px] text-text-muted">
            {locale === 'de'
              ? 'Dein Unternehmen erscheint im Firmen-Leaderboard (min. 3 Spieler).'
              : 'Your company appears in the company leaderboard (min. 3 players).'}
          </p>
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

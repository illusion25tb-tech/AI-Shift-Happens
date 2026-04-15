import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'
import { supabase } from '../lib/supabase'
import LevelBar from '../components/LevelBar'
import BadgeGrid from '../components/BadgeGrid'
import { CATEGORY_LABELS } from '../lib/constants'
import { canNotify, notificationPermission, requestNotificationPermission, isReminderEnabled, setReminderEnabled, scheduleLocalReminder } from '../lib/notifications'
import type { CategoryId } from '../lib/constants'

interface QuizStats {
  totalQuizzes: number
  totalCorrect: number
  totalQuestions: number
  categoryBreakdown: { category: string; count: number }[]
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { profile, user, signOut } = useAuth()
  const { locale, setLocale, t } = useLocale()
  const [earnedBadges, setEarnedBadges] = useState<string[]>([])
  const [companyInput, setCompanyInput] = useState('')
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [companySaving, setCompanySaving] = useState(false)
  const [companySaved, setCompanySaved] = useState(false)

  // Display name editing
  const [nameInput, setNameInput] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameSaving, setNameSaving] = useState(false)

  // Quiz stats
  const [stats, setStats] = useState<QuizStats | null>(null)

  // Avatar upload
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Password change (email users only)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Account deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (!profile) return
    setCompanyInput(profile.company_name ?? '')
    setNameInput(profile.display_name ?? '')
    setAvatarUrl(profile.avatar_url ?? null)

    // Load badges
    supabase
      .from('user_badges')
      .select('badge_type')
      .eq('user_id', profile.id)
      .then(({ data }) => {
        setEarnedBadges((data ?? []).map(b => b.badge_type))
      })

    // Load quiz stats
    supabase
      .from('quiz_attempts')
      .select('answers, category')
      .eq('user_id', profile.id)
      .then(({ data }) => {
        if (!data) return
        const categoryMap = new Map<string, number>()
        let totalCorrect = 0
        let totalQuestions = 0

        for (const attempt of data) {
          const answers = attempt.answers as any[] ?? []
          totalQuestions += answers.length
          totalCorrect += answers.filter((a: any) => a.is_correct).length

          // Count categories from answers
          if (attempt.category) {
            categoryMap.set(attempt.category, (categoryMap.get(attempt.category) ?? 0) + 1)
          }
        }

        const categoryBreakdown = [...categoryMap.entries()]
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count)

        setStats({
          totalQuizzes: data.length,
          totalCorrect,
          totalQuestions,
          categoryBreakdown,
        })
      })
  }, [profile])

  const saveName = useCallback(async () => {
    if (!profile || !nameInput.trim()) return
    setNameSaving(true)
    await supabase
      .from('profiles')
      .update({ display_name: nameInput.trim() })
      .eq('id', profile.id)
    setNameSaving(false)
    setEditingName(false)
  }, [profile, nameInput])

  const uploadAvatar = useCallback(async (file: File) => {
    if (!profile) return
    setAvatarUploading(true)

    const ext = file.name.split('.').pop() ?? 'png'
    const path = `${profile.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      console.error('Avatar upload error:', uploadError)
      setAvatarUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(path)

    const publicUrl = urlData.publicUrl + '?t=' + Date.now()

    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', profile.id)

    setAvatarUrl(publicUrl)
    setAvatarUploading(false)
  }, [profile])

  const changePassword = useCallback(async () => {
    setPasswordMsg(null)
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'err', text: locale === 'de' ? 'Mindestens 6 Zeichen' : 'Minimum 6 characters' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'err', text: locale === 'de' ? 'Passwörter stimmen nicht überein' : 'Passwords do not match' })
      return
    }
    setPasswordSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordSaving(false)
    if (error) {
      setPasswordMsg({ type: 'err', text: error.message })
    } else {
      setPasswordMsg({ type: 'ok', text: locale === 'de' ? 'Passwort geändert!' : 'Password changed!' })
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordChange(false)
    }
  }, [newPassword, confirmPassword, locale])

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

  const deleteAccount = useCallback(async () => {
    if (!user) return
    // Sign out first, then user needs to contact admin for full deletion
    // (Supabase doesn't allow self-deletion via client SDK)
    await signOut()
    navigate('/')
  }, [user, signOut, navigate])

  if (!profile) return null

  const avatarInitial = (profile.display_name || '?').charAt(0).toUpperCase()
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null
  const accuracy = stats && stats.totalQuestions > 0
    ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100)
    : null

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans flex flex-col">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-white/6">
        <button onClick={() => navigate('/app')} className="text-text-secondary hover:text-text-primary text-lg">&larr;</button>
        <h1 className="text-lg font-bold">{t('profile.title')}</h1>
      </header>

      <main className="flex-1 px-5 py-6 max-w-md mx-auto w-full space-y-5">
        {/* Avatar + Name */}
        <div className="flex flex-col items-center gap-2">
          <label className="relative cursor-pointer group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover border-2 border-primary/30 group-hover:border-primary transition-colors"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-teal flex items-center justify-center text-white text-2xl font-bold">
                {avatarInitial}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs">{avatarUploading ? '...' : '📷'}</span>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadAvatar(file)
              }}
            />
          </label>

          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                className="bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-text-primary text-center focus:outline-none focus:border-primary w-48"
                autoFocus
              />
              <button
                onClick={saveName}
                disabled={nameSaving}
                className="text-xs font-semibold px-2 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
              >
                {nameSaving ? '...' : '✓'}
              </button>
              <button
                onClick={() => { setEditingName(false); setNameInput(profile.display_name ?? '') }}
                className="text-xs text-text-muted hover:text-text-primary"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-lg font-bold hover:text-primary transition-colors group flex items-center gap-1"
            >
              {profile.display_name || 'Anonym'}
              <span className="text-text-muted text-xs opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
            </button>
          )}

          {user?.email && (
            <div className="text-xs text-text-muted">{user.email}</div>
          )}
          {memberSince && (
            <div className="text-xs text-text-muted">
              {locale === 'de' ? `Mitglied seit ${memberSince}` : `Member since ${memberSince}`}
            </div>
          )}
          {profile.invite_code && (
            <div className="text-xs text-text-muted">
              Code: <span className="font-mono text-primary">{profile.invite_code}</span>
            </div>
          )}
        </div>

        {/* Level */}
        <LevelBar totalXp={profile.total_xp ?? 0} locale={locale} />

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2">
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
          <div className="bg-white/4 border border-white/6 rounded-xl p-3 text-center">
            <div className="text-lg font-bold font-mono text-teal">{stats?.totalQuizzes ?? 0}</div>
            <div className="text-[10px] text-text-muted uppercase">{locale === 'de' ? 'Quizzes' : 'Quizzes'}</div>
          </div>
        </div>

        {/* Accuracy + Category Stats */}
        {stats && stats.totalQuestions > 0 && (
          <div className="bg-white/4 border border-white/6 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{locale === 'de' ? 'Trefferquote' : 'Accuracy'}</span>
              <span className="font-mono font-bold text-primary">{accuracy}%</span>
            </div>
            <div className="w-full bg-white/6 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${accuracy}%`,
                  background: 'linear-gradient(to right, var(--color-primary), var(--color-teal))',
                }}
              />
            </div>
            <div className="text-xs text-text-muted">
              {stats.totalCorrect} / {stats.totalQuestions} {locale === 'de' ? 'richtig' : 'correct'}
            </div>

            {stats.categoryBreakdown.length > 0 && (
              <div className="pt-2 border-t border-white/6 space-y-1.5">
                <span className="text-xs font-semibold text-text-muted uppercase">
                  {locale === 'de' ? 'Kategorien gespielt' : 'Categories played'}
                </span>
                {stats.categoryBreakdown.slice(0, 5).map(c => (
                  <div key={c.category} className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">
                      {CATEGORY_LABELS[c.category as CategoryId]?.[locale] ?? c.category}
                    </span>
                    <span className="font-mono text-text-muted">{c.count}×</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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

        {/* Notifications */}
        {canNotify() && (
          <div className="bg-white/4 border border-white/6 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold">{locale === 'de' ? 'Erinnerungen' : 'Reminders'}</span>
              <p className="text-[10px] text-text-muted mt-0.5">
                {locale === 'de' ? 'Daily Quiz Erinnerung (Mo-Fr)' : 'Daily quiz reminder (Mon-Fri)'}
              </p>
            </div>
            <button
              onClick={async () => {
                if (!isReminderEnabled()) {
                  const granted = notificationPermission() === 'granted' || await requestNotificationPermission()
                  if (granted) {
                    setReminderEnabled(true)
                    scheduleLocalReminder()
                  }
                } else {
                  setReminderEnabled(false)
                }
                // Force re-render
                setCompanySaved(prev => !prev)
                setTimeout(() => setCompanySaved(prev => !prev), 0)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                isReminderEnabled()
                  ? 'bg-primary text-white'
                  : 'bg-white/6 text-text-muted'
              }`}
            >
              {isReminderEnabled() ? (locale === 'de' ? 'An' : 'On') : (locale === 'de' ? 'Aus' : 'Off')}
            </button>
          </div>
        )}

        {/* Language Toggle */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm font-semibold">{locale === 'de' ? 'Sprache' : 'Language'}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setLocale('de')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${locale === 'de' ? 'bg-primary text-white' : 'bg-white/6 text-text-muted'}`}
            >
              DE
            </button>
            <button
              onClick={() => setLocale('en')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${locale === 'en' ? 'bg-primary text-white' : 'bg-white/6 text-text-muted'}`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Password Change — only for email users */}
        {user?.app_metadata?.provider === 'email' && (
          <div className="bg-white/4 border border-white/6 rounded-xl p-4 space-y-3">
            <button
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="text-sm font-semibold w-full text-left flex items-center justify-between"
            >
              <span>{locale === 'de' ? 'Passwort ändern' : 'Change password'}</span>
              <span className="text-text-muted text-xs">{showPasswordChange ? '▲' : '▼'}</span>
            </button>

            {showPasswordChange && (
              <div className="space-y-2 pt-1">
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder={locale === 'de' ? 'Neues Passwort (min. 6 Zeichen)' : 'New password (min. 6 chars)'}
                  className="w-full bg-white/6 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && changePassword()}
                  placeholder={locale === 'de' ? 'Passwort bestätigen' : 'Confirm password'}
                  className="w-full bg-white/6 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
                {passwordMsg && (
                  <p className={`text-xs ${passwordMsg.type === 'ok' ? 'text-teal' : 'text-danger'}`}>
                    {passwordMsg.text}
                  </p>
                )}
                <button
                  onClick={changePassword}
                  disabled={passwordSaving}
                  className="w-full bg-primary/20 text-primary font-semibold py-2 rounded-lg text-sm hover:bg-primary/30 transition-colors disabled:opacity-50"
                >
                  {passwordSaving
                    ? (locale === 'de' ? 'Speichern...' : 'Saving...')
                    : (locale === 'de' ? 'Passwort speichern' : 'Save password')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sign Out */}
        <button
          onClick={() => signOut()}
          className="w-full py-3 rounded-xl border border-white/10 text-text-secondary text-sm font-semibold hover:bg-white/4 transition-colors"
        >
          {t('auth.signOut')}
        </button>

        {/* Danger Zone */}
        <div className="pt-4 border-t border-white/6">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-text-muted hover:text-danger transition-colors"
            >
              {locale === 'de' ? 'Account löschen...' : 'Delete account...'}
            </button>
          ) : (
            <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 space-y-3">
              <p className="text-sm text-danger font-semibold">
                {locale === 'de'
                  ? 'Account wirklich löschen? Alle Daten gehen verloren.'
                  : 'Really delete account? All data will be lost.'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={deleteAccount}
                  className="text-xs font-bold px-4 py-2 rounded-lg bg-danger text-white hover:bg-danger/80 transition-colors"
                >
                  {locale === 'de' ? 'Ja, löschen' : 'Yes, delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-white/6 text-text-secondary hover:text-text-primary transition-colors"
                >
                  {locale === 'de' ? 'Abbrechen' : 'Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

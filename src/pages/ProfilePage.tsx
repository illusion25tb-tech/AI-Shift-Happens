import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'
import { supabase } from '../lib/supabase'
import LevelBar from '../components/LevelBar'
import BadgeGrid from '../components/BadgeGrid'
import { CATEGORY_LABELS, lf } from '../lib/constants'

import ShareStatsCard from '../components/ShareStatsCard'
import StreakCalendar from '../components/StreakCalendar'
import { canNotify, notificationPermission, requestNotificationPermission, isReminderEnabled, setReminderEnabled, scheduleLocalReminder } from '../lib/notifications'
import type { CategoryId } from '../lib/constants'


const L = {
  min6: { de: 'Mindestens 6 Zeichen', en: 'Minimum 6 characters', tr: 'En az 6 karakter', es: 'Mínimo 6 caracteres' },
  pwMismatch: { de: 'Passwörter stimmen nicht überein', en: 'Passwords do not match', tr: 'Şifreler eşleşmiyor', es: 'Las contraseñas no coinciden' },
  pwChanged: { de: 'Passwort geändert!', en: 'Password changed!', tr: 'Şifre değiştirildi!', es: '¡Contraseña cambiada!' },
  memberSince: { de: (d) => `Mitglied seit ${d}`, en: (d) => `Member since ${d}`, tr: (d) => `Üye olma: ${d}`, es: (d) => `Miembro desde ${d}` },
  yourInvite: { de: 'Dein Invite-Code:', en: 'Your invite code:', tr: 'Davet kodun:', es: 'Tu código de invitación:' },
  copyLink: { de: 'Link kopieren', en: 'Copy link', tr: 'Bağlantıyı kopyala', es: 'Copiar enlace' },
  inviteFriends: { de: 'Freunde einladen = 200 XP für dich pro Anmeldung', en: 'Invite friends = 200 XP per signup', tr: 'Arkadaşlarını davet et = kayit başına 200 XP', es: 'Invita amigos = 200 XP por registro' },
  quizzes: { de: 'Quizzes', en: 'Quizzes', tr: 'Quizler', es: 'Quizzes' },
  accuracy: { de: 'Trefferquote', en: 'Accuracy', tr: 'İsabet Oranı', es: 'Precisión' },
  correct: { de: 'richtig', en: 'correct', tr: 'doğru', es: 'correcto' },
  catsPlayed: { de: 'Kategorien gespielt', en: 'Categories played', tr: 'Oynanan kategoriler', es: 'Categorías jugadas' },
  company: { de: 'Unternehmen', en: 'Company', tr: 'Şirket', es: 'Empresa' },
  enterCompany: { de: 'Firmenname eingeben...', en: 'Enter company name...', tr: 'Şirket adı gir...', es: 'Ingresa nombre de empresa...' },
  saving: { de: 'Speichern...', en: 'Saving...', tr: 'Kaydediliyor...', es: 'Guardando...' },
  save: { de: 'Speichern', en: 'Save', tr: 'Kaydet', es: 'Guardar' },
  saved: { de: 'Gespeichert', en: 'Saved', tr: 'Kaydedildi', es: 'Guardado' },
  companyHint: { de: 'Dein Unternehmen erscheint im Firmen-Leaderboard (min. 3 Spieler).', en: 'Your company appears in the company leaderboard (min. 3 players).', tr: 'Şirketin firma siralamasinda gorunur (en az 3 oyuncu).', es: 'Tu empresa aparece en la clasificación (min. 3 jugadores).' },
  recentActivity: { de: 'Letzte Aktivität', en: 'Recent Activity', tr: 'Son Etkinlik', es: 'Actividad Reciente' },
  shiftStyle: { de: 'SHIFT-Style', en: 'SHIFT Style', tr: 'SHIFT Stili', es: 'Estilo SHIFT' },
  shiftBuddyDesc: { de: 'Dein KI-Buddy kommentiert jede Antwort', en: 'Your AI buddy comments on every answer', tr: 'AI dostun her cevabı yorumlar', es: 'Tu compañero de IA comenta cada respuesta' },
  serious: { de: 'Seriös', en: 'Serious', tr: 'Ciddi', es: 'Serio' },
  cheeky: { de: 'Frech', en: 'Cheeky', tr: 'Küstah', es: 'Atrevido' },
  reminders: { de: 'Erinnerungen', en: 'Reminders', tr: 'Hatırlatıcılar', es: 'Recordatorios' },
  reminderDesc: { de: 'Daily Quiz Erinnerung (Mo-Fr)', en: 'Daily quiz reminder (Mon-Fri)', tr: 'Günlük quiz hatırlatıcısı (Pzt-Cum)', es: 'Recordatorio de quiz diario (Lun-Vie)' },
  on: { de: 'An', en: 'On', tr: 'Açık', es: 'Activado' },
  off: { de: 'Aus', en: 'Off', tr: 'Kapalı', es: 'Desactivado' },
  language: { de: 'Sprache', en: 'Language', tr: 'Dil', es: 'Idioma' },
  changePw: { de: 'Passwort ändern', en: 'Change password', tr: 'Şifreyi değiştir', es: 'Cambiar contraseña' },
  newPw: { de: 'Neues Passwort (min. 6 Zeichen)', en: 'New password (min. 6 chars)', tr: 'Yeni şifre (en az 6 karakter)', es: 'Nueva contraseña (min. 6 chars)' },
  confirmPw: { de: 'Passwort bestätigen', en: 'Confirm password', tr: 'Sifreyi doğrula', es: 'Confirmar contraseña' },
  savePw: { de: 'Passwort speichern', en: 'Save password', tr: 'Şifreyi kaydet', es: 'Guardar contraseña' },
  deleteAccount: { de: 'Account löschen...', en: 'Delete account...', tr: 'Hesabı sil...', es: 'Eliminar cuenta...' },
  reallyDelete: { de: 'Account wirklich löschen? Alle Daten gehen verloren.', en: 'Really delete account? All data will be lost.', tr: 'Hesabı gerçekten sil? Tüm veriler kaybolur.', es: '¿Realmente eliminar cuenta? Todos los datos se perderán.' },
  yesDelete: { de: 'Ja, löschen', en: 'Yes, delete', tr: 'Evet, sil', es: 'Sí, eliminar' },
  cancel: { de: 'Abbrechen', en: 'Cancel', tr: 'İptal', es: 'Cancelar' },
}

const DATE_LOCALES_P = { de: 'de-DE', en: 'en-US', tr: 'tr-TR', es: 'es-ES' }

function lfFn<T extends (...args: any[]) => string>(obj: Record<string, T>, locale: string, ...args: Parameters<T>): string {
  return (obj[locale] ?? obj.en)(...args)
}

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

  // Recent activity
  const [recentQuizzes, setRecentQuizzes] = useState<Array<{ quiz_type: string; total_score: number; created_at: string }>>([])

  // Account deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // SHIFT-Mode local state (re-renders nach Toggle, profile aus useAuth ist stale)
  const [shiftMode, setShiftMode] = useState<'serious' | 'cheeky'>('cheeky')
  const [shiftSaving, setShiftSaving] = useState(false)

  // Reminder local state (isReminderEnabled liest localStorage, triggert keinen rerender)
  const [reminderOn, setReminderOn] = useState(false)
  const [reminderSaving, setReminderSaving] = useState(false)

  // Sync local state mit profile + localStorage on mount/profile-change
  useEffect(() => {
    if (profile) setShiftMode(profile.shift_mode ?? 'cheeky')
    setReminderOn(isReminderEnabled())
  }, [profile])

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

    // Load recent quizzes
    supabase
      .from('quiz_attempts')
      .select('quiz_type, total_score, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setRecentQuizzes(data)
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
      setPasswordMsg({ type: 'err', text: lf(L.min6, locale) })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'err', text: lf(L.pwMismatch, locale) })
      return
    }
    setPasswordSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordSaving(false)
    if (error) {
      setPasswordMsg({ type: 'err', text: error.message })
    } else {
      setPasswordMsg({ type: 'ok', text: lf(L.pwChanged, locale) })
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
    ? new Date(profile.created_at).toLocaleDateString(DATE_LOCALES_P[locale], {
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
              {lfFn(L.memberSince, locale, memberSince)}
            </div>
          )}
          {profile.invite_code && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">
                {lf(L.yourInvite, locale)}
              </span>
              <span className="font-mono text-primary font-bold text-xs">{profile.invite_code}</span>
              <button
                onClick={() => {
                  const url = `${window.location.origin}${import.meta.env.BASE_URL}login?ref=${profile.invite_code}`
                  navigator.clipboard.writeText(url)
                }}
                className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary"
              >
                {lf(L.copyLink, locale)}
              </button>
            </div>
          )}
          <p className="text-[10px] text-text-muted">
            {lf(L.inviteFriends, locale)}
          </p>
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
            <div className="text-[10px] text-text-muted uppercase">{lf(L.quizzes, locale)}</div>
          </div>
        </div>

        {/* Accuracy + Category Stats */}
        {stats && stats.totalQuestions > 0 && (
          <div className="bg-white/4 border border-white/6 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{lf(L.accuracy, locale)}</span>
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
              {stats.totalCorrect} / {stats.totalQuestions} {lf(L.correct, locale)}
            </div>

            {stats.categoryBreakdown.length > 0 && (
              <div className="pt-2 border-t border-white/6 space-y-1.5">
                <span className="text-xs font-semibold text-text-muted uppercase">
                  {lf(L.catsPlayed, locale)}
                </span>
                {stats.categoryBreakdown.slice(0, 5).map(c => (
                  <div key={c.category} className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">
                      {CATEGORY_LABELS[c.category as CategoryId]?.[locale as 'de' | 'en'] ?? c.category}
                    </span>
                    <span className="font-mono text-text-muted">{c.count}×</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Streak Calendar */}
        <StreakCalendar userId={profile.id} locale={locale} />

        {/* Share Stats Card */}
        <ShareStatsCard
          displayName={profile.display_name ?? 'Player'}
          totalXp={profile.total_xp ?? 0}
          level={profile.level ?? 1}
          longestStreak={profile.longest_streak ?? 0}
          quizCount={stats?.totalQuizzes ?? 0}
          accuracy={accuracy ?? 0}
          locale={locale}
        />

        {/* Company */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-4 space-y-2">
          <label className="text-sm font-semibold">
            {lf(L.company, locale)}
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
              placeholder={lf(L.enterCompany, locale)}
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
                ? (lf(L.saving, locale))
                : (lf(L.save, locale))}
            </button>
            {companySaved && (
              <span className="text-xs text-teal">✓ {lf(L.saved, locale)}</span>
            )}
          </div>
          <p className="text-[10px] text-text-muted">
            {lf(L.companyHint, locale)}
          </p>
        </div>

        {/* Badges */}
        <div>
          <h2 className="text-sm font-bold mb-3">🎖️ {t('profile.badgesEarned')}</h2>
          <BadgeGrid earnedBadges={earnedBadges} locale={locale} />
        </div>

        {/* Recent Activity */}
        {recentQuizzes.length > 0 && (
          <div>
            <h2 className="text-sm font-bold mb-3">
              {lf(L.recentActivity, locale)}
            </h2>
            <div className="space-y-2">
              {recentQuizzes.map((q, i) => {
                const typeEmoji = q.quiz_type === 'daily' ? '🧠' : q.quiz_type === 'freeplay' ? '🎮' : '⚔️'
                const typeLabel = q.quiz_type === 'daily' ? 'Daily' : q.quiz_type === 'freeplay' ? 'Free Play' : 'Challenge'
                const date = new Date(q.created_at).toLocaleDateString(DATE_LOCALES_P[locale], {
                  day: 'numeric', month: 'short',
                })
                return (
                  <div key={i} className="flex items-center gap-3 bg-white/4 border border-white/6 rounded-xl px-4 py-2">
                    <span className="text-lg">{typeEmoji}</span>
                    <div className="flex-1">
                      <span className="text-xs font-semibold">{typeLabel}</span>
                      <span className="text-[10px] text-text-muted ml-2">{date}</span>
                    </div>
                    <span className="font-mono text-sm font-bold text-primary">{q.total_score}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* SHIFT Mode Toggle */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-4">
          <span className="text-sm font-semibold">{lf(L.shiftStyle, locale)}</span>
          <p className="text-[10px] text-text-muted mt-0.5 mb-3">
            {lf(L.shiftBuddyDesc, locale)}
          </p>
          <div className="flex gap-2">
            {(['serious', 'cheeky'] as const).map(mode => {
              const isActive = shiftMode === mode
              return (
                <button
                  key={mode}
                  disabled={shiftSaving}
                  onClick={async () => {
                    if (shiftMode === mode || shiftSaving) return
                    setShiftSaving(true)
                    setShiftMode(mode) // optimistic UI update
                    const { data: { session } } = await supabase.auth.getSession()
                    if (session) {
                      const { error } = await supabase.from('profiles').update({ shift_mode: mode }).eq('id', session.user.id)
                      if (error) setShiftMode(profile?.shift_mode ?? 'cheeky') // revert on error
                    }
                    setShiftSaving(false)
                  }}
                  className="flex-1 py-2 px-3 rounded-xl border text-center transition-all duration-200 disabled:opacity-60"
                  style={{
                    borderColor: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)',
                    backgroundColor: isActive ? 'rgba(91,79,199,0.12)' : 'rgba(255,255,255,0.03)',
                  }}
                >
                  <span className="text-lg">{mode === 'serious' ? '🎩' : '😎'}</span>
                  <div className="text-xs font-semibold text-text-primary mt-1">
                    {lf(mode === 'serious' ? L.serious : L.cheeky, locale)}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Notifications */}
        {canNotify() && (
          <div className="bg-white/4 border border-white/6 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold">{lf(L.reminders, locale)}</span>
              <p className="text-[10px] text-text-muted mt-0.5">
                {lf(L.reminderDesc, locale)}
              </p>
            </div>
            <button
              disabled={reminderSaving}
              onClick={async () => {
                if (reminderSaving) return
                setReminderSaving(true)
                if (!reminderOn) {
                  const granted = notificationPermission() === 'granted' || await requestNotificationPermission()
                  if (granted) {
                    setReminderEnabled(true)
                    scheduleLocalReminder()
                    setReminderOn(true)
                  }
                  // Wenn Permission abgelehnt: Toggle bleibt auf "Aus"
                } else {
                  setReminderEnabled(false)
                  setReminderOn(false)
                }
                setReminderSaving(false)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-60 ${
                reminderOn
                  ? 'bg-primary text-white'
                  : 'bg-white/6 text-text-muted'
              }`}
            >
              {reminderOn ? lf(L.on, locale) : lf(L.off, locale)}
            </button>
          </div>
        )}

        {/* Language Toggle */}
        <div className="bg-white/4 border border-white/6 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm font-semibold">{lf(L.language, locale)}</span>
          <div className="flex gap-1.5">
            {(['de', 'en', 'tr', 'es'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${locale === l ? 'bg-primary text-white' : 'bg-white/6 text-text-muted'}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Password Change — only for email users */}
        {user?.app_metadata?.provider === 'email' && (
          <div className="bg-white/4 border border-white/6 rounded-xl p-4 space-y-3">
            <button
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="text-sm font-semibold w-full text-left flex items-center justify-between"
            >
              <span>{lf(L.changePw, locale)}</span>
              <span className="text-text-muted text-xs">{showPasswordChange ? '▲' : '▼'}</span>
            </button>

            {showPasswordChange && (
              <div className="space-y-2 pt-1">
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder={lf(L.newPw, locale)}
                  className="w-full bg-white/6 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && changePassword()}
                  placeholder={lf(L.confirmPw, locale)}
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
                    ? (lf(L.saving, locale))
                    : (lf(L.savePw, locale))}
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
              {lf(L.deleteAccount, locale)}
            </button>
          ) : (
            <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 space-y-3">
              <p className="text-sm text-danger font-semibold">
                {lf(L.reallyDelete, locale)}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={deleteAccount}
                  className="text-xs font-bold px-4 py-2 rounded-lg bg-danger text-white hover:bg-danger/80 transition-colors"
                >
                  {lf(L.yesDelete, locale)}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-white/6 text-text-secondary hover:text-text-primary transition-colors"
                >
                  {lf(L.cancel, locale)}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

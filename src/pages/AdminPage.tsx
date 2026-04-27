import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'
import { CATEGORIES, CATEGORY_LABELS, lf } from '../lib/constants'
import type { CategoryId } from '../lib/constants'

type AdminTab = 'dashboard' | 'questions' | 'users' | 'sponsors' | 'reset'

async function adminCall(action: string, body: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const { data, error } = await supabase.functions.invoke('admin', {
    body: { action, ...body },
    headers: session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : undefined,
  })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data
}

// ─── Dashboard Tab ───
function DashboardTab() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminCall('dashboard_stats').then(setStats).finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto my-8" />

  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: 'User', value: stats?.users, color: 'text-primary' },
        { label: 'Fragen (aktiv)', value: stats?.questions, color: 'text-teal' },
        { label: 'Quiz-Versuche', value: stats?.attempts, color: 'text-gold' },
        { label: 'Heute aktiv', value: stats?.active_today, color: 'text-fire' },
      ].map(s => (
        <div key={s.label} className="bg-white/4 border border-white/6 rounded-xl p-4 text-center">
          <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value ?? 0}</div>
          <div className="text-xs text-text-muted mt-1">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Questions Tab ───
function QuestionsTab() {
  const { locale } = useLocale()
  const [questions, setQuestions] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterLocale, setFilterLocale] = useState('')
  const [page, setPage] = useState(0)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await adminCall('list_questions', {
      search: search || undefined,
      category: filterCat || undefined,
      locale: filterLocale || undefined,
      offset: page * 20,
      limit: 20,
    })
    setQuestions(data.questions ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [search, filterCat, filterLocale, page])

  useEffect(() => { load() }, [load])

  const toggleActive = async (id: string, currentActive: boolean) => {
    await adminCall('toggle_question', { question_id: id, is_active: !currentActive })
    load()
  }

  const deleteQuestion = async (id: string) => {
    if (!confirm('Frage wirklich löschen?')) return
    await adminCall('delete_question', { question_id: id })
    load()
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder="Suchen..."
          className="bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[120px] focus:outline-none focus:border-primary"
        />
        <select
          value={filterCat}
          onChange={e => { setFilterCat(e.target.value); setPage(0) }}
          className="bg-white/6 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-text-primary"
        >
          <option value="">Alle Kat.</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{lf(CATEGORY_LABELS[c], locale)}</option>
          ))}
        </select>
        <select
          value={filterLocale}
          onChange={e => { setFilterLocale(e.target.value); setPage(0) }}
          className="bg-white/6 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-text-primary"
        >
          <option value="">DE+EN</option>
          <option value="de">DE</option>
          <option value="en">EN</option>
          <option value="tr">TR</option>
          <option value="es">ES</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">{total} Fragen</span>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
        >
          + Neue Frage
        </button>
      </div>

      {/* Create form */}
      {showCreate && <CreateQuestionForm onCreated={() => { setShowCreate(false); load() }} />}

      {/* List */}
      {loading ? (
        <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto my-4" />
      ) : (
        <div className="space-y-2">
          {questions.map(q => (
            <div key={q.id} className={`bg-white/4 border rounded-xl p-3 space-y-1 ${q.is_active ? 'border-white/6' : 'border-danger/20 opacity-60'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary leading-snug line-clamp-2">{q.scenario_text}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded">{q.category}</span>
                    <span className="text-[10px] bg-white/6 text-text-muted px-2 py-0.5 rounded">{q.locale?.toUpperCase()}</span>
                    <span className="text-[10px] text-text-muted">D{q.difficulty}</span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(q.id, q.is_active)}
                    className={`text-[10px] px-2 py-1 rounded ${q.is_active ? 'bg-teal/10 text-teal' : 'bg-danger/10 text-danger'}`}
                  >
                    {q.is_active ? 'aktiv' : 'inaktiv'}
                  </button>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="text-[10px] px-2 py-1 rounded bg-danger/10 text-danger hover:bg-danger/20"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-xs text-primary disabled:text-text-muted"
          >
            &larr; Zurück
          </button>
          <span className="text-xs text-text-muted">{page + 1} / {Math.ceil(total / 20)}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={(page + 1) * 20 >= total}
            className="text-xs text-primary disabled:text-text-muted"
          >
            Weiter &rarr;
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Create Question Form ───
function CreateQuestionForm({ onCreated }: { onCreated: () => void }) {
  const [locale, setLocale] = useState('de')
  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [scenarioText, setScenarioText] = useState('')
  const [mindsetTip, setMindsetTip] = useState('')
  const [difficulty, setDifficulty] = useState(2)
  const [options, setOptions] = useState([
    { text: '', score: 100, feedbackText: '' },
    { text: '', score: 0, feedbackText: '' },
    { text: '', score: -100, feedbackText: '' },
  ])
  const [saving, setSaving] = useState(false)
  const { locale: uiLocale } = useLocale()

  const updateOption = (i: number, field: string, value: string | number) => {
    setOptions(prev => prev.map((o, j) => j === i ? { ...o, [field]: value } : o))
  }

  const submit = async () => {
    if (!scenarioText.trim()) return
    setSaving(true)
    await adminCall('create_question', {
      locale, category, scenario_text: scenarioText.trim(),
      mindset_tip: mindsetTip.trim(), options, difficulty,
    })
    setSaving(false)
    onCreated()
  }

  return (
    <div className="bg-white/4 border border-primary/20 rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-bold">Neue Frage</h3>

      <div className="grid grid-cols-3 gap-2">
        <select value={locale} onChange={e => setLocale(e.target.value)} className="bg-white/6 border border-white/10 rounded-lg px-2 py-1.5 text-xs">
          <option value="de">DE</option>
          <option value="en">EN</option>
          <option value="tr">TR</option>
          <option value="es">ES</option>
        </select>
        <select value={category} onChange={e => setCategory(e.target.value as CategoryId)} className="bg-white/6 border border-white/10 rounded-lg px-2 py-1.5 text-xs">
          {CATEGORIES.map(c => <option key={c} value={c}>{lf(CATEGORY_LABELS[c], uiLocale)}</option>)}
        </select>
        <select value={difficulty} onChange={e => setDifficulty(Number(e.target.value))} className="bg-white/6 border border-white/10 rounded-lg px-2 py-1.5 text-xs">
          <option value={1}>Leicht</option>
          <option value={2}>Mittel</option>
          <option value={3}>Schwer</option>
        </select>
      </div>

      <textarea
        value={scenarioText}
        onChange={e => setScenarioText(e.target.value)}
        placeholder="Szenario-Text..."
        rows={3}
        className="w-full bg-white/6 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
      />

      <input
        type="text"
        value={mindsetTip}
        onChange={e => setMindsetTip(e.target.value)}
        placeholder="Mindset-Tipp..."
        className="w-full bg-white/6 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
      />

      {options.map((opt, i) => (
        <div key={i} className="bg-white/4 border border-white/6 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${opt.score === 100 ? 'text-teal' : opt.score === 0 ? 'text-gold' : 'text-danger'}`}>
              {opt.score > 0 ? '+' : ''}{opt.score}
            </span>
            <select
              value={opt.score}
              onChange={e => updateOption(i, 'score', Number(e.target.value))}
              className="bg-white/6 border border-white/10 rounded px-1 py-0.5 text-xs"
            >
              <option value={100}>+100 (richtig)</option>
              <option value={0}>0 (neutral)</option>
              <option value={-100}>-100 (gefährlich)</option>
            </select>
          </div>
          <input
            type="text"
            value={opt.text}
            onChange={e => updateOption(i, 'text', e.target.value)}
            placeholder={`Antwort ${i + 1}...`}
            className="w-full bg-white/6 border border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:border-primary"
          />
          <input
            type="text"
            value={opt.feedbackText}
            onChange={e => updateOption(i, 'feedbackText', e.target.value)}
            placeholder="Feedback-Text..."
            className="w-full bg-white/6 border border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:border-primary"
          />
        </div>
      ))}

      <button
        onClick={submit}
        disabled={saving || !scenarioText.trim()}
        className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
      >
        {saving ? 'Speichern...' : 'Frage erstellen'}
      </button>
    </div>
  )
}

// ─── Users Tab ───
function UsersTab() {
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await adminCall('list_users', {
      search: search || undefined,
      offset: page * 20,
      limit: 20,
    })
    setUsers(data.users ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [search, page])

  useEffect(() => { load() }, [load])

  const resetUser = async (u: any) => {
    if (!window.confirm(`${u.display_name || u.email} wirklich zurücksetzen? Alle Scores, Badges, XP werden gelöscht.`)) return
    setBusyId(u.id); setMsg(null)
    try {
      const r = await adminCall('reset_user', { user_id: u.id })
      setMsg(r.message ?? `${u.display_name} zurückgesetzt`)
      load()
    } catch (e: any) { setMsg(`Fehler: ${e.message}`) }
    setBusyId(null)
  }

  const deleteUser = async (u: any) => {
    if (!window.confirm(`${u.display_name || u.email} KOMPLETT LÖSCHEN? Account + alle Daten unwiderruflich!`)) return
    setBusyId(u.id); setMsg(null)
    try {
      const r = await adminCall('delete_user', { user_id: u.id })
      setMsg(r.message ?? `${u.display_name} gelöscht`)
      load()
    } catch (e: any) { setMsg(`Fehler: ${e.message}`) }
    setBusyId(null)
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(0) }}
        placeholder="User suchen (Name oder E-Mail)..."
        className="w-full bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
      />

      <span className="text-xs text-text-muted">{total} User</span>

      {msg && <div className="bg-white/4 border border-white/6 rounded-xl p-3 text-xs text-text-secondary">{msg}</div>}

      {loading ? (
        <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto my-4" />
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="bg-white/4 border border-white/6 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-teal flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {(u.display_name || u.email || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">
                  {u.display_name || 'Anonym'}
                  {u.is_admin && <span className="ml-1 text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded">Admin</span>}
                </div>
                {u.email && (
                  <div className="text-[10px] text-text-muted truncate font-mono">{u.email}</div>
                )}
                <div className="text-[10px] text-text-muted flex gap-3 flex-wrap">
                  <span>Lv {u.level}</span>
                  <span>{(u.total_xp ?? 0).toLocaleString()} XP</span>
                  <span>🔥 {u.current_streak ?? 0}</span>
                  {u.company_name && <span>🏢 {u.company_name}</span>}
                  <span>· {u.last_played_at ?? 'nie'}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <button
                  onClick={() => resetUser(u)}
                  disabled={busyId === u.id}
                  title="Scores/XP/Badges zurücksetzen"
                  className="text-[10px] px-2 py-1 rounded bg-gold/10 text-gold hover:bg-gold/20 disabled:opacity-50"
                >
                  ↺ Reset
                </button>
                <button
                  onClick={() => deleteUser(u)}
                  disabled={busyId === u.id}
                  title="User komplett löschen"
                  className="text-[10px] px-2 py-1 rounded bg-danger/10 text-danger hover:bg-danger/20 disabled:opacity-50"
                >
                  ✕ Löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 20 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="text-xs text-primary disabled:text-text-muted">&larr;</button>
          <span className="text-xs text-text-muted">{page + 1} / {Math.ceil(total / 20)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * 20 >= total} className="text-xs text-primary disabled:text-text-muted">&rarr;</button>
        </div>
      )}
    </div>
  )
}

// ─── Main Admin Page ───
// ─── Sponsors Tab ───
const I18N_LOCALES = ['de', 'en', 'tr', 'es'] as const
type I18nLocale = typeof I18N_LOCALES[number]
type I18nFields = Record<I18nLocale, string>
const emptyI18n = (): I18nFields => ({ de: '', en: '', tr: '', es: '' })
const stripEmpty = (i18n: I18nFields) =>
  Object.fromEntries(Object.entries(i18n).filter(([_, v]) => v.trim() !== ''))
const fromExisting = (i18n: Record<string, string> | null | undefined, fallback: string | null | undefined): I18nFields => ({
  de: i18n?.de ?? fallback ?? '',
  en: i18n?.en ?? '',
  tr: i18n?.tr ?? '',
  es: i18n?.es ?? '',
})

function SponsorsTab() {
  const [sponsors, setSponsors] = useState<any[]>([])
  const [prizes, setPrizes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showPrize, setShowPrize] = useState(false)
  const [editingSponsorId, setEditingSponsorId] = useState<string | null>(null)
  const [editingPrizeId, setEditingPrizeId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', logo_url: '', website_url: '', description_i18n: emptyI18n(), tier: 'standard' })
  const [prizeForm, setPrizeForm] = useState({ sponsor_id: '', title_i18n: emptyI18n(), description_i18n: emptyI18n(), prize_type: 'weekly', value_eur: '', week_start: '', month_start: '' })
  const [editSponsorI18n, setEditSponsorI18n] = useState<I18nFields>(emptyI18n())
  const [editPrizeI18n, setEditPrizeI18n] = useState<{ title: I18nFields; description: I18nFields }>({ title: emptyI18n(), description: emptyI18n() })

  const load = useCallback(async () => {
    setLoading(true)
    const [s, p] = await Promise.all([
      adminCall('list_sponsors'),
      adminCall('list_prizes'),
    ])
    setSponsors(s.sponsors ?? [])
    setPrizes(p.prizes ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const createSponsor = async () => {
    await adminCall('create_sponsor', {
      name: form.name,
      logo_url: form.logo_url,
      website_url: form.website_url,
      tier: form.tier,
      description_i18n: stripEmpty(form.description_i18n),
    })
    setForm({ name: '', logo_url: '', website_url: '', description_i18n: emptyI18n(), tier: 'standard' })
    setShowCreate(false)
    load()
  }

  const startEditSponsor = (s: any) => {
    setEditingSponsorId(s.id)
    setEditSponsorI18n(fromExisting(s.description_i18n, s.description))
  }

  const saveEditSponsor = async (sponsor_id: string) => {
    await adminCall('update_sponsor', {
      sponsor_id,
      updates: { description_i18n: stripEmpty(editSponsorI18n) },
    })
    setEditingSponsorId(null)
    load()
  }

  const createPrize = async () => {
    await adminCall('create_prize', {
      sponsor_id: prizeForm.sponsor_id,
      prize_type: prizeForm.prize_type,
      week_start: prizeForm.week_start,
      month_start: prizeForm.month_start,
      title_i18n: stripEmpty(prizeForm.title_i18n),
      description_i18n: stripEmpty(prizeForm.description_i18n),
      value_eur: prizeForm.value_eur ? Number(prizeForm.value_eur) : null,
    })
    setPrizeForm({ sponsor_id: '', title_i18n: emptyI18n(), description_i18n: emptyI18n(), prize_type: 'weekly', value_eur: '', week_start: '', month_start: '' })
    setShowPrize(false)
    load()
  }

  const startEditPrize = (p: any) => {
    setEditingPrizeId(p.id)
    setEditPrizeI18n({
      title: fromExisting(p.title_i18n, p.title),
      description: fromExisting(p.description_i18n, p.description),
    })
  }

  const saveEditPrize = async (prize_id: string) => {
    await adminCall('update_prize', {
      prize_id,
      updates: {
        title_i18n: stripEmpty(editPrizeI18n.title),
        description_i18n: stripEmpty(editPrizeI18n.description),
      },
    })
    setEditingPrizeId(null)
    load()
  }

  if (loading) return <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto my-8" />

  return (
    <div className="space-y-4">
      {/* Sponsors */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Sponsoren ({sponsors.length})</h3>
        <button onClick={() => setShowCreate(!showCreate)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/20 text-primary">
          + Sponsor
        </button>
      </div>

      {showCreate && (
        <div className="bg-white/4 border border-primary/20 rounded-xl p-4 space-y-2">
          <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Name..." className="w-full bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary" />
          <input value={form.logo_url} onChange={e => setForm(f => ({...f, logo_url: e.target.value}))} placeholder="Logo URL..." className="w-full bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary" />
          <input value={form.website_url} onChange={e => setForm(f => ({...f, website_url: e.target.value}))} placeholder="Website URL..." className="w-full bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary" />
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Beschreibung (pro Sprache)</p>
            {I18N_LOCALES.map(lang => (
              <div key={lang} className="flex items-start gap-2">
                <span className="w-7 pt-1.5 text-[10px] font-mono text-text-muted">{lang.toUpperCase()}</span>
                <textarea
                  value={form.description_i18n[lang]}
                  onChange={e => setForm(f => ({...f, description_i18n: {...f.description_i18n, [lang]: e.target.value}}))}
                  placeholder={`Beschreibung ${lang.toUpperCase()}...`}
                  rows={2}
                  className="flex-1 bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary resize-none"
                />
              </div>
            ))}
          </div>
          <select value={form.tier} onChange={e => setForm(f => ({...f, tier: e.target.value}))} className="bg-white/6 border border-white/10 rounded-lg px-2 py-1.5 text-xs">
            <option value="gold">Gold</option>
            <option value="silver">Silber</option>
            <option value="standard">Standard</option>
          </select>
          <button onClick={createSponsor} disabled={!form.name.trim()} className="w-full bg-primary text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-50">Sponsor erstellen</button>
        </div>
      )}

      {sponsors.map(s => (
        <div key={s.id} className={`bg-white/4 border rounded-xl ${s.is_active ? 'border-white/6' : 'border-danger/20 opacity-60'}`}>
          <div className="p-3 flex items-center gap-3">
            {s.logo_url ? <img src={s.logo_url} alt={s.name} className="w-8 h-8 object-contain rounded" /> : <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center text-xs font-bold text-primary">{s.name[0]}</div>}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{s.name}</div>
              <div className="text-[10px] text-text-muted">
                {s.tier} · {s.is_active ? 'aktiv' : 'inaktiv'}
                {' · i18n: '}
                {I18N_LOCALES.map(l => (s.description_i18n?.[l] ? l : null)).filter(Boolean).join(',') || '—'}
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => editingSponsorId === s.id ? setEditingSponsorId(null) : startEditSponsor(s)}
                className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary">
                {editingSponsorId === s.id ? '×' : 'i18n'}
              </button>
              <button onClick={async () => { await adminCall('update_sponsor', { sponsor_id: s.id, updates: { is_active: !s.is_active } }); load() }}
                className={`text-[10px] px-2 py-1 rounded ${s.is_active ? 'bg-teal/10 text-teal' : 'bg-danger/10 text-danger'}`}>
                {s.is_active ? 'aktiv' : 'inaktiv'}
              </button>
              <button onClick={async () => { if (confirm('Löschen?')) { await adminCall('delete_sponsor', { sponsor_id: s.id }); load() } }}
                className="text-[10px] px-2 py-1 rounded bg-danger/10 text-danger">✕</button>
            </div>
          </div>
          {editingSponsorId === s.id && (
            <div className="px-3 pb-3 pt-1 space-y-1 border-t border-white/6">
              <p className="text-[10px] uppercase tracking-wider text-text-muted pt-2">Beschreibung pro Sprache</p>
              {I18N_LOCALES.map(lang => (
                <div key={lang} className="flex items-start gap-2">
                  <span className="w-7 pt-1.5 text-[10px] font-mono text-text-muted">{lang.toUpperCase()}</span>
                  <textarea
                    value={editSponsorI18n[lang]}
                    onChange={e => setEditSponsorI18n(prev => ({...prev, [lang]: e.target.value}))}
                    rows={2}
                    className="flex-1 bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary resize-none"
                  />
                </div>
              ))}
              <button onClick={() => saveEditSponsor(s.id)} className="w-full bg-primary text-white font-semibold py-2 rounded-lg text-sm">Speichern</button>
            </div>
          )}
        </div>
      ))}

      {/* Prizes */}
      <div className="flex items-center justify-between pt-4 border-t border-white/6">
        <h3 className="text-sm font-bold">Preise ({prizes.length})</h3>
        <button onClick={() => setShowPrize(!showPrize)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gold/20 text-gold">
          + Preis
        </button>
      </div>

      {showPrize && (
        <div className="bg-white/4 border border-gold/20 rounded-xl p-4 space-y-2">
          <select value={prizeForm.sponsor_id} onChange={e => setPrizeForm(f => ({...f, sponsor_id: e.target.value}))} className="w-full bg-white/6 border border-white/10 rounded-lg px-2 py-1.5 text-xs">
            <option value="">Sponsor wählen...</option>
            {sponsors.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Titel pro Sprache</p>
            {I18N_LOCALES.map(lang => (
              <div key={lang} className="flex items-center gap-2">
                <span className="w-7 text-[10px] font-mono text-text-muted">{lang.toUpperCase()}</span>
                <input
                  value={prizeForm.title_i18n[lang]}
                  onChange={e => setPrizeForm(f => ({...f, title_i18n: {...f.title_i18n, [lang]: e.target.value}}))}
                  placeholder={`Titel ${lang.toUpperCase()}...`}
                  className="flex-1 bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Beschreibung pro Sprache</p>
            {I18N_LOCALES.map(lang => (
              <div key={lang} className="flex items-start gap-2">
                <span className="w-7 pt-1.5 text-[10px] font-mono text-text-muted">{lang.toUpperCase()}</span>
                <textarea
                  value={prizeForm.description_i18n[lang]}
                  onChange={e => setPrizeForm(f => ({...f, description_i18n: {...f.description_i18n, [lang]: e.target.value}}))}
                  placeholder={`Beschreibung ${lang.toUpperCase()}...`}
                  rows={2}
                  className="flex-1 bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary resize-none"
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={prizeForm.prize_type} onChange={e => setPrizeForm(f => ({...f, prize_type: e.target.value}))} className="bg-white/6 border border-white/10 rounded-lg px-2 py-1.5 text-xs">
              <option value="weekly">Wöchentlich</option>
              <option value="monthly">Monatlich</option>
              <option value="special">Special</option>
            </select>
            <input value={prizeForm.value_eur} onChange={e => setPrizeForm(f => ({...f, value_eur: e.target.value}))} placeholder="Wert €" type="number" className="bg-white/6 border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={prizeForm.week_start} onChange={e => setPrizeForm(f => ({...f, week_start: e.target.value}))} placeholder="KW-Start (YYYY-MM-DD)" type="date" className="bg-white/6 border border-white/10 rounded-lg px-2 py-1.5 text-xs" />
            <input value={prizeForm.month_start} onChange={e => setPrizeForm(f => ({...f, month_start: e.target.value}))} placeholder="Monat (YYYY-MM-DD)" type="date" className="bg-white/6 border border-white/10 rounded-lg px-2 py-1.5 text-xs" />
          </div>
          <button onClick={createPrize} disabled={!prizeForm.title_i18n.de.trim() && !prizeForm.title_i18n.en.trim()} className="w-full bg-gold/20 text-gold font-semibold py-2 rounded-lg text-sm disabled:opacity-50">Preis erstellen</button>
        </div>
      )}

      {prizes.map(p => (
        <div key={p.id} className="bg-white/4 border border-white/6 rounded-xl">
          <div className="p-3 flex items-center gap-3">
            <span className="text-xl">{p.prize_type === 'weekly' ? '🏆' : p.prize_type === 'monthly' ? '🎁' : '⭐'}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{p.title_i18n?.de ?? p.title_i18n?.en ?? p.title ?? '—'}</div>
              <div className="text-[10px] text-text-muted">
                {p.prize_type} · {p.sponsors?.name ?? 'kein Sponsor'}
                {p.value_eur && ` · ${p.value_eur}€`}
                {p.winner_id && ` · Gewinner: ${p.profiles?.display_name ?? '?'}`}
                {' · i18n: '}
                {I18N_LOCALES.map(l => (p.title_i18n?.[l] ? l : null)).filter(Boolean).join(',') || '—'}
              </div>
            </div>
            <button onClick={() => editingPrizeId === p.id ? setEditingPrizeId(null) : startEditPrize(p)}
              className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary">
              {editingPrizeId === p.id ? '×' : 'i18n'}
            </button>
            <button onClick={async () => { if (confirm('Löschen?')) { await adminCall('delete_prize', { prize_id: p.id }); load() } }}
              className="text-[10px] px-2 py-1 rounded bg-danger/10 text-danger">✕</button>
          </div>
          {editingPrizeId === p.id && (
            <div className="px-3 pb-3 pt-1 space-y-2 border-t border-white/6">
              <p className="text-[10px] uppercase tracking-wider text-text-muted pt-2">Titel pro Sprache</p>
              {I18N_LOCALES.map(lang => (
                <div key={lang} className="flex items-center gap-2">
                  <span className="w-7 text-[10px] font-mono text-text-muted">{lang.toUpperCase()}</span>
                  <input
                    value={editPrizeI18n.title[lang]}
                    onChange={e => setEditPrizeI18n(prev => ({...prev, title: {...prev.title, [lang]: e.target.value}}))}
                    className="flex-1 bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              ))}
              <p className="text-[10px] uppercase tracking-wider text-text-muted">Beschreibung pro Sprache</p>
              {I18N_LOCALES.map(lang => (
                <div key={lang} className="flex items-start gap-2">
                  <span className="w-7 pt-1.5 text-[10px] font-mono text-text-muted">{lang.toUpperCase()}</span>
                  <textarea
                    value={editPrizeI18n.description[lang]}
                    onChange={e => setEditPrizeI18n(prev => ({...prev, description: {...prev.description, [lang]: e.target.value}}))}
                    rows={2}
                    className="flex-1 bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary resize-none"
                  />
                </div>
              ))}
              <button onClick={() => saveEditPrize(p.id)} className="w-full bg-primary text-white font-semibold py-2 rounded-lg text-sm">Speichern</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Reset Tab ───
function ResetTab() {
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const doReset = async (action: string, confirm: string) => {
    if (!window.confirm(confirm)) return
    setLoading(true); setMsg(null)
    try {
      const data = await adminCall(action)
      setMsg(data.message ?? 'Erledigt')
    } catch (e: any) { setMsg(`Fehler: ${e.message}`) }
    setLoading(false)
  }

  const doResetUser = async () => {
    const email = prompt('User-E-Mail zum Zurücksetzen:')
    if (!email) return
    // Find user by listing
    setLoading(true); setMsg(null)
    try {
      const data = await adminCall('list_users', { search: email, limit: 1 })
      const user = data.users?.[0]
      if (!user) { setMsg('User nicht gefunden'); setLoading(false); return }
      if (!window.confirm(`${user.display_name} (${email}) wirklich zurücksetzen? Alle Scores, Badges, XP werden gelöscht.`)) {
        setLoading(false); return
      }
      const result = await adminCall('reset_user', { user_id: user.id })
      setMsg(result.message ?? 'User zurückgesetzt')
    } catch (e: any) { setMsg(`Fehler: ${e.message}`) }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 space-y-2">
        <h3 className="text-sm font-bold text-danger">Probephase — Reset-Funktionen</h3>
        <p className="text-xs text-text-secondary">Diese Funktionen löschen Spieldaten unwiderruflich. Nur für die Testphase gedacht.</p>
      </div>

      {msg && (
        <div className="bg-white/4 border border-white/6 rounded-xl p-3 text-sm text-text-secondary">{msg}</div>
      )}

      <div className="space-y-2">
        <button onClick={doResetUser} disabled={loading}
          className="w-full text-left bg-white/4 border border-white/6 rounded-xl p-4 hover:border-primary/30 transition-colors disabled:opacity-50">
          <div className="font-semibold text-sm">Einzelnen User zurücksetzen</div>
          <div className="text-xs text-text-muted">XP, Level, Streak, Badges, Versuche auf 0 — User-Account bleibt</div>
        </button>

        <button onClick={() => doReset('reset_all_scores', 'ALLE Scores, Badges, XP für ALLE User zurücksetzen? Das betrifft jeden Spieler!')} disabled={loading}
          className="w-full text-left bg-white/4 border border-danger/10 rounded-xl p-4 hover:border-danger/30 transition-colors disabled:opacity-50">
          <div className="font-semibold text-sm text-danger">Alle Scores zurücksetzen</div>
          <div className="text-xs text-text-muted">Alle Versuche, Badges, XP, Streaks für alle User löschen — Neustart</div>
        </button>

        <button onClick={() => doReset('reset_daily_quizzes', 'Alle Daily Quizzes löschen? Der Cron-Job erstellt sie automatisch neu.')} disabled={loading}
          className="w-full text-left bg-white/4 border border-white/6 rounded-xl p-4 hover:border-gold/30 transition-colors disabled:opacity-50">
          <div className="font-semibold text-sm">Daily Quizzes neu generieren</div>
          <div className="text-xs text-text-muted">Alle Daily-Quiz-Einträge löschen — Cron erstellt neue</div>
        </button>

        <button onClick={async () => {
          const email = prompt('User-E-Mail zum LÖSCHEN (unwiderruflich):')
          if (!email) return
          setLoading(true); setMsg(null)
          try {
            const data = await adminCall('list_users', { search: email, limit: 1 })
            const user = data.users?.[0]
            if (!user) { setMsg('User nicht gefunden'); setLoading(false); return }
            if (!window.confirm(`${user.display_name} KOMPLETT LÖSCHEN? Account + alle Daten!`)) { setLoading(false); return }
            const result = await adminCall('delete_user', { user_id: user.id })
            setMsg(result.message ?? 'User gelöscht')
          } catch (e: any) { setMsg(`Fehler: ${e.message}`) }
          setLoading(false)
        }} disabled={loading}
          className="w-full text-left bg-white/4 border border-danger/20 rounded-xl p-4 hover:border-danger/40 transition-colors disabled:opacity-50">
          <div className="font-semibold text-sm text-danger">User komplett löschen</div>
          <div className="text-xs text-text-muted">Account, Profil und alle Spieldaten unwiderruflich löschen</div>
        </button>
      </div>
    </div>
  )
}

const TABS: { key: AdminTab; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'questions', label: 'Fragen' },
  { key: 'users', label: 'User' },
  { key: 'sponsors', label: 'Sponsoren' },
  { key: 'reset', label: 'Reset' },
]

export function AdminPage() {
  const navigate = useNavigate()
  const { profile, loading } = useAuth()
  const [tab, setTab] = useState<AdminTab>('dashboard')

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-4">
        <p className="text-danger">Kein Admin-Zugang.</p>
        <button onClick={() => navigate('/app')} className="text-primary text-sm hover:underline">&larr; Zurück</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans flex flex-col">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-white/6">
        <button onClick={() => navigate('/app')} className="text-text-secondary hover:text-text-primary text-lg">&larr;</button>
        <h1 className="text-lg font-bold text-primary">Admin</h1>
      </header>

      {/* Tabs */}
      <div className="px-5 pt-4">
        <div className="flex gap-1 bg-white/4 rounded-xl p-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 text-center py-2 rounded-lg text-xs font-semibold transition-colors
                ${tab === t.key ? 'bg-primary text-white' : 'text-text-muted hover:text-text-secondary'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 px-5 py-4 max-w-lg mx-auto w-full">
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'questions' && <QuestionsTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'sponsors' && <SponsorsTab />}
        {tab === 'reset' && <ResetTab />}
      </main>
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'
import { CATEGORIES, CATEGORY_LABELS } from '../lib/constants'
import type { CategoryId } from '../lib/constants'

type AdminTab = 'dashboard' | 'questions' | 'users' | 'daily'

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
            <option key={c} value={c}>{CATEGORY_LABELS[c][locale]}</option>
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
        </select>
        <select value={category} onChange={e => setCategory(e.target.value as CategoryId)} className="bg-white/6 border border-white/10 rounded-lg px-2 py-1.5 text-xs">
          {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c][uiLocale]}</option>)}
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

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(0) }}
        placeholder="User suchen..."
        className="w-full bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
      />

      <span className="text-xs text-text-muted">{total} User</span>

      {loading ? (
        <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto my-4" />
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="bg-white/4 border border-white/6 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-teal flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {(u.display_name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">
                  {u.display_name || 'Anonym'}
                  {u.is_admin && <span className="ml-1 text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded">Admin</span>}
                </div>
                <div className="text-[10px] text-text-muted flex gap-3">
                  <span>Lv {u.level}</span>
                  <span>{(u.total_xp ?? 0).toLocaleString()} XP</span>
                  <span>🔥 {u.current_streak ?? 0}</span>
                  {u.company_name && <span>🏢 {u.company_name}</span>}
                </div>
              </div>
              <div className="text-[10px] text-text-muted text-right">
                {u.last_played_at ?? 'nie'}
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
const TABS: { key: AdminTab; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'questions', label: 'Fragen' },
  { key: 'users', label: 'User' },
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
      </main>
    </div>
  )
}

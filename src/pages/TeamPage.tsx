import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useLocale } from '../hooks/useLocale'
import { LEVELS } from '../lib/constants'

interface TeamMember {
  id: string
  display_name: string
  level: number
  total_xp: number
  current_streak: number
}

interface TeamInfo {
  id: string
  name: string
  invite_code: string
  is_captain: boolean
  members: TeamMember[]
  member_count: number
}

interface TeamRanking {
  rank: number
  team_name: string
  team_id: string
  member_count: number
  total_score: number
}

async function teamCall(action: string, body: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const { data, error } = await supabase.functions.invoke('teams', {
    body: { action, ...body },
    headers: session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : undefined,
  })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data
}

export function TeamPage() {
  const { locale } = useLocale()
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState<TeamInfo | null>(null)
  const [rankings, setRankings] = useState<TeamRanking[]>([])
  const [tab, setTab] = useState<'team' | 'ranking'>('team')
  const [error, setError] = useState<string | null>(null)

  // Create/Join state
  const [createName, setCreateName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const loadTeam = useCallback(async () => {
    setLoading(true)
    try {
      const data = await teamCall('my_team')
      setTeam(data.team)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    }
    setLoading(false)
  }, [])

  const loadRankings = useCallback(async () => {
    try {
      const data = await teamCall('leaderboard')
      setRankings(data.entries ?? [])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    loadTeam()
    loadRankings()
  }, [loadTeam, loadRankings])

  const createTeam = async () => {
    if (!createName.trim()) return
    setActionLoading(true)
    setError(null)
    try {
      await teamCall('create', { name: createName.trim() })
      await loadTeam()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    }
    setActionLoading(false)
  }

  const joinTeam = async () => {
    if (!joinCode.trim()) return
    setActionLoading(true)
    setError(null)
    try {
      await teamCall('join', { invite_code: joinCode.trim() })
      await loadTeam()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    }
    setActionLoading(false)
  }

  const leaveTeam = async () => {
    if (!confirm(locale === 'de' ? 'Team wirklich verlassen?' : 'Really leave team?')) return
    setActionLoading(true)
    try {
      await teamCall('leave')
      setTeam(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    }
    setActionLoading(false)
  }

  const copyCode = () => {
    if (!team) return
    navigator.clipboard.writeText(team.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getLevelEmoji = (level: number) => LEVELS.find(l => l.level === level)?.emoji ?? '🌱'

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans flex flex-col">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-white/6">
        <Link to="/app" className="text-text-muted hover:text-text-primary text-lg">&larr;</Link>
        <span className="text-lg font-bold tracking-tight text-primary">
          {locale === 'de' ? 'Team Battles' : 'Team Battles'}
        </span>
      </header>

      {/* Tabs */}
      <div className="px-5 pt-4">
        <div className="flex gap-1 bg-white/4 rounded-xl p-1">
          {[
            { key: 'team' as const, label: locale === 'de' ? 'Mein Team' : 'My Team' },
            { key: 'ranking' as const, label: 'Ranking' },
          ].map(t => (
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

      <main className="flex-1 px-5 py-4 max-w-md mx-auto w-full">
        {error && (
          <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 mb-4 text-sm text-danger">
            {error}
          </div>
        )}

        {tab === 'team' && (
          team ? (
            // Team view
            <div className="space-y-4">
              <div className="bg-white/4 border border-white/6 rounded-2xl p-5 text-center space-y-2">
                <div className="text-3xl">⚔️</div>
                <h2 className="text-xl font-bold">{team.name}</h2>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-text-muted">Code:</span>
                  <span className="font-mono text-primary font-bold">{team.invite_code}</span>
                  <button
                    onClick={copyCode}
                    className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary"
                  >
                    {copied ? '✓' : (locale === 'de' ? 'Kopieren' : 'Copy')}
                  </button>
                </div>
                <p className="text-xs text-text-muted">
                  {team.member_count} {locale === 'de' ? 'Mitglieder' : 'members'}
                </p>
              </div>

              {/* Members */}
              <div className="bg-white/4 border border-white/6 rounded-2xl divide-y divide-white/6">
                {team.members.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-5 text-center font-mono text-xs text-text-muted">{i + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-teal flex items-center justify-center text-white text-xs font-bold">
                      {(m.display_name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{m.display_name || 'Anonym'}</div>
                      <div className="text-[10px] text-text-muted">
                        {getLevelEmoji(m.level)} Lv {m.level} · {(m.total_xp ?? 0).toLocaleString()} XP
                        {m.current_streak > 0 && ` · 🔥${m.current_streak}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={leaveTeam}
                disabled={actionLoading}
                className="w-full py-2 rounded-xl border border-danger/20 text-danger text-xs font-semibold hover:bg-danger/10 transition-colors"
              >
                {locale === 'de' ? 'Team verlassen' : 'Leave team'}
              </button>
            </div>
          ) : (
            // No team — create or join
            <div className="space-y-6 pt-4">
              <div className="text-center space-y-2">
                <div className="text-5xl">⚔️</div>
                <h2 className="text-lg font-bold">
                  {locale === 'de' ? 'Noch kein Team' : 'No team yet'}
                </h2>
                <p className="text-sm text-text-secondary">
                  {locale === 'de'
                    ? 'Erstelle ein Team oder tritt einem bei. Team-Score = Summe aller Daily-Punkte.'
                    : 'Create a team or join one. Team score = sum of all daily points.'}
                </p>
              </div>

              {/* Create */}
              <div className="bg-white/4 border border-white/6 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold">{locale === 'de' ? 'Team erstellen' : 'Create team'}</h3>
                <input
                  type="text"
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createTeam()}
                  placeholder={locale === 'de' ? 'Teamname...' : 'Team name...'}
                  className="w-full bg-white/6 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
                <button
                  onClick={createTeam}
                  disabled={actionLoading || !createName.trim()}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {actionLoading ? '...' : (locale === 'de' ? 'Team erstellen' : 'Create team')}
                </button>
              </div>

              {/* Join */}
              <div className="bg-white/4 border border-white/6 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold">{locale === 'de' ? 'Team beitreten' : 'Join team'}</h3>
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && joinTeam()}
                  placeholder={locale === 'de' ? 'Invite-Code...' : 'Invite code...'}
                  className="w-full bg-white/6 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary"
                />
                <button
                  onClick={joinTeam}
                  disabled={actionLoading || !joinCode.trim()}
                  className="w-full border border-primary text-primary font-semibold py-2 rounded-lg text-sm hover:bg-primary/10 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? '...' : (locale === 'de' ? 'Beitreten' : 'Join')}
                </button>
              </div>
            </div>
          )
        )}

        {tab === 'ranking' && (
          <div className="space-y-3 pt-2">
            {rankings.length === 0 ? (
              <p className="text-text-muted text-center py-8 text-sm">
                {locale === 'de'
                  ? 'Noch keine Teams mit Scores diese Woche.'
                  : 'No teams with scores this week yet.'}
              </p>
            ) : (
              <div className="bg-white/4 border border-white/6 rounded-2xl divide-y divide-white/6">
                {rankings.map(r => {
                  const medals = ['', '🥇', '🥈', '🥉']
                  return (
                    <div key={r.team_id} className="flex items-center gap-3 px-4 py-3">
                      <span className="w-6 text-center font-mono font-bold text-sm text-text-muted">
                        {r.rank <= 3 ? medals[r.rank] : r.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{r.team_name}</div>
                        <div className="text-[10px] text-text-muted">
                          {r.member_count} {locale === 'de' ? 'Spieler' : 'players'}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-semibold text-sm text-primary">{r.total_score.toLocaleString()}</span>
                        <div className="text-[10px] text-text-muted">Pts</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

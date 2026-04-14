import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useLocale } from '../hooks/useLocale'
import { useAuth } from '../hooks/useAuth'
import { LEVELS } from '../lib/constants'

interface TeamMember {
  id: string
  display_name: string
  level: number
  total_xp: number
  current_streak: number
  team_role: 'captain' | 'admin' | 'member'
}

interface TeamInfo {
  id: string
  name: string
  invite_code: string | null
  captain_id: string
  my_role: 'captain' | 'admin' | 'member'
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

const ROLE_LABELS = {
  captain: { de: 'Captain', en: 'Captain', color: 'text-gold' },
  admin: { de: 'Admin', en: 'Admin', color: 'text-primary' },
  member: { de: 'Mitglied', en: 'Member', color: 'text-text-muted' },
} as const

export function TeamPage() {
  const { locale } = useLocale()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState<TeamInfo | null>(null)
  const [rankings, setRankings] = useState<TeamRanking[]>([])
  const [tab, setTab] = useState<'team' | 'ranking'>('team')
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => { loadTeam(); loadRankings() }, [loadTeam, loadRankings])

  const createTeam = async () => {
    if (!createName.trim()) return
    setActionLoading(true); setError(null)
    try { await teamCall('create', { name: createName.trim() }); await loadTeam() }
    catch (err) { setError(err instanceof Error ? err.message : 'Error') }
    setActionLoading(false)
  }

  const joinTeam = async () => {
    if (!joinCode.trim()) return
    setActionLoading(true); setError(null)
    try { await teamCall('join', { invite_code: joinCode.trim() }); await loadTeam() }
    catch (err) { setError(err instanceof Error ? err.message : 'Error') }
    setActionLoading(false)
  }

  const leaveTeam = async () => {
    if (!confirm(locale === 'de' ? 'Team wirklich verlassen?' : 'Really leave team?')) return
    setActionLoading(true)
    try { await teamCall('leave'); setTeam(null) }
    catch (err) { setError(err instanceof Error ? err.message : 'Error') }
    setActionLoading(false)
  }

  const promoteMember = async (targetId: string) => {
    setActionLoading(true); setError(null)
    try { await teamCall('promote', { target_user_id: targetId }); await loadTeam() }
    catch (err) { setError(err instanceof Error ? err.message : 'Error') }
    setActionLoading(false)
  }

  const demoteMember = async (targetId: string) => {
    setActionLoading(true); setError(null)
    try { await teamCall('demote', { target_user_id: targetId }); await loadTeam() }
    catch (err) { setError(err instanceof Error ? err.message : 'Error') }
    setActionLoading(false)
  }

  const kickMember = async (targetId: string) => {
    if (!confirm(locale === 'de' ? 'Wirklich entfernen?' : 'Really remove?')) return
    setActionLoading(true); setError(null)
    try { await teamCall('kick', { target_user_id: targetId }); await loadTeam() }
    catch (err) { setError(err instanceof Error ? err.message : 'Error') }
    setActionLoading(false)
  }

  const copyCode = () => {
    if (!team?.invite_code) return
    navigator.clipboard.writeText(team.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getLevelEmoji = (level: number) => LEVELS.find(l => l.level === level)?.emoji ?? '🌱'
  const canManage = team?.my_role === 'captain' || team?.my_role === 'admin'

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
        <span className="text-lg font-bold tracking-tight text-primary">Team Battles</span>
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
            <button onClick={() => setError(null)} className="ml-2 text-xs opacity-60">✕</button>
          </div>
        )}

        {tab === 'team' && (
          team ? (
            <div className="space-y-4">
              {/* Team header */}
              <div className="bg-white/4 border border-white/6 rounded-2xl p-5 text-center space-y-2">
                <div className="text-3xl">⚔️</div>
                <h2 className="text-xl font-bold">{team.name}</h2>

                {/* Invite code — only captain + admin */}
                {team.invite_code ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs text-text-muted">Invite-Code:</span>
                    <span className="font-mono text-primary font-bold">{team.invite_code}</span>
                    <button onClick={copyCode} className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary">
                      {copied ? '✓' : (locale === 'de' ? 'Kopieren' : 'Copy')}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-text-muted italic">
                    {locale === 'de'
                      ? 'Invite-Code ist nur für Captain & Admins sichtbar.'
                      : 'Invite code is only visible to Captain & Admins.'}
                  </p>
                )}

                <div className="flex items-center justify-center gap-3 text-xs text-text-muted">
                  <span>{team.member_count} {locale === 'de' ? 'Mitglieder' : 'members'}</span>
                  <span>·</span>
                  <span className={ROLE_LABELS[team.my_role].color}>
                    {ROLE_LABELS[team.my_role][locale]}
                  </span>
                </div>
              </div>

              {/* Members */}
              <div className="bg-white/4 border border-white/6 rounded-2xl divide-y divide-white/6">
                {team.members.map((m, i) => {
                  const role = m.team_role ?? 'member'
                  const isMe = m.id === user?.id
                  const isCaptain = role === 'captain'

                  return (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="w-5 text-center font-mono text-xs text-text-muted">{i + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-teal flex items-center justify-center text-white text-xs font-bold">
                        {(m.display_name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate flex items-center gap-1.5">
                          {m.display_name || 'Anonym'}
                          {isMe && <span className="text-[10px] text-primary">(du)</span>}
                          <span className={`text-[10px] ${ROLE_LABELS[role].color}`}>
                            {role !== 'member' && ROLE_LABELS[role][locale]}
                          </span>
                        </div>
                        <div className="text-[10px] text-text-muted">
                          {getLevelEmoji(m.level)} Lv {m.level} · {(m.total_xp ?? 0).toLocaleString()} XP
                          {m.current_streak > 0 && ` · 🔥${m.current_streak}`}
                        </div>
                      </div>

                      {/* Actions — Captain/Admin can manage others */}
                      {canManage && !isMe && !isCaptain && (
                        <div className="flex gap-1">
                          {role === 'member' && (
                            <button
                              onClick={() => promoteMember(m.id)}
                              disabled={actionLoading}
                              title={locale === 'de' ? 'Zum Admin machen' : 'Make admin'}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20"
                            >
                              ↑
                            </button>
                          )}
                          {role === 'admin' && team.my_role === 'captain' && (
                            <button
                              onClick={() => demoteMember(m.id)}
                              disabled={actionLoading}
                              title={locale === 'de' ? 'Admin entfernen' : 'Remove admin'}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-gold/10 text-gold hover:bg-gold/20"
                            >
                              ↓
                            </button>
                          )}
                          <button
                            onClick={() => kickMember(m.id)}
                            disabled={actionLoading}
                            title={locale === 'de' ? 'Entfernen' : 'Remove'}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-danger/10 text-danger hover:bg-danger/20"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Role legend */}
              <div className="text-[10px] text-text-muted space-y-0.5 px-1">
                <p>👑 <span className="text-gold">Captain</span> — {locale === 'de' ? 'Kann alles: einladen, Admin ernennen/entfernen, kicken' : 'Can do everything: invite, promote/demote, kick'}</p>
                <p>🛡️ <span className="text-primary">Admin</span> — {locale === 'de' ? 'Kann einladen und Mitglieder kicken' : 'Can invite and kick members'}</p>
                <p>👤 Mitglied — {locale === 'de' ? 'Kann spielen und Ranking sehen' : 'Can play and see rankings'}</p>
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
            // No team
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

              <div className="bg-white/4 border border-white/6 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold">{locale === 'de' ? 'Team beitreten' : 'Join team'}</h3>
                <p className="text-xs text-text-muted">
                  {locale === 'de'
                    ? 'Du brauchst einen Invite-Code von einem Captain oder Admin.'
                    : 'You need an invite code from a Captain or Admin.'}
                </p>
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && joinTeam()}
                  placeholder="Invite-Code..."
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

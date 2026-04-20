import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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

interface TeamStats {
  member_count: number
  total_xp: number
  avg_xp: number
  avg_level: number
  longest_streak: number
  week_score: number
  week_quizzes: number
}

interface TeamChallenge {
  id: string
  challenger_team_id: string
  challenged_team_id: string
  challenger: { name: string }
  challenged: { name: string }
  week_start: string
  status: string
  challenger_score: number
  challenged_score: number
  winner_team_id: string | null
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
  const [searchParams, setSearchParams] = useSearchParams()
  const { locale } = useLocale()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState<TeamInfo | null>(null)
  const [rankings, setRankings] = useState<TeamRanking[]>([])
  const [tab, setTab] = useState<'team' | 'battles' | 'ranking'>('team')
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null)
  const [challenges, setChallenges] = useState<TeamChallenge[]>([])
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

  const loadStats = useCallback(async () => {
    try {
      const data = await teamCall('stats')
      setTeamStats(data.stats ?? null)
    } catch { /* ignore */ }
  }, [])

  const loadChallenges = useCallback(async () => {
    try {
      const data = await teamCall('my_challenges')
      setChallenges(data.challenges ?? [])
    } catch { /* ignore */ }
  }, [])

  const challengeTeam = async (targetTeamId: string) => {
    setActionLoading(true); setError(null)
    try {
      await teamCall('challenge_team', { target_team_id: targetTeamId })
      await loadChallenges()
    } catch (err) { setError(err instanceof Error ? err.message : 'Error') }
    setActionLoading(false)
  }

  // Auto-join if invite code in URL
  const codeFromUrl = searchParams.get('code')

  useEffect(() => {
    loadTeam().then(() => {
      if (codeFromUrl) {
        setJoinCode(codeFromUrl)
        // Clear URL param
        setSearchParams({}, { replace: true })
      }
    })
    loadRankings()
    loadStats()
    loadChallenges()
  }, [loadTeam, loadRankings, loadStats, loadChallenges, codeFromUrl, setSearchParams])

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

  const inviteUrl = team?.invite_code
    ? `${window.location.origin}/mindset-shift/app/team?code=${team.invite_code}`
    : null

  const inviteText = (name: string) => locale === 'de'
    ? `Tritt meinem Team "${name}" bei AI-Shift Happens bei! 🧠⚔️`
    : `Join my team "${name}" on AI-Shift Happens! 🧠⚔️`

  const copyCode = () => {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareNative = async () => {
    if (!inviteUrl || !team) return
    try {
      await navigator.share({
        title: `Team ${team.name} — AI-Shift Happens`,
        text: inviteText(team.name),
        url: inviteUrl,
      })
    } catch { /* user cancelled */ }
  }

  const shareWhatsApp = () => {
    if (!inviteUrl || !team) return
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteText(team.name) + '\n' + inviteUrl)}`, '_blank')
  }

  const shareTelegram = () => {
    if (!inviteUrl || !team) return
    window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(inviteText(team.name))}`, '_blank')
  }

  const shareEmail = () => {
    if (!inviteUrl || !team) return
    const subject = encodeURIComponent(`Team ${team.name} — AI-Shift Happens`)
    const body = encodeURIComponent(`${inviteText(team.name)}\n\n${inviteUrl}`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const shareLinkedIn = () => {
    if (!inviteUrl) return
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(inviteUrl)}`, '_blank', 'width=600,height=400')
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
            { key: 'battles' as const, label: 'Battles' },
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

                {/* Invite — only captain + admin */}
                {team.invite_code ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs text-text-muted">Code:</span>
                      <span className="font-mono text-primary font-bold">{team.invite_code}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {'share' in navigator && (
                        <button onClick={shareNative} className="text-[10px] px-2.5 py-1 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
                          📤 {locale === 'de' ? 'Teilen' : 'Share'}
                        </button>
                      )}
                      <button onClick={shareWhatsApp} className="text-[10px] px-2.5 py-1 rounded-lg bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25 transition-colors">
                        WhatsApp
                      </button>
                      <button onClick={shareTelegram} className="text-[10px] px-2.5 py-1 rounded-lg bg-[#0088cc]/15 text-[#0088cc] hover:bg-[#0088cc]/25 transition-colors">
                        Telegram
                      </button>
                      <button onClick={shareLinkedIn} className="text-[10px] px-2.5 py-1 rounded-lg bg-[#0A66C2]/15 text-[#0A66C2] hover:bg-[#0A66C2]/25 transition-colors">
                        LinkedIn
                      </button>
                      <button onClick={shareEmail} className="text-[10px] px-2.5 py-1 rounded-lg bg-white/6 text-text-secondary hover:bg-white/10 transition-colors">
                        ✉️ E-Mail
                      </button>
                      <button onClick={copyCode} className="text-[10px] px-2.5 py-1 rounded-lg bg-white/6 text-text-secondary hover:bg-white/10 transition-colors">
                        {copied ? '✓' : '🔗 Link'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-text-muted italic">
                    {locale === 'de'
                      ? 'Einladung nur durch Captain & Admins möglich.'
                      : 'Only Captain & Admins can invite.'}
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

              {/* Team Stats */}
              {teamStats && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: teamStats.week_score.toLocaleString(), label: locale === 'de' ? 'Wochen-Score' : 'Week Score', color: 'text-primary' },
                    { val: teamStats.week_quizzes, label: locale === 'de' ? 'Quizzes diese Woche' : 'Quizzes this week', color: 'text-teal' },
                    { val: teamStats.avg_level, label: locale === 'de' ? 'Avg. Level' : 'Avg. Level', color: 'text-gold' },
                    { val: `🔥${teamStats.longest_streak}`, label: locale === 'de' ? 'Bester Streak' : 'Best Streak', color: 'text-fire' },
                  ].map(s => (
                    <div key={s.label} className="bg-white/4 border border-white/6 rounded-xl p-3 text-center">
                      <div className={`text-lg font-bold font-mono ${s.color}`}>{s.val}</div>
                      <div className="text-[10px] text-text-muted">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

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

        {tab === 'battles' && (
          <div className="space-y-4 pt-2">
            {!team ? (
              <p className="text-text-muted text-center py-8 text-sm">
                {locale === 'de' ? 'Tritt einem Team bei um Battles zu starten.' : 'Join a team to start battles.'}
              </p>
            ) : (
              <>
                {/* Active challenges */}
                <h3 className="text-sm font-bold">{locale === 'de' ? 'Aktive Battles' : 'Active Battles'}</h3>
                {challenges.length === 0 ? (
                  <p className="text-text-muted text-sm">
                    {locale === 'de' ? 'Noch keine Battles. Fordere ein Team im Ranking heraus!' : 'No battles yet. Challenge a team from the ranking!'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {challenges.map(ch => {
                      const isChallenger = ch.challenger_team_id === team.id
                      const myScore = isChallenger ? ch.challenger_score : ch.challenged_score
                      const theirScore = isChallenger ? ch.challenged_score : ch.challenger_score
                      const opponentName = isChallenger ? ch.challenged?.name : ch.challenger?.name
                      const isWon = ch.winner_team_id === team.id
                      const isLost = ch.winner_team_id && ch.winner_team_id !== team.id

                      return (
                        <div key={ch.id} className="bg-white/4 border border-white/6 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold">{team.name}</span>
                            <span className="text-xs text-text-muted">vs</span>
                            <span className="text-sm font-bold">{opponentName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-primary">{myScore}</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              ch.status === 'completed'
                                ? isWon ? 'bg-teal/15 text-teal' : isLost ? 'bg-danger/15 text-danger' : 'bg-gold/15 text-gold'
                                : 'bg-primary/15 text-primary'
                            }`}>
                              {ch.status === 'completed'
                                ? isWon ? (locale === 'de' ? 'Gewonnen!' : 'Won!') : isLost ? (locale === 'de' ? 'Verloren' : 'Lost') : 'Draw'
                                : (locale === 'de' ? 'Läuft' : 'Active')}
                            </span>
                            <span className="font-mono font-bold text-fire">{theirScore}</span>
                          </div>
                          <div className="text-[10px] text-text-muted mt-1 text-center">
                            KW {ch.week_start}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Challenge from ranking */}
                <h3 className="text-sm font-bold mt-4">{locale === 'de' ? 'Team herausfordern' : 'Challenge a Team'}</h3>
                <p className="text-xs text-text-muted mb-2">
                  {locale === 'de'
                    ? 'Wähle ein Team aus dem Ranking für ein Wochen-Battle:'
                    : 'Pick a team from the ranking for a weekly battle:'}
                </p>
                {rankings.filter(r => r.team_id !== team.id).length === 0 ? (
                  <p className="text-text-muted text-sm">{locale === 'de' ? 'Keine anderen Teams verfügbar.' : 'No other teams available.'}</p>
                ) : (
                  <div className="space-y-2">
                    {rankings.filter(r => r.team_id !== team.id).slice(0, 5).map(r => (
                      <div key={r.team_id} className="flex items-center gap-3 bg-white/4 border border-white/6 rounded-xl px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{r.team_name}</div>
                          <div className="text-[10px] text-text-muted">{r.member_count} {locale === 'de' ? 'Spieler' : 'players'} · {r.total_score} Pts</div>
                        </div>
                        <button
                          onClick={() => challengeTeam(r.team_id)}
                          disabled={actionLoading}
                          className="text-xs px-3 py-1.5 rounded-lg bg-fire/15 text-fire font-semibold hover:bg-fire/25 transition-colors disabled:opacity-50"
                        >
                          ⚔️ {locale === 'de' ? 'Herausfordern' : 'Challenge'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
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

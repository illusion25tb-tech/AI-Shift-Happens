import type { LeaderboardEntry, Locale } from '../types'
import { LEVELS } from '../lib/constants'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentUserId: string
  locale: Locale
}

export default function LeaderboardTable({ entries, currentUserId, locale }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return <p className="text-text-muted text-center py-8 text-sm">Noch keine Einträge</p>
  }

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)

  const getLevelEmoji = (level: number) => LEVELS.find(l => l.level === level)?.emoji ?? '🌱'

  return (
    <div className="space-y-4">
      {/* Podium */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-3 pb-4">
          {/* 2nd place */}
          {top3[1] && (
            <PodiumCard entry={top3[1]} rank={2} color="text-gray-400" getLevelEmoji={getLevelEmoji} isMe={top3[1].user_id === currentUserId} />
          )}
          {/* 1st place */}
          {top3[0] && (
            <PodiumCard entry={top3[0]} rank={1} color="text-gold" getLevelEmoji={getLevelEmoji} isMe={top3[0].user_id === currentUserId} large />
          )}
          {/* 3rd place */}
          {top3[2] && (
            <PodiumCard entry={top3[2]} rank={3} color="text-fire" getLevelEmoji={getLevelEmoji} isMe={top3[2].user_id === currentUserId} />
          )}
        </div>
      )}

      {/* Rest */}
      <div className="bg-white/4 border border-white/6 rounded-2xl divide-y divide-white/6">
        {rest.map(entry => {
          const isMe = entry.user_id === currentUserId
          return (
            <div key={entry.user_id} className={`flex items-center gap-3 px-4 py-3 ${isMe ? 'bg-primary/10' : ''}`}>
              <span className={`w-6 text-center font-mono font-bold text-sm ${isMe ? 'text-primary' : 'text-text-muted'}`}>
                {entry.rank}
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-teal flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {(entry.display_name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold truncate ${isMe ? 'text-primary' : ''}`}>
                  {isMe ? (locale === 'de' ? 'Du' : 'You') : entry.display_name || 'Anonym'}
                </div>
                <div className="text-xs text-text-muted">{getLevelEmoji(entry.level)} Lv {entry.level}</div>
              </div>
              <span className="font-mono font-semibold text-sm text-primary">{entry.total_score.toLocaleString()}</span>
              {entry.current_streak > 0 && (
                <span className="text-xs">🔥{entry.current_streak}</span>
              )}
            </div>
          )
        })}

        {/* Show current user if not in list */}
        {!entries.some(e => e.user_id === currentUserId) && (
          <div className="flex items-center gap-3 px-4 py-3 bg-primary/10">
            <span className="w-6 text-center font-mono font-bold text-sm text-primary">—</span>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">?</div>
            <div className="flex-1 text-sm font-semibold text-primary">{locale === 'de' ? 'Du' : 'You'}</div>
            <span className="font-mono text-sm text-text-muted">0</span>
          </div>
        )}
      </div>
    </div>
  )
}

function PodiumCard({ entry, rank, color, getLevelEmoji, isMe, large }: {
  entry: LeaderboardEntry; rank: number; color: string; getLevelEmoji: (l: number) => string; isMe: boolean; large?: boolean
}) {
  const medals = ['', '👑', '🥈', '🥉']
  return (
    <div className={`text-center ${large ? 'mb-4' : ''} ${isMe ? 'ring-2 ring-primary rounded-2xl' : ''}`}>
      <div className={`bg-white/4 border border-white/6 rounded-2xl p-3 ${large ? 'px-5 py-4' : 'px-3 py-3'}`}>
        <div className={`${large ? 'text-2xl' : 'text-lg'} mb-1`}>{medals[rank]}</div>
        <div className={`${large ? 'w-12 h-12' : 'w-9 h-9'} rounded-full bg-gradient-to-br from-primary to-teal flex items-center justify-center text-white font-bold mx-auto mb-1 ${large ? 'text-base' : 'text-xs'}`}>
          {(entry.display_name || '?').charAt(0).toUpperCase()}
        </div>
        <div className={`font-bold truncate max-w-[80px] mx-auto ${large ? 'text-sm' : 'text-xs'} ${isMe ? 'text-primary' : ''}`}>
          {entry.display_name || 'Anonym'}
        </div>
        <div className={`font-mono font-bold ${color} ${large ? 'text-base' : 'text-sm'}`}>
          {entry.total_score.toLocaleString()}
        </div>
        <div className="text-[10px] text-text-muted">{getLevelEmoji(entry.level)} Lv {entry.level}</div>
      </div>
    </div>
  )
}

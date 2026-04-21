import type { Locale } from '../types'
import { BADGES, lf } from '../lib/constants'

interface BadgeGridProps {
  earnedBadges: string[]
  locale: Locale
}

export default function BadgeGrid({ earnedBadges, locale }: BadgeGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {BADGES.map(badge => {
        const earned = earnedBadges.includes(badge.type)
        return (
          <div
            key={badge.type}
            className={`bg-white/4 border border-white/6 rounded-xl p-3 text-center transition-opacity
              ${earned ? '' : 'opacity-30 grayscale'}`}
          >
            <div className="text-2xl mb-1">{badge.emoji}</div>
            <div className="text-xs font-bold text-text-primary truncate">
              {lf(badge.title, locale)}
            </div>
            <div className="text-[10px] text-text-muted mt-0.5 line-clamp-2">
              {lf(badge.description, locale)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

import type { Locale } from '../types'
import WeekdayDots from './WeekdayDots'

interface StreakBarProps {
  streak: number
  playedDays: string[]
  locale: Locale
  t: (key: string) => string
}

export default function StreakBar({ streak, playedDays, locale, t }: StreakBarProps) {
  return (
    <div className="bg-white/4 border border-white/6 rounded-2xl p-4 flex items-center gap-3">
      <div className="text-3xl">🔥</div>
      <div className="flex-1">
        <div className="text-2xl font-extrabold text-fire">{streak}</div>
        <div className="text-xs text-text-muted">{t(streak === 1 ? 'dashboard.streakDay' : 'dashboard.streakDays')}</div>
      </div>
      <WeekdayDots playedDays={playedDays} locale={locale} />
    </div>
  )
}

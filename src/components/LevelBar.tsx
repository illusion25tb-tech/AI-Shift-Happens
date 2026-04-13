import { getLevelForXp } from '../lib/gamification'
import type { Locale } from '../types'

interface LevelBarProps {
  totalXp: number
  locale: Locale
}

export default function LevelBar({ totalXp, locale }: LevelBarProps) {
  const info = getLevelForXp(totalXp)
  const title = locale === 'de' ? info.titleDe : info.titleEn

  // Calculate progress within current level
  const currentLevelFloor = getCurrentLevelFloor(info.level)
  const progress = info.nextLevelXp
    ? ((totalXp - currentLevelFloor) / (info.nextLevelXp - currentLevelFloor)) * 100
    : 100

  return (
    <div className="bg-white/4 border border-white/6 rounded-2xl p-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2 font-bold text-sm">
          <span className="text-lg">{info.emoji}</span>
          <span>{title}</span>
        </div>
        <span className="text-xs text-text-muted font-mono">
          {totalXp.toLocaleString()} {info.nextLevelXp ? `/ ${info.nextLevelXp.toLocaleString()} XP` : 'XP'}
        </span>
      </div>
      <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-teal rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  )
}

function getCurrentLevelFloor(level: number): number {
  const floors = [0, 0, 1000, 5000, 15000, 40000, 100000]
  return floors[level] ?? 0
}

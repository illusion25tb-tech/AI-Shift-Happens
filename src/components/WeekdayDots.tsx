import type { Locale } from '../types'

interface WeekdayDotsProps {
  playedDays: string[]
  locale: Locale
}

const WEEKDAYS = [
  { key: 'mo', de: 'Mo', en: 'Mo' },
  { key: 'di', de: 'Di', en: 'Tu' },
  { key: 'mi', de: 'Mi', en: 'We' },
  { key: 'do', de: 'Do', en: 'Th' },
  { key: 'fr', de: 'Fr', en: 'Fr' },
]

export default function WeekdayDots({ playedDays, locale }: WeekdayDotsProps) {
  const todayIndex = new Date().getDay()
  const todayKey = ['so', 'mo', 'di', 'mi', 'do', 'fr', 'sa'][todayIndex]

  return (
    <div className="flex gap-1">
      {WEEKDAYS.map(d => {
        const played = playedDays.includes(d.key)
        const isToday = d.key === todayKey
        return (
          <div
            key={d.key}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors
              ${played ? 'bg-fire text-white' : isToday ? 'bg-primary text-white' : 'bg-white/6 text-text-muted'}`}
          >
            {d[locale]}
          </div>
        )
      })}
    </div>
  )
}

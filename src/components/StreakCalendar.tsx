import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Locale } from '../types'

interface StreakCalendarProps {
  userId: string
  locale: Locale
}

export default function StreakCalendar({ userId, locale }: StreakCalendarProps) {
  const [playedDates, setPlayedDates] = useState<Set<string>>(new Set())

  useEffect(() => {
    supabase
      .from('quiz_attempts')
      .select('created_at')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (!data) return
        const dates = new Set<string>()
        for (const a of data) {
          if (a.created_at) dates.add(a.created_at.split('T')[0])
        }
        setPlayedDates(dates)
      })
  }, [userId])

  // Generate last 12 weeks (84 days)
  const today = new Date()
  const days: { date: string; played: boolean; isToday: boolean; dayOfWeek: number }[] = []

  for (let i = 83; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    days.push({
      date: dateStr,
      played: playedDates.has(dateStr),
      isToday: i === 0,
      dayOfWeek: d.getDay(),
    })
  }

  // Group into weeks (columns)
  const weeks: typeof days[] = []
  let currentWeek: typeof days = []
  for (const day of days) {
    currentWeek.push(day)
    if (day.dayOfWeek === 6) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }
  if (currentWeek.length > 0) weeks.push(currentWeek)

  const totalPlayed = playedDates.size

  return (
    <div className="bg-white/4 border border-white/6 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">
          {locale === 'de' ? 'Aktivität (12 Wochen)' : 'Activity (12 weeks)'}
        </h3>
        <span className="text-xs text-text-muted font-mono">
          {totalPlayed} {locale === 'de' ? 'Tage' : 'days'}
        </span>
      </div>

      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {/* Pad first week with empty cells */}
            {wi === 0 && Array.from({ length: week[0]?.dayOfWeek ?? 0 }).map((_, i) => (
              <div key={`pad-${i}`} className="w-3 h-3" />
            ))}
            {week.map(day => (
              <div
                key={day.date}
                title={`${day.date}${day.played ? ' ✓' : ''}`}
                className={`w-3 h-3 rounded-[2px] transition-colors ${
                  day.isToday
                    ? 'ring-1 ring-primary'
                    : ''
                } ${
                  day.played
                    ? 'bg-primary'
                    : day.dayOfWeek === 0 || day.dayOfWeek === 6
                    ? 'bg-white/3'
                    : 'bg-white/6'
                }`}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-[10px] text-text-muted">
        <span>{locale === 'de' ? 'Weniger' : 'Less'}</span>
        <div className="w-3 h-3 rounded-[2px] bg-white/6" />
        <div className="w-3 h-3 rounded-[2px] bg-primary/40" />
        <div className="w-3 h-3 rounded-[2px] bg-primary" />
        <span>{locale === 'de' ? 'Mehr' : 'More'}</span>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'

interface TimerBarProps {
  maxSeconds: number
  onTimeUpdate: (ms: number) => void
  running: boolean
}

export default function TimerBar({ maxSeconds, onTimeUpdate, running }: TimerBarProps) {
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setElapsed(0)
      return
    }

    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 100
        onTimeUpdate(next)
        return next
      })
    }, 100)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [running, onTimeUpdate])

  const maxMs = maxSeconds * 1000
  const progress = Math.min(elapsed / maxMs, 1)
  const fillPercent = (1 - progress) * 100

  return (
    <div className="h-1 w-full bg-white/6 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-none"
        style={{
          width: `${fillPercent}%`,
          background: 'linear-gradient(to right, var(--color-teal), var(--color-primary))',
          marginLeft: `${100 - fillPercent}%`,
        }}
      />
    </div>
  )
}

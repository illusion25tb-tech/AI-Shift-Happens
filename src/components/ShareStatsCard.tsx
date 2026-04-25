import { useRef, useCallback } from 'react'
import type { Locale } from '../types'
import { LEVELS, lf } from '../lib/constants'

interface ShareStatsCardProps {
  displayName: string
  totalXp: number
  level: number
  longestStreak: number
  quizCount: number
  accuracy: number
  locale: Locale
}

export default function ShareStatsCard({
  displayName, totalXp, level, longestStreak, quizCount, accuracy, locale,
}: ShareStatsCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const levelInfo = LEVELS.find(l => l.level === level) ?? LEVELS[0]

  const generateAndShare = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 600
    const H = 400
    canvas.width = W
    canvas.height = H

    // Background
    const grad = ctx.createLinearGradient(0, 0, W, H)
    grad.addColorStop(0, '#080B1A')
    grad.addColorStop(1, '#111B45')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Violet accent circle
    const glow = ctx.createRadialGradient(450, 200, 0, 450, 200, 200)
    glow.addColorStop(0, 'rgba(91,79,199,0.2)')
    glow.addColorStop(1, 'rgba(91,79,199,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)

    // Title
    ctx.fillStyle = '#A8A4BA'
    ctx.font = '600 14px Arial, sans-serif'
    ctx.fillText('AI-SHIFT HAPPENS', 40, 45)

    // Name + Level
    ctx.fillStyle = '#E8E6F0'
    ctx.font = 'bold 28px Arial, sans-serif'
    ctx.fillText(displayName || 'Player', 40, 90)

    ctx.fillStyle = '#5B4FC7'
    ctx.font = '600 16px Arial, sans-serif'
    ctx.fillText(`${levelInfo.emoji} ${lf(levelInfo.title, locale)} (Level ${level})`, 40, 120)

    // Stats boxes
    const stats = [
      { label: 'XP', value: totalXp.toLocaleString(), color: '#5B4FC7' },
      { label: locale === 'de' ? 'Streak' : 'Streak', value: `${longestStreak}d`, color: '#F97316' },
      { label: 'Quizzes', value: String(quizCount), color: '#FBBF24' },
      { label: locale === 'de' ? 'Genauigkeit' : 'Accuracy', value: `${accuracy}%`, color: '#2DD4BF' },
    ]

    const boxW = 120
    const boxH = 80
    const gap = 15
    const startX = 40
    const startY = 160

    stats.forEach((s, i) => {
      const x = startX + i * (boxW + gap)
      const y = startY

      // Box background
      ctx.fillStyle = 'rgba(255,255,255,0.04)'
      ctx.beginPath()
      ctx.roundRect(x, y, boxW, boxH, 12)
      ctx.fill()

      // Box border
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(x, y, boxW, boxH, 12)
      ctx.stroke()

      // Value
      ctx.fillStyle = s.color
      ctx.font = 'bold 24px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(s.value, x + boxW / 2, y + 38)

      // Label
      ctx.fillStyle = '#A8A4BA'
      ctx.font = '12px Arial, sans-serif'
      ctx.fillText(s.label, x + boxW / 2, y + 60)
    })

    ctx.textAlign = 'left'

    // Footer
    ctx.fillStyle = '#5C586E'
    ctx.font = '12px Arial, sans-serif'
    ctx.fillText(`${window.location.host}${import.meta.env.BASE_URL.replace(/\/$/, '')}`, 40, H - 30)

    ctx.fillStyle = '#A8A4BA'
    ctx.font = '600 12px Arial, sans-serif'
    ctx.fillText(locale === 'de' ? 'Wie AI-ready bist du?' : 'How AI-ready are you?', 40, H - 50)

    // Convert to blob and share/download
    canvas.toBlob(async (blob) => {
      if (!blob) return

      const file = new File([blob], 'ai-shift-happens-stats.png', { type: 'image/png' })

      if ('share' in navigator && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'AI-Shift Happens Stats',
            text: locale === 'de'
              ? `Mein AI-Mindset: ${totalXp} XP, Level ${level}! Wie AI-ready bist du?`
              : `My AI mindset: ${totalXp} XP, Level ${level}! How AI-ready are you?`,
          })
          return
        } catch { /* user cancelled */ }
      }

      // Fallback: download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'ai-shift-happens-stats.png'
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }, [displayName, totalXp, level, longestStreak, quizCount, accuracy, locale, levelInfo])

  return (
    <div>
      <canvas ref={canvasRef} className="hidden" />
      <button
        onClick={generateAndShare}
        className="w-full bg-primary/20 text-primary font-semibold py-3 rounded-xl text-sm hover:bg-primary/30 transition-colors flex items-center justify-center gap-2"
      >
        📊 {locale === 'de' ? 'Stats-Karte teilen' : 'Share stats card'}
      </button>
    </div>
  )
}

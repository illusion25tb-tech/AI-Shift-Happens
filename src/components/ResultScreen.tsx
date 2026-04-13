import { motion } from 'framer-motion'
import type { AnswerResult, Locale } from '../types'
import { LEVELS, BADGES } from '../lib/constants'

interface ResultScreenProps {
  score: number
  answers: AnswerResult[]
  maxStreak: number
  locale: Locale
  onBack: () => void
  t: (key: string, vars?: Record<string, string | number>) => string
  gamificationResult?: {
    xp_gained: number
    total_xp: number
    level: number
    streak: number
    new_badges: string[]
  } | null
}

export default function ResultScreen({
  score,
  answers,
  maxStreak,
  locale,
  onBack,
  t,
  gamificationResult,
}: ResultScreenProps) {
  const correctCount = answers.filter(a => a.is_correct).length
  const totalMs = answers.reduce((sum, a) => sum + (a.speed_bonus > 0 ? a.speed_bonus : 0), 0)
  const avgSpeedMs =
    answers.length > 0 ? Math.round(totalMs / answers.length) : 0

  // Find matching level based on score
  const level = [...LEVELS]
    .reverse()
    .find(l => score >= l.xp) ?? LEVELS[0]

  const levelTitle = level.title[locale]
  const levelEmoji = level.emoji

  // Ring: map score to 0–100% assuming max ~500 points per question as rough scale
  const maxEstimated = answers.length * 500
  const ringPercent = maxEstimated > 0 ? Math.min((score / maxEstimated) * 100, 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6 text-center"
    >
      {/* Trophy + level */}
      <div className="space-y-2">
        <div className="text-6xl">{levelEmoji}</div>
        <h2 className="text-2xl font-bold text-text-primary">{levelTitle}</h2>
      </div>

      {/* Score ring */}
      <div className="flex items-center justify-center">
        <div
          className="w-36 h-36 rounded-full flex items-center justify-center"
          style={{
            background: `conic-gradient(var(--color-primary) 0%, var(--color-teal) ${ringPercent}%, rgba(255,255,255,0.06) ${ringPercent}%)`,
          }}
        >
          <div className="w-28 h-28 rounded-full bg-bg-base flex flex-col items-center justify-center">
            <span className="text-3xl font-mono font-bold text-text-primary">{score}</span>
            <span className="text-xs text-text-muted uppercase tracking-wider">
              {t('result.points')}
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/4 border border-bg-card-border rounded-xl p-3">
          <div className="text-2xl font-bold text-teal font-mono">{correctCount}</div>
          <div className="text-xs text-text-muted mt-1">{t('result.correct')}</div>
        </div>
        <div className="bg-white/4 border border-bg-card-border rounded-xl p-3">
          <div className="text-2xl font-bold text-fire font-mono">{maxStreak}×</div>
          <div className="text-xs text-text-muted mt-1">{t('result.maxStreak')}</div>
        </div>
        <div className="bg-white/4 border border-bg-card-border rounded-xl p-3">
          <div className="text-2xl font-bold text-gold font-mono">{avgSpeedMs}</div>
          <div className="text-xs text-text-muted mt-1">{t('result.avgSpeed')}</div>
        </div>
      </div>

      {/* XP Gained */}
      {gamificationResult && (
        <div className="flex items-center justify-center gap-4 my-3">
          <span className="text-teal font-mono font-bold text-lg">+{gamificationResult.xp_gained} XP</span>
          {gamificationResult.streak > 0 && (
            <span className="text-fire font-bold text-sm">🔥 {gamificationResult.streak} {t('result.streakCount', { days: gamificationResult.streak })}</span>
          )}
        </div>
      )}

      {/* New badges */}
      {gamificationResult?.new_badges && gamificationResult.new_badges.length > 0 && (
        <div className="flex gap-2 justify-center flex-wrap my-3">
          {gamificationResult.new_badges.map(type => {
            const badge = BADGES.find(b => b.type === type)
            return badge ? (
              <span key={type} className="bg-gold/10 border border-gold/20 text-gold px-3 py-1 rounded-full text-xs font-bold">
                {badge.emoji} {badge.title[locale]}
              </span>
            ) : null
          })}
        </div>
      )}

      {/* Back button */}
      <button
        onClick={onBack}
        className="w-full border border-bg-card-border hover:border-primary text-text-secondary hover:text-text-primary font-semibold py-3 px-4 rounded-xl transition-colors"
      >
        {t('result.back')}
      </button>
    </motion.div>
  )
}

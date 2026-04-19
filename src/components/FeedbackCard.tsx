import { motion } from 'framer-motion'
import type { AnswerResult } from '../types'
import { CONFIDENCE_LABELS } from '../lib/constants'
import type { ConfidenceLevel } from '../lib/constants'

interface FeedbackCardProps {
  result: AnswerResult
  streak: number
  isLast: boolean
  onNext: () => void
  t: (key: string) => string
}

function getShiftEmoji(isCorrect: boolean, confidence: ConfidenceLevel, isBullshitTrap: boolean): string {
  if (isBullshitTrap && !isCorrect && confidence === 3) return '🚨'
  if (isCorrect && confidence === 3) return '🤩'
  if (isCorrect && confidence === 1) return '😤'
  if (isCorrect) return '😊'
  if (!isCorrect && confidence === 3) return '🫣'
  if (!isCorrect && confidence === 1) return '🤷'
  return '😐'
}

export default function FeedbackCard({ result, streak, isLast, onNext, t }: FeedbackCardProps) {
  const { is_correct, is_dangerous, is_bullshit_trap, total_score, feedback_text, mindset_tip, shift_quote, confidence } = result

  const emoji = is_correct ? '✅' : is_dangerous ? '⚠️' : '💡'
  const confidenceLabel = CONFIDENCE_LABELS[confidence as ConfidenceLevel]
  const shiftEmoji = getShiftEmoji(is_correct, confidence as ConfidenceLevel, !!is_bullshit_trap)

  const scoreColor = is_correct
    ? 'var(--color-teal)'
    : total_score < 0
    ? 'var(--color-danger)'
    : 'var(--color-gold)'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-4 text-center"
    >
      {/* Result + Score */}
      <div className="space-y-2">
        <div className="text-5xl">{emoji}</div>
        <div
          className="text-4xl font-mono font-bold"
          style={{ color: scoreColor }}
        >
          {total_score >= 0 ? '+' : ''}{total_score}
        </div>

        {/* Confidence indicator */}
        {confidenceLabel && (
          <span className="inline-flex items-center gap-1 text-text-muted text-xs px-3 py-1 rounded-full bg-white/4 border border-white/6">
            {confidenceLabel.emoji} {confidenceLabel.de}
          </span>
        )}

        {is_correct && streak > 1 && (
          <span className="inline-flex items-center gap-1 text-fire font-semibold text-sm px-3 py-1 rounded-full bg-fire/10 border border-fire/20">
            🔥 {streak}x Streak
          </span>
        )}
      </div>

      {/* SHIFT Buddy Quote */}
      {shift_quote && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex items-start gap-3 text-left"
        >
          <div className="text-2xl flex-shrink-0 mt-1">{shiftEmoji}</div>
          <div
            className="flex-1 rounded-xl px-4 py-3 text-sm text-text-primary leading-relaxed"
            style={{
              backgroundColor: is_bullshit_trap && !is_correct && confidence === 3
                ? 'rgba(249,115,22,0.1)'
                : is_correct
                ? 'rgba(45,212,191,0.08)'
                : 'rgba(255,255,255,0.04)',
              borderLeft: `3px solid ${
                is_bullshit_trap && !is_correct && confidence === 3
                  ? '#F97316'
                  : is_correct
                  ? 'var(--color-teal)'
                  : 'rgba(255,255,255,0.1)'
              }`,
            }}
          >
            <span className="font-semibold">SHIFT:</span> {shift_quote}
          </div>
        </motion.div>
      )}

      {/* Bullshit Detector Label */}
      {is_bullshit_trap && !is_correct && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-fire/10 border border-fire/20"
        >
          <span className="text-lg">🎭</span>
          <span className="text-fire text-sm font-bold">Bullshit-Detektor!</span>
        </motion.div>
      )}

      {/* Explanation */}
      {feedback_text && (
        <div className="bg-white/4 border border-bg-card-border rounded-xl p-4 text-left">
          <p className="text-text-secondary text-sm leading-relaxed">{feedback_text}</p>
        </div>
      )}

      {/* Mindset tip */}
      {mindset_tip && (
        <div
          className="rounded-xl p-4 text-left border-l-4"
          style={{
            backgroundColor: 'rgba(91,79,199,0.08)',
            borderLeftColor: 'var(--color-primary)',
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
            {t('feedback.mindsetTip')}
          </p>
          <p className="text-text-secondary text-sm leading-relaxed">{mindset_tip}</p>
        </div>
      )}

      {/* Next button */}
      <button
        onClick={onNext}
        className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-4 rounded-xl transition-colors"
      >
        {isLast ? t('feedback.seeResult') : t('feedback.next')}
      </button>
    </motion.div>
  )
}

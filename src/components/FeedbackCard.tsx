import { motion } from 'framer-motion'
import { AnswerResult } from '../types'

interface FeedbackCardProps {
  result: AnswerResult
  streak: number
  isLast: boolean
  onNext: () => void
  t: (key: string) => string
}

export default function FeedbackCard({ result, streak, isLast, onNext, t }: FeedbackCardProps) {
  const { is_correct, is_dangerous, total_score, feedback_text, mindset_tip } = result

  const emoji = is_correct ? '✅' : is_dangerous ? '⚠️' : '💡'
  const titleKey = is_correct
    ? 'feedback.correct'
    : is_dangerous
    ? 'feedback.dangerous'
    : 'feedback.notOptimal'

  const scoreColor = is_correct
    ? 'var(--color-teal)'
    : is_dangerous
    ? 'var(--color-danger)'
    : 'var(--color-gold)'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-4 text-center"
    >
      {/* Emoji + title + score */}
      <div className="space-y-2">
        <div className="text-5xl">{emoji}</div>
        <h2 className="text-xl font-bold text-text-primary">{t(titleKey)}</h2>
        <div
          className="text-4xl font-mono font-bold"
          style={{ color: scoreColor }}
        >
          +{total_score}
        </div>

        {is_correct && streak > 1 && (
          <span className="inline-flex items-center gap-1 text-fire font-semibold text-sm px-3 py-1 rounded-full bg-fire/10 border border-fire/20">
            🔥 {streak}× Streak
          </span>
        )}
      </div>

      {/* Explanation */}
      <div className="bg-white/4 border border-bg-card-border rounded-xl p-4 text-left">
        <p className="text-text-secondary text-sm leading-relaxed">{feedback_text}</p>
      </div>

      {/* Mindset tip */}
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

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { AnswerResult } from '../types'

interface FeedbackCardProps {
  result: AnswerResult
  streak: number
  isLast: boolean
  onNext: () => void
  t: (key: string) => string
}

const MOTIVATIONAL = {
  correct: {
    de: [
      'Genau richtig! So nutzt man KI als echten Partner.',
      'Stark! Du denkst wie ein AI Architect.',
      'Perfekte Wahl — genau so geht modernes Arbeiten mit KI.',
      'Volltreffer! Dein KI-Mindset ist auf dem richtigen Weg.',
      'Exzellent! Das ist die Denkweise, die den Unterschied macht.',
      'Bravo! KI als Werkzeug statt als Ersatz — du hast es verstanden.',
    ],
    en: [
      'Spot on! That\'s how you use AI as a real partner.',
      'Impressive! You think like an AI Architect.',
      'Perfect choice — that\'s how modern AI collaboration works.',
      'Bull\'s eye! Your AI mindset is on the right track.',
      'Excellent! This is the thinking that makes the difference.',
      'Well done! AI as a tool, not a replacement — you get it.',
    ],
  },
  dangerous: {
    de: [
      'Achtung! Diese Herangehensweise kann im Arbeitsalltag riskant werden.',
      'Vorsicht! Hier lauern Datenschutz- oder Qualitätsrisiken.',
      'Stopp — dieser Ansatz kann nach hinten losgehen.',
      'Gefährlich! Ohne menschliche Kontrolle wird KI zum Risiko.',
      'Rote Flagge! So entstehen die KI-Fails, die in den Nachrichten landen.',
    ],
    en: [
      'Watch out! This approach can be risky in the workplace.',
      'Careful! There are privacy or quality risks lurking here.',
      'Hold on — this approach can backfire.',
      'Dangerous! Without human oversight, AI becomes a risk.',
      'Red flag! This is how AI fails that make the news happen.',
    ],
  },
  neutral: {
    de: [
      'Nicht schlecht, aber da steckt noch mehr Potenzial drin!',
      'Solide, aber die optimale Lösung nutzt KI gezielter.',
      'Akzeptabel — doch mit KI geht das noch smarter.',
      'Guter Instinkt, aber der Profi-Move sieht anders aus.',
      'Fast! Ein Schritt mehr Richtung KI-Denken und du bist dabei.',
    ],
    en: [
      'Not bad, but there\'s still more potential to unlock!',
      'Solid, but the optimal solution uses AI more strategically.',
      'Acceptable — but AI can make this even smarter.',
      'Good instinct, but the pro move looks different.',
      'Almost! One more step toward AI thinking and you\'re there.',
    ],
  },
}

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function FeedbackCard({ result, streak, isLast, onNext, t }: FeedbackCardProps) {
  const { is_correct, is_dangerous, total_score, feedback_text, mindset_tip } = result

  const emoji = is_correct ? '✅' : is_dangerous ? '⚠️' : '💡'

  const detectedLocale = useMemo(() => {
    const test = t('feedback.next')
    return test === 'Weiter' ? 'de' : 'en'
  }, [t])

  const motivationalText = useMemo(() => {
    const pool = is_correct
      ? MOTIVATIONAL.correct
      : is_dangerous
      ? MOTIVATIONAL.dangerous
      : MOTIVATIONAL.neutral
    return pickRandom(pool[detectedLocale])
  }, [is_correct, is_dangerous, detectedLocale])

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
      {/* Emoji + motivational text + score */}
      <div className="space-y-2">
        <div className="text-5xl">{emoji}</div>
        <h2 className="text-lg font-bold text-text-primary leading-snug">{motivationalText}</h2>
        <div
          className="text-4xl font-mono font-bold"
          style={{ color: scoreColor }}
        >
          {total_score >= 0 ? '+' : ''}{total_score}
        </div>

        {is_correct && streak > 1 && (
          <span className="inline-flex items-center gap-1 text-fire font-semibold text-sm px-3 py-1 rounded-full bg-fire/10 border border-fire/20">
            🔥 {streak}x Streak
          </span>
        )}
      </div>

      {/* Explanation from question data */}
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

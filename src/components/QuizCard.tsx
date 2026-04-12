import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { QuestionForClient, Locale } from '../types'
import { CATEGORY_LABELS } from '../lib/constants'

interface QuizCardProps {
  question: QuestionForClient
  locale: Locale
  disabled: boolean
  onSelect: (index: number) => void
}

const LETTERS = ['A', 'B', 'C']

export default function QuizCard({ question, locale, disabled, onSelect }: QuizCardProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  const shuffledOptions = useMemo(() => {
    return [...question.options].sort(() => Math.random() - 0.5)
  }, [question.id])

  const categoryLabel =
    CATEGORY_LABELS[question.category as keyof typeof CATEGORY_LABELS]?.[locale] ??
    question.category

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-4"
    >
      {/* Category pill */}
      <div className="flex">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted bg-white/4 border border-bg-card-border px-3 py-1 rounded-full">
          {categoryLabel}
        </span>
      </div>

      {/* Scenario card */}
      <div
        className="bg-white/4 border border-bg-card-border rounded-2xl p-5 relative overflow-hidden"
        style={{
          borderTop: '2px solid transparent',
          backgroundImage:
            'linear-gradient(var(--color-bg-card), var(--color-bg-card)), linear-gradient(to right, var(--color-primary), var(--color-teal))',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
        }}
      >
        <p className="text-text-primary text-base leading-relaxed">{question.scenario_text}</p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {shuffledOptions.map((option, i) => {
          const isHovered = hovered === i
          return (
            <button
              key={option.index}
              disabled={disabled}
              onClick={() => onSelect(option.index)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderColor: isHovered
                  ? 'var(--color-primary)'
                  : 'rgba(255,255,255,0.06)',
                transform: isHovered && !disabled ? 'translateY(-2px)' : 'none',
              }}
            >
              {/* Letter badge */}
              <span
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-200"
                style={{
                  backgroundColor: isHovered && !disabled
                    ? 'var(--color-primary)'
                    : 'rgba(255,255,255,0.08)',
                  color: isHovered && !disabled
                    ? '#ffffff'
                    : 'var(--color-text-secondary)',
                }}
              >
                {LETTERS[i]}
              </span>
              <span className="text-text-primary text-sm">{option.text}</span>
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}

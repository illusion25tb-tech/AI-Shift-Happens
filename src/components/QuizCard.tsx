import { useMemo, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { QuestionForClient, Locale } from '../types'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../lib/constants'
import type { CategoryId } from '../lib/constants'

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

  // Keyboard shortcuts: A, B, C or 1, 2, 3
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (disabled) return
    const key = e.key.toLowerCase()
    const map: Record<string, number> = { a: 0, b: 1, c: 2, '1': 0, '2': 1, '3': 2 }
    if (key in map && shuffledOptions[map[key]]) {
      onSelect(shuffledOptions[map[key]].index)
    }
  }, [disabled, shuffledOptions, onSelect])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

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
        <span
          className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full"
          style={{
            color: CATEGORY_COLORS[question.category as CategoryId] ?? '#A8A4BA',
            backgroundColor: (CATEGORY_COLORS[question.category as CategoryId] ?? '#A8A4BA') + '15',
            borderWidth: 1,
            borderColor: (CATEGORY_COLORS[question.category as CategoryId] ?? '#A8A4BA') + '30',
          }}
        >
          {categoryLabel}
        </span>
      </div>

      {/* Scenario card */}
      <div
        className="bg-white/4 rounded-2xl p-5 relative overflow-hidden"
        style={{
          border: '1.5px solid var(--color-primary)',
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

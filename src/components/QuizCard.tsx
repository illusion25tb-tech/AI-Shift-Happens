import { useMemo, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { QuestionForClient, Locale } from '../types'
import { CATEGORY_LABELS, CATEGORY_COLORS, CONFIDENCE_LABELS, lf } from '../lib/constants'
import type { CategoryId, ConfidenceLevel } from '../lib/constants'

interface QuizCardProps {
  question: QuestionForClient
  locale: Locale
  disabled: boolean
  onSubmit: (index: number, confidence: ConfidenceLevel) => void
}

const LETTERS = ['A', 'B', 'C']

export default function QuizCard({ question, locale, disabled, onSubmit }: QuizCardProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [confidence, setConfidence] = useState<ConfidenceLevel | null>(null)

  // Reset when question changes
  useEffect(() => {
    setSelectedIndex(null)
    setConfidence(null)
  }, [question.id])

  const shuffledOptions = useMemo(() => {
    return [...question.options].sort(() => Math.random() - 0.5)
  }, [question.id])

  // Keyboard shortcuts
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (disabled) return

    // If no answer selected: A/B/C or 1/2/3 selects answer
    if (selectedIndex === null) {
      const key = e.key.toLowerCase()
      const map: Record<string, number> = { a: 0, b: 1, c: 2, '1': 0, '2': 1, '3': 2 }
      if (key in map && shuffledOptions[map[key]]) {
        setSelectedIndex(shuffledOptions[map[key]].index)
      }
    } else if (confidence === null) {
      // If answer selected but no confidence: 1/2/3 selects confidence
      const key = e.key
      if (key === '1') setConfidence(1)
      if (key === '2') setConfidence(2)
      if (key === '3') setConfidence(3)
    } else {
      // If both selected: Enter confirms
      if (e.key === 'Enter') {
        onSubmit(selectedIndex, confidence)
      }
    }
  }, [disabled, selectedIndex, confidence, shuffledOptions, onSubmit])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  const _catEntry = CATEGORY_LABELS[question.category as keyof typeof CATEGORY_LABELS]
  const categoryLabel = _catEntry ? lf(_catEntry, locale) : question.category

  const handleConfirm = () => {
    if (selectedIndex !== null && confidence !== null) {
      onSubmit(selectedIndex, confidence)
    }
  }

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
        style={{ border: '1.5px solid var(--color-primary)' }}
      >
        <p className="text-text-primary text-base leading-relaxed">{question.scenario_text}</p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {shuffledOptions.map((option, i) => {
          const isHovered = hovered === i
          const isSelected = selectedIndex === option.index
          return (
            <button
              key={option.index}
              disabled={disabled || selectedIndex !== null}
              onClick={() => setSelectedIndex(option.index)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border transition-all duration-200 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isSelected
                  ? 'rgba(91,79,199,0.15)'
                  : 'rgba(255,255,255,0.03)',
                borderColor: isSelected
                  ? 'var(--color-primary)'
                  : isHovered && selectedIndex === null
                  ? 'var(--color-primary)'
                  : 'rgba(255,255,255,0.06)',
                opacity: selectedIndex !== null && !isSelected ? 0.4 : 1,
                transform: isHovered && selectedIndex === null && !disabled ? 'translateY(-2px)' : 'none',
              }}
            >
              <span
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-200"
                style={{
                  backgroundColor: isSelected
                    ? 'var(--color-primary)'
                    : isHovered && selectedIndex === null && !disabled
                    ? 'var(--color-primary)'
                    : 'rgba(255,255,255,0.08)',
                  color: isSelected || (isHovered && selectedIndex === null && !disabled)
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

      {/* Confidence selector — appears after answer selection */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: 12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-3"
          >
            <p className="text-text-secondary text-sm font-semibold text-center">
              {lf({ de: 'Wie sicher bist du?', en: 'How confident are you?', tr: 'Ne kadar eminsin?', es: '¿Qué tan seguro estás?' }, locale)}
            </p>

            <div className="flex gap-2 justify-center">
              {([1, 2, 3] as ConfidenceLevel[]).map(level => {
                const label = CONFIDENCE_LABELS[level]
                const isActive = confidence === level
                return (
                  <button
                    key={level}
                    onClick={() => setConfidence(level)}
                    className="flex-1 max-w-[140px] py-3 px-2 rounded-xl border text-center transition-all duration-200"
                    style={{
                      backgroundColor: isActive
                        ? level === 3 ? 'rgba(249,115,22,0.15)' : level === 2 ? 'rgba(91,79,199,0.15)' : 'rgba(255,255,255,0.08)'
                        : 'rgba(255,255,255,0.03)',
                      borderColor: isActive
                        ? level === 3 ? '#F97316' : level === 2 ? 'var(--color-primary)' : 'rgba(255,255,255,0.2)'
                        : 'rgba(255,255,255,0.06)',
                      transform: isActive ? 'scale(1.05)' : 'none',
                    }}
                  >
                    <div className="text-xl mb-1">{label.emoji}</div>
                    <div className="text-xs font-semibold text-text-primary">{lf(label, locale)}</div>
                  </button>
                )
              })}
            </div>

            {/* Confirm button */}
            <AnimatePresence>
              {confidence !== null && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleConfirm}
                  disabled={disabled}
                  className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition-colors disabled:opacity-50"
                >
                  {lf({ de: 'Bestätigen', en: 'Confirm', tr: 'Onayla', es: 'Confirmar' }, locale)}
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

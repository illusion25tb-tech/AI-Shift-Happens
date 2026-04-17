import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Locale } from '../types'

interface OnboardingProps {
  locale: Locale
  onComplete: () => void
}

const STEPS = [
  {
    emoji: '🧠',
    title: { de: 'Willkommen bei AI-Shift Happens!', en: 'Welcome to AI-Shift Happens!' },
    body: {
      de: 'Teste dein KI-Mindset in realistischen Büroszenarien. Jeden Werktag gibt es 3+1 Bonus-Fragen.',
      en: 'Test your AI mindset in realistic office scenarios. Every weekday brings 3+1 bonus questions.',
    },
  },
  {
    emoji: '🔥',
    title: { de: 'Streaks & Scoring', en: 'Streaks & Scoring' },
    body: {
      de: 'Halte deinen Streak am Leben (Mo-Fr) für XP-Multiplikatoren. Schnelle richtige Antworten geben Bonus-Punkte. Vorsicht vor gefährlichen Antworten — die brechen den Streak!',
      en: 'Keep your streak alive (Mon-Fri) for XP multipliers. Fast correct answers earn bonus points. Watch out for dangerous answers — they break your streak!',
    },
  },
  {
    emoji: '🏆',
    title: { de: 'Level Up & Compete', en: 'Level Up & Compete' },
    body: {
      de: '6 Level (AI Rookie → AI Dirigent), 13 Badges, Wochen-Champion, Team Battles und 1v1 Challenges. Steige auf und zeig dein KI-Wissen!',
      en: '6 levels (AI Rookie → AI Dirigent), 13 badges, weekly champion, team battles and 1v1 challenges. Level up and show your AI knowledge!',
    },
  },
]

export default function Onboarding({ locale, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 bg-bg-base/95 backdrop-blur-sm flex items-center justify-center px-5" onClick={e => e.stopPropagation()}>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="max-w-sm w-full text-center space-y-6"
        >
          <div className="text-6xl">{current.emoji}</div>
          <h2 className="text-xl font-bold">{current.title[locale]}</h2>
          <p className="text-text-secondary text-sm leading-relaxed">{current.body[locale]}</p>

          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === step ? 'bg-primary' : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="px-6 py-2.5 rounded-xl border border-white/10 text-text-secondary text-sm font-semibold hover:bg-white/4 transition-colors"
              >
                {locale === 'de' ? 'Zurück' : 'Back'}
              </button>
            )}
            <button
              onClick={() => {
                if (isLast) {
                  localStorage.setItem('shift-happens-onboarded', 'true')
                  onComplete()
                } else {
                  setStep(s => s + 1)
                }
              }}
              className="px-8 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm transition-colors"
            >
              {isLast
                ? (locale === 'de' ? 'Los geht\'s!' : 'Let\'s go!')
                : (locale === 'de' ? 'Weiter' : 'Next')}
            </button>
          </div>

          {/* Skip */}
          {!isLast && (
            <button
              onClick={() => {
                localStorage.setItem('shift-happens-onboarded', 'true')
                onComplete()
              }}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              {locale === 'de' ? 'Überspringen' : 'Skip'}
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

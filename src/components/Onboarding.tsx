import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Locale } from '../types'
import { supabase } from '../lib/supabase'

interface OnboardingProps {
  locale: Locale
  onComplete: () => void
}

type ShiftMode = 'serious' | 'cheeky'

const TEXT_STEPS = [
  {
    emoji: '🧠',
    title: { de: 'Willkommen bei AI-Shift Happens!', en: 'Welcome to AI-Shift Happens!' },
    body: {
      de: 'Teste dein KI-Mindset in realistischen Büroszenarien. Jeden Werktag gibt es 3+1 Bonus-Fragen.',
      en: 'Test your AI mindset in realistic office scenarios. Every weekday brings 3+1 bonus questions.',
    },
  },
  // SHIFT selection step is handled separately (index 1)
  {
    emoji: '🎯',
    title: { de: 'Confidence Betting', en: 'Confidence Betting' },
    body: {
      de: 'Nach jeder Antwort wählst du dein Confidence-Level: Vorsichtig (🤔), Mittel (🎯) oder Sicher (🔥). Hohe Confidence = hohe Punkte bei richtig, aber auch hoher Verlust bei falsch! Vorsicht vor Bullshit-Fallen — Antworten die gut klingen, aber falsch sind.',
      en: 'After each answer, pick your confidence level: Cautious (🤔), Medium (🎯) or Sure (🔥). High confidence = high points when right, but big losses when wrong! Watch out for BS traps — answers that sound great but are wrong.',
    },
  },
  {
    emoji: '🏆',
    title: { de: 'Level Up & Compete', en: 'Level Up & Compete' },
    body: {
      de: '6 Level (AI Rookie → AI Dirigent), 25+ Badges, Wochen-Champion, Team Battles und 1v1 Challenges. Steige auf und zeig dein KI-Wissen!',
      en: '6 levels (AI Rookie → AI Dirigent), 25+ badges, weekly champion, team battles and 1v1 challenges. Level up and show your AI knowledge!',
    },
  },
]

const TOTAL_STEPS = 4 // Welcome, SHIFT, Confidence, Level Up

export default function Onboarding({ locale, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [shiftMode, setShiftMode] = useState<ShiftMode>('cheeky')
  const isLast = step === TOTAL_STEPS - 1

  const finish = async () => {
    localStorage.setItem('shift-happens-onboarded', 'true')
    // Save SHIFT mode to profile
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await supabase.from('profiles').update({ shift_mode: shiftMode }).eq('id', session.user.id)
    }
    onComplete()
  }

  const renderShiftStep = () => (
    <motion.div
      key="shift"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-sm w-full text-center space-y-6"
    >
      <div className="text-6xl">🤖</div>
      <h2 className="text-xl font-bold">
        {locale === 'de' ? 'Wähl deinen SHIFT-Style' : 'Choose your SHIFT style'}
      </h2>
      <p className="text-text-secondary text-sm leading-relaxed">
        {locale === 'de'
          ? 'Dein KI-Buddy SHIFT kommentiert jede Antwort. Wie soll er klingen?'
          : 'Your AI buddy SHIFT comments on every answer. How should they sound?'}
      </p>

      <div className="flex gap-3 justify-center">
        {(['serious', 'cheeky'] as ShiftMode[]).map(mode => {
          const isActive = shiftMode === mode
          return (
            <button
              key={mode}
              onClick={() => setShiftMode(mode)}
              className="flex-1 max-w-[160px] py-5 px-4 rounded-2xl border-2 transition-all duration-200 text-center"
              style={{
                borderColor: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)',
                backgroundColor: isActive ? 'rgba(91,79,199,0.12)' : 'rgba(255,255,255,0.03)',
                transform: isActive ? 'scale(1.05)' : 'none',
              }}
            >
              <div className="text-3xl mb-2">{mode === 'serious' ? '🎩' : '😎'}</div>
              <div className="text-sm font-bold text-text-primary mb-1">
                {mode === 'serious'
                  ? (locale === 'de' ? 'Seriös' : 'Serious')
                  : (locale === 'de' ? 'Frech' : 'Cheeky')}
              </div>
              <div className="text-xs text-text-muted leading-tight">
                {mode === 'serious'
                  ? (locale === 'de' ? 'Klar. Direkt. Mentor.' : 'Clear. Direct. Mentor.')
                  : (locale === 'de' ? 'Fresh. Memes. Bestie.' : 'Fresh. Memes. Bestie.')}
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-text-muted">
        {locale === 'de' ? 'Jederzeit im Profil änderbar' : 'Changeable anytime in your profile'}
      </p>

      {/* Progress dots + actions */}
      <div className="flex justify-center gap-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-primary' : 'bg-white/10'}`} />
        ))}
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={() => setStep(s => s - 1)}
          className="px-6 py-2.5 rounded-xl border border-white/10 text-text-secondary text-sm font-semibold hover:bg-white/4 transition-colors"
        >
          {locale === 'de' ? 'Zurück' : 'Back'}
        </button>
        <button
          onClick={() => setStep(s => s + 1)}
          className="px-8 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm transition-colors"
        >
          {locale === 'de' ? 'Weiter' : 'Next'}
        </button>
      </div>
    </motion.div>
  )

  // Map step to content: 0=Welcome, 1=SHIFT, 2=Confidence, 3=Level Up
  const getTextStep = () => {
    if (step === 0) return TEXT_STEPS[0]
    if (step === 2) return TEXT_STEPS[1]
    if (step === 3) return TEXT_STEPS[2]
    return null
  }

  const textStep = getTextStep()

  return (
    <div className="fixed inset-0 z-50 bg-bg-base/95 backdrop-blur-sm flex items-center justify-center px-5" onClick={e => e.stopPropagation()}>
      <AnimatePresence mode="wait">
        {step === 1 ? (
          renderShiftStep()
        ) : textStep ? (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-sm w-full text-center space-y-6"
          >
            <div className="text-6xl">{textStep.emoji}</div>
            <h2 className="text-xl font-bold">{textStep.title[locale]}</h2>
            <p className="text-text-secondary text-sm leading-relaxed">{textStep.body[locale]}</p>

            <div className="flex justify-center gap-2">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-primary' : 'bg-white/10'}`} />
              ))}
            </div>

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
                    finish()
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

            {!isLast && (
              <button
                onClick={finish}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                {locale === 'de' ? 'Überspringen' : 'Skip'}
              </button>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

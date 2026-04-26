import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Locale } from '../types'
import { supabase } from '../lib/supabase'
import { lf } from '../lib/constants'

interface OnboardingProps {
  locale: Locale
  onComplete: () => void
}

type ShiftMode = 'serious' | 'cheeky'

const TEXT_STEPS = [
  {
    emoji: '🧠',
    title: {
      de: 'Willkommen bei AI-Shift Happens!',
      en: 'Welcome to AI-Shift Happens!',
      tr: 'AI-Shift Happens\'e hoş geldin!',
      es: '¡Bienvenido a AI-Shift Happens!',
    },
    body: {
      de: 'Teste dein KI-Mindset in realistischen Büroszenarien. Jeden Werktag gibt es 3+1 Bonus-Fragen.',
      en: 'Test your AI mindset in realistic office scenarios. Every weekday brings 3+1 bonus questions.',
      tr: 'Yapay zeka zihniyetini gerçekçi ofis senaryolarında test et. Her iş günü 3+1 bonus soru.',
      es: 'Pon a prueba tu mentalidad de IA en escenarios de oficina realistas. Cada día laboral, 3+1 preguntas bonus.',
    },
  },
  // SHIFT selection step is handled separately (index 1)
  {
    emoji: '🎯',
    title: {
      de: 'Confidence Betting + Timer',
      en: 'Confidence Betting + Timer',
      tr: 'Güven Bahsi + Sayaç',
      es: 'Apuesta de Confianza + Temporizador',
    },
    body: {
      de: '60 Sekunden pro Frage. Nach der Antwort wählst du: Wie sicher bist du? 🤔 Hmm (+50), 🎯 Ziemlich sicher (+150) oder 🔥 Absolut sicher (+300). Aber Achtung: Hohe Confidence + falsch = hoher Verlust! Dazu gibt es Speed-Bonus für schnelle Antworten. Vorsicht vor Bullshit-Fallen!',
      en: '60 seconds per question. After answering, choose: How confident are you? 🤔 Hmm (+50), 🎯 Pretty sure (+150) or 🔥 Absolutely sure (+300). But careful: High confidence + wrong = big loss! Plus speed bonus for fast answers. Watch out for BS traps!',
      tr: 'Soru başına 60 saniye. Cevapladıktan sonra seç: Ne kadar eminsin? 🤔 Hmm (+50), 🎯 Oldukça eminim (+150) veya 🔥 Kesinlikle eminim (+300). Ama dikkat: Yüksek güven + yanlış = büyük kayıp! Hızlı cevaplar için hız bonusu da var. Saçmalık tuzaklarına dikkat!',
      es: '60 segundos por pregunta. Después de responder, elige: ¿Qué tan seguro estás? 🤔 Hmm (+50), 🎯 Bastante seguro (+150) o 🔥 ¡Totalmente seguro! (+300). ¡Pero cuidado: Alta confianza + incorrecto = gran pérdida! Más bonus de velocidad por respuestas rápidas. ¡Cuidado con las trampas!',
    },
  },
  {
    emoji: '🏆',
    title: {
      de: 'Level Up & Compete',
      en: 'Level Up & Compete',
      tr: 'Seviye Atla & Yarış',
      es: 'Sube de Nivel & Compite',
    },
    body: {
      de: '6 Level (AI Rookie → AI Dirigent), 29 Badges, Wochen-Champion, Team Battles und 1v1 Challenges. Dein KI-Buddy SHIFT kommentiert jede Antwort — frech oder seriös, du entscheidest!',
      en: '6 levels (AI Rookie → AI Dirigent), 29 badges, weekly champion, team battles and 1v1 challenges. Your AI buddy SHIFT comments on every answer — cheeky or serious, you decide!',
      tr: '6 seviye (AI Rookie → AI Dirigent), 29 rozet, haftanın şampiyonu, takım savaşları ve 1v1 düellolar. AI dostun SHIFT her cevabı yorumlar — küstah ya da ciddi, sen karar ver!',
      es: '6 niveles (AI Rookie → AI Dirigent), 29 insignias, campeón semanal, batallas de equipo y duelos 1v1. Tu compañero de IA SHIFT comenta cada respuesta — ¡atrevido o serio, tú decides!',
    },
  },
]

// Inline labels für 4 Sprachen — wird via lf() aufgelöst
const LABELS = {
  shiftTitle: { de: 'Wähl deinen SHIFT-Style', en: 'Choose your SHIFT style', tr: 'SHIFT stilini seç', es: 'Elige tu estilo SHIFT' },
  shiftBody: {
    de: 'Dein KI-Buddy SHIFT kommentiert jede Antwort. Wie soll er klingen?',
    en: 'Your AI buddy SHIFT comments on every answer. How should they sound?',
    tr: 'AI dostun SHIFT her cevabı yorumlar. Nasıl konuşmalı?',
    es: 'Tu compañero de IA SHIFT comenta cada respuesta. ¿Cómo debería sonar?',
  },
  serious: { de: 'Seriös', en: 'Serious', tr: 'Ciddi', es: 'Serio' },
  cheeky: { de: 'Frech', en: 'Cheeky', tr: 'Küstah', es: 'Atrevido' },
  seriousDesc: { de: 'Klar. Direkt. Mentor.', en: 'Clear. Direct. Mentor.', tr: 'Net. Doğrudan. Mentor.', es: 'Claro. Directo. Mentor.' },
  cheekyDesc: { de: 'Fresh. Memes. Bestie.', en: 'Fresh. Memes. Bestie.', tr: 'Taze. Memes. Dostum.', es: 'Fresco. Memes. Bestie.' },
  changeable: { de: 'Jederzeit im Profil änderbar', en: 'Changeable anytime in your profile', tr: 'Profilde istediğin zaman değiştirebilirsin', es: 'Cambiable en cualquier momento en tu perfil' },
  back: { de: 'Zurück', en: 'Back', tr: 'Geri', es: 'Atrás' },
  next: { de: 'Weiter', en: 'Next', tr: 'Devam', es: 'Siguiente' },
  letsgo: { de: 'Los geht\'s!', en: 'Let\'s go!', tr: 'Hadi başlayalım!', es: '¡Vamos!' },
  skip: { de: 'Überspringen', en: 'Skip', tr: 'Atla', es: 'Saltar' },
}

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
      <h2 className="text-xl font-bold">{lf(LABELS.shiftTitle, locale)}</h2>
      <p className="text-text-secondary text-sm leading-relaxed">{lf(LABELS.shiftBody, locale)}</p>

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
                {lf(mode === 'serious' ? LABELS.serious : LABELS.cheeky, locale)}
              </div>
              <div className="text-xs text-text-muted leading-tight">
                {lf(mode === 'serious' ? LABELS.seriousDesc : LABELS.cheekyDesc, locale)}
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-text-muted">{lf(LABELS.changeable, locale)}</p>

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
          {lf(LABELS.back, locale)}
        </button>
        <button
          onClick={() => setStep(s => s + 1)}
          className="px-8 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm transition-colors"
        >
          {lf(LABELS.next, locale)}
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
            <h2 className="text-xl font-bold">{lf(textStep.title, locale)}</h2>
            <p className="text-text-secondary text-sm leading-relaxed">{lf(textStep.body, locale)}</p>

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
                  {lf(LABELS.back, locale)}
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
                {isLast ? lf(LABELS.letsgo, locale) : lf(LABELS.next, locale)}
              </button>
            </div>

            {!isLast && (
              <button
                onClick={finish}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                {lf(LABELS.skip, locale)}
              </button>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Locale } from '../../types'
import { lf } from '../../lib/constants'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

interface HeroSectionProps {
  onStart: () => void
  locale: Locale
}

const L = {
  howPrefix: { de: 'Wie ', en: 'How ', tr: 'Ne kadar ', es: '¿Qué tan ' },
  howSuffix: { de: ' bist du wirklich?', en: ' are you really?', tr: ' olduğunu test et?', es: ' estás realmente?' },
  subtitle: {
    de: 'Teste dein KI-Mindset in realistischen Büroszenarien. Tägliches Quiz, Leaderboard, Wochen-Champion. Kostenlos. 3 Minuten pro Tag.',
    en: 'Test your AI mindset in realistic office scenarios. Daily quiz, leaderboard, weekly champion. Free. 3 minutes per day.',
    tr: 'Yapay zeka zihniyetini gerçekçi ofis senaryolarında test et. Günlük quiz, sıralama, haftanın şampiyonu. Ücretsiz. Günde 3 dakika.',
    es: 'Pon a prueba tu mentalidad de IA en escenarios de oficina realistas. Quiz diario, clasificación, campeón semanal. Gratis. 3 minutos al día.',
  },
  startNow: { de: 'Jetzt kostenlos starten', en: 'Start free now', tr: 'Şimdi ücretsiz başla', es: 'Empieza gratis ahora' },
  howItWorks: { de: 'So funktioniert\'s ↓', en: 'How it works ↓', tr: 'Nasıl çalışır ↓', es: 'Cómo funciona ↓' },
  players: { de: 'Spieler', en: 'Players', tr: 'Oyuncu', es: 'Jugadores' },
  categories: { de: 'Kategorien', en: 'Categories', tr: 'Kategori', es: 'Categorías' },
  questions: { de: 'Fragen', en: 'Questions', tr: 'Soru', es: 'Preguntas' },
  perDay: { de: 'Pro Tag', en: 'Per Day', tr: 'Günde', es: 'Al Día' },
  quizzesPlayed: { de: 'Quizzes gespielt', en: 'Quizzes played', tr: 'Oynanan quiz', es: 'Quizzes jugados' },
  free: { de: 'Kostenlos', en: 'Free', tr: 'Ücretsiz', es: 'Gratis' },
}

export default function HeroSection({ onStart, locale }: HeroSectionProps) {
  const [liveStats, setLiveStats] = useState<{ players: number; questions: number; quizzes_played: number } | null>(null)

  useEffect(() => {
    fetch(`${SUPABASE_URL}/functions/v1/get-public-stats`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    })
      .then(r => r.json())
      .then(d => { if (d.players) setLiveStats(d) })
      .catch(() => {})
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-5 py-16 overflow-hidden">

      {/* Video background — mobile optimized */}
      <video
        autoPlay
        loop
        muted
        playsInline
        disablePictureInPicture
        className="absolute inset-0 w-full h-full object-cover object-center"
        style={{
          filter: 'brightness(0.3) saturate(1.2)',
          minHeight: '100%',
          minWidth: '100%',
        }}
        poster={`${import.meta.env.BASE_URL}shift-logo.png`}
      >
        <source src={`${import.meta.env.BASE_URL}hero-loop.mp4`} type="video/mp4" />
      </video>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-base/70 via-bg-base/20 to-bg-base/95" />

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* Title text only — no logo on landing */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <span className="text-sm font-bold tracking-[0.2em] uppercase text-white/50">AI-Shift Happens</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-extrabold leading-tight mb-5"
        >
          {lf(L.howPrefix, locale)}
          <span className="bg-gradient-to-r from-[#A78BFA] via-[#38BDF8] to-[#2DD4BF] bg-clip-text text-transparent">
            AI-ready
          </span>
          {lf(L.howSuffix, locale)}
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-white/50 max-w-md mx-auto mb-8 leading-relaxed"
        >
          {lf(L.subtitle, locale)}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 justify-center mb-12"
        >
          <button
            onClick={onStart}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-[#3B82F6] text-white font-bold text-lg shadow-[0_0_30px_rgba(91,79,199,0.3)] hover:shadow-[0_0_50px_rgba(91,79,199,0.4)] hover:-translate-y-0.5 transition-all"
          >
            {lf(L.startNow, locale)}
          </button>
          <a
            href="#how-it-works"
            className="px-8 py-4 rounded-2xl border border-white/10 bg-white/4 text-white/60 font-semibold hover:bg-white/8 hover:text-white transition-all backdrop-blur-sm"
          >
            {lf(L.howItWorks, locale)}
          </a>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex gap-8 justify-center pt-6 border-t border-white/6"
        >
          {[
            { num: liveStats ? `${liveStats.players}+` : '10', label: lf(liveStats ? L.players : L.categories, locale) },
            { num: liveStats ? `${liveStats.questions}` : '3 Min', label: lf(liveStats ? L.questions : L.perDay, locale) },
            { num: liveStats ? `${liveStats.quizzes_played}+` : '100%', label: lf(liveStats ? L.quizzesPlayed : L.free, locale) },
          ].map(item => (
            <div key={item.label} className="text-center">
              <div className="text-xl font-extrabold font-mono bg-gradient-to-r from-[#A78BFA] to-[#38BDF8] bg-clip-text text-transparent">{item.num}</div>
              <div className="text-xs text-white/30 uppercase tracking-wider mt-1">{item.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

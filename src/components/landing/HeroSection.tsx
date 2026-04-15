import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

interface HeroSectionProps {
  onStart: () => void
  locale: 'de' | 'en'
}

export default function HeroSection({ onStart, locale }: HeroSectionProps) {
  const isDE = locale === 'de'
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
    <section className="relative min-h-screen flex flex-col items-center justify-center px-5 py-16 overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(59,40,150,0.4), transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(14,116,144,0.25), transparent 50%), linear-gradient(180deg, #080B1A 0%, #0D1330 40%, #111B45 70%, #0D1330 100%)' }}>

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px', maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)' }} />

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-2 mb-10">
          <span className="text-2xl">🧠</span>
          <span className="text-sm font-bold tracking-[0.2em] uppercase text-white/50">AI-Shift Happens</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-extrabold leading-tight mb-5"
        >
          {isDE ? 'Wie ' : 'How '}
          <span className="bg-gradient-to-r from-[#A78BFA] via-[#38BDF8] to-[#2DD4BF] bg-clip-text text-transparent">
            AI-ready
          </span>
          {isDE ? ' bist du wirklich?' : ' are you really?'}
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-white/50 max-w-md mx-auto mb-8 leading-relaxed"
        >
          {isDE
            ? 'Teste dein KI-Mindset in realistischen Büroszenarien. Tägliches Quiz, Leaderboard, Wochen-Champion. Kostenlos. 3 Minuten pro Tag.'
            : 'Test your AI mindset in realistic office scenarios. Daily quiz, leaderboard, weekly champion. Free. 3 minutes per day.'}
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
            {isDE ? 'Jetzt kostenlos starten' : 'Start free now'}
          </button>
          <a
            href="#how-it-works"
            className="px-8 py-4 rounded-2xl border border-white/10 bg-white/4 text-white/60 font-semibold hover:bg-white/8 hover:text-white transition-all backdrop-blur-sm"
          >
            {isDE ? 'So funktioniert\'s ↓' : 'How it works ↓'}
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
            { num: liveStats ? `${liveStats.players}+` : '10', label: isDE ? (liveStats ? 'Spieler' : 'Kategorien') : (liveStats ? 'Players' : 'Categories') },
            { num: liveStats ? `${liveStats.questions}` : '3 Min', label: isDE ? (liveStats ? 'Fragen' : 'Pro Tag') : (liveStats ? 'Questions' : 'Per Day') },
            { num: liveStats ? `${liveStats.quizzes_played}+` : '100%', label: isDE ? (liveStats ? 'Quizzes gespielt' : 'Kostenlos') : (liveStats ? 'Quizzes played' : 'Free') },
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

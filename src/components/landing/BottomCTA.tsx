interface BottomCTAProps {
  onStart: () => void
  locale: string
}

export default function BottomCTA({ onStart, locale }: BottomCTAProps) {
  const isDE = locale === 'de'

  return (
    <section
      className="py-20"
      style={{
        background: 'radial-gradient(ellipse at 50% 50%, rgba(91,79,199,0.2), transparent 70%)',
      }}
    >
      <div className="max-w-2xl mx-auto px-5 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
          {isDE ? 'Bereit für deinen Mindset-Shift?' : 'Ready for your mindset shift?'}
        </h2>
        <p className="text-white/50 mb-8 text-lg">
          {isDE
            ? 'Kostenlos. Keine Kreditkarte. 3 Minuten pro Tag.'
            : 'Free. No credit card. 3 minutes per day.'}
        </p>
        <button
          onClick={onStart}
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-[#3B82F6] text-white font-bold text-lg shadow-[0_0_30px_rgba(91,79,199,0.3)] hover:shadow-[0_0_50px_rgba(91,79,199,0.4)] hover:-translate-y-0.5 transition-all mb-4"
        >
          {isDE ? 'Jetzt kostenlos starten' : 'Start free now'}
        </button>
        <p className="text-white/30 text-sm">
          {isDE ? 'Anmeldung mit Google oder E-Mail' : 'Sign in with Google or email'}
        </p>
      </div>
    </section>
  )
}

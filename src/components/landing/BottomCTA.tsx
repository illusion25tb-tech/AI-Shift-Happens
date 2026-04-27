interface BottomCTAProps {
  onStart: () => void
  locale: string
}

const L: Record<string, { title: string; sub: string; cta: string; signin: string }> = {
  de: {
    title: 'Bereit für deinen Mindset-Shift?',
    sub: 'Kostenlos. Keine Kreditkarte. 3 Minuten pro Tag.',
    cta: 'Jetzt kostenlos starten',
    signin: 'Anmeldung mit Google oder E-Mail',
  },
  en: {
    title: 'Ready for your mindset shift?',
    sub: 'Free. No credit card. 3 minutes per day.',
    cta: 'Start free now',
    signin: 'Sign in with Google or email',
  },
  tr: {
    title: 'Zihniyet değişimine hazır mısın?',
    sub: 'Ücretsiz. Kredi kartı yok. Günde 3 dakika.',
    cta: 'Şimdi ücretsiz başla',
    signin: 'Google veya e-posta ile giriş',
  },
  es: {
    title: '¿Listo para tu cambio de mentalidad?',
    sub: 'Gratis. Sin tarjeta de crédito. 3 minutos al día.',
    cta: 'Empieza gratis ahora',
    signin: 'Inicia sesión con Google o email',
  },
}

export default function BottomCTA({ onStart, locale }: BottomCTAProps) {
  const t = L[locale] ?? L['en']

  return (
    <section
      className="py-20"
      style={{
        background: 'radial-gradient(ellipse at 50% 50%, rgba(91,79,199,0.2), transparent 70%)',
      }}
    >
      <div className="max-w-2xl mx-auto px-5 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-text-primary mb-4">{t.title}</h2>
        <p className="text-white/50 mb-8 text-lg">{t.sub}</p>
        <button
          onClick={onStart}
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-[#3B82F6] text-white font-bold text-lg shadow-[0_0_30px_rgba(91,79,199,0.3)] hover:shadow-[0_0_50px_rgba(91,79,199,0.4)] hover:-translate-y-0.5 transition-all mb-4"
        >
          {t.cta}
        </button>
        <p className="text-white/30 text-sm">{t.signin}</p>
      </div>
    </section>
  )
}

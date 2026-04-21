import { useNavigate } from 'react-router-dom'
import { useLocale } from '../hooks/useLocale'
import { supabase } from '../lib/supabase'
import HeroSection from '../components/landing/HeroSection'
import HowItWorks from '../components/landing/HowItWorks'
import FeaturesGrid from '../components/landing/FeaturesGrid'
import LevelTimeline from '../components/landing/LevelTimeline'
import BottomCTA from '../components/landing/BottomCTA'

export function LandingPage() {
  const navigate = useNavigate()
  const { locale, setLocale } = useLocale()

  const handleStart = () => navigate('/login')

  const handleSecretEntry = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://ai-shift-happens.com/app' },
    })
  }

  return (
    <div className="bg-bg-base text-text-primary font-sans">
      <div className="fixed top-4 right-4 z-50">
        <select
          value={locale}
          onChange={e => setLocale(e.target.value as any)}
          className="text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 text-white/70 hover:text-white hover:border-white/20 transition-colors cursor-pointer"
          style={{ background: '#0f0f1a' }}
        >
          <option value="de" style={{ background: '#0f0f1a', color: '#fff' }}>DE</option>
          <option value="en" style={{ background: '#0f0f1a', color: '#fff' }}>EN</option>
          <option value="tr" style={{ background: '#0f0f1a', color: '#fff' }}>TR</option>
          <option value="es" style={{ background: '#0f0f1a', color: '#fff' }}>ES</option>
        </select>
      </div>

      <HeroSection onStart={handleStart} locale={locale} />
      <HowItWorks locale={locale} />
      <FeaturesGrid locale={locale} />
      <LevelTimeline locale={locale} />
      <BottomCTA onStart={handleStart} locale={locale} />

      <footer className="py-8 border-t border-white/4">
        <div className="max-w-md mx-auto px-5 flex flex-col items-center gap-3">
          <div className="flex gap-4 text-xs">
            <a href="/app/privacy" className="text-white/30 hover:text-white/60 transition-colors">
              {locale === 'de' ? 'Datenschutz' : 'Privacy'}
            </a>
            <a href="/app/privacy" className="text-white/30 hover:text-white/60 transition-colors">
              {locale === 'de' ? 'Impressum' : 'Legal'}
            </a>
            <a href="/app/faq" className="text-white/30 hover:text-white/60 transition-colors">
              FAQ
            </a>
            <a href="/app/sponsors" className="text-white/30 hover:text-white/60 transition-colors">
              {locale === 'de' ? 'Sponsoren' : 'Sponsors'}
            </a>
          </div>
          <a href="https://tbai.cloud" target="_blank" rel="noopener noreferrer" className="opacity-30 hover:opacity-60 transition-opacity">
            <img src="/tbai-cloud-logo.png" alt="tbai" className="h-6 mx-auto" />
          </a>
          <p className="text-white/15 text-xs">
            © {new Date().getFullYear()} AI-Shift Happens by tbai
          </p>
        </div>
      </footer>

      {/* Geheimeingang: nur für Admin sichtbar wenn man weiß wo man hinschauen muss */}
      <button
        onClick={handleSecretEntry}
        aria-hidden="true"
        tabIndex={-1}
        className="fixed bottom-4 right-5 z-50 w-6 h-6 rounded-full border border-white/10 bg-transparent opacity-10 hover:opacity-40 transition-opacity flex items-center justify-center"
        style={{ cursor: 'default' }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4" stroke="white" strokeWidth="1" strokeOpacity="0.8"/>
          <polygon points="4,3 7,5 4,7" fill="white" fillOpacity="0.8"/>
        </svg>
      </button>
    </div>
  )
}

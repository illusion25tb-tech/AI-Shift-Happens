import { useNavigate } from 'react-router-dom'
import { useLocale } from '../hooks/useLocale'
import HeroSection from '../components/landing/HeroSection'
import HowItWorks from '../components/landing/HowItWorks'
import FeaturesGrid from '../components/landing/FeaturesGrid'
import LevelTimeline from '../components/landing/LevelTimeline'
import BottomCTA from '../components/landing/BottomCTA'

export function LandingPage() {
  const navigate = useNavigate()
  const { locale, setLocale } = useLocale()

  const handleStart = () => navigate('/login')

  return (
    <div className="bg-bg-base text-text-primary font-sans">
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setLocale(locale === 'de' ? 'en' : 'de')}
          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-colors backdrop-blur-sm"
        >
          {locale === 'de' ? '🇬🇧 EN' : '🇩🇪 DE'}
        </button>
      </div>

      <HeroSection onStart={handleStart} locale={locale} />
      <HowItWorks locale={locale} />
      <FeaturesGrid locale={locale} />
      <LevelTimeline locale={locale} />
      <BottomCTA onStart={handleStart} locale={locale} />

      <footer className="py-8 border-t border-white/4">
        <div className="max-w-md mx-auto px-5 flex flex-col items-center gap-3">
          <div className="flex gap-4 text-xs">
            <a href="/mindset-shift/app/privacy" className="text-white/30 hover:text-white/60 transition-colors">
              {locale === 'de' ? 'Datenschutz' : 'Privacy'}
            </a>
            <a href="/mindset-shift/app/privacy" className="text-white/30 hover:text-white/60 transition-colors">
              {locale === 'de' ? 'Impressum' : 'Legal'}
            </a>
            <a href="/mindset-shift/app/faq" className="text-white/30 hover:text-white/60 transition-colors">
              FAQ
            </a>
          </div>
          <p className="text-white/15 text-xs">
            © {new Date().getFullYear()} AI-Shift Happens by tbai · contact@tbai.cloud
          </p>
        </div>
      </footer>
    </div>
  )
}

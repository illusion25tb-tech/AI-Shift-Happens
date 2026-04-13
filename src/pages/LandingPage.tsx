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

      <footer className="text-center py-6 text-xs text-white/15 border-t border-white/4">
        © {new Date().getFullYear()} AI-Shift Happens by tbai
      </footer>
    </div>
  )
}

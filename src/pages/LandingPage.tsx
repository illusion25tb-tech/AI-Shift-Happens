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
        <select
          value={locale}
          onChange={e => setLocale(e.target.value as any)}
          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-colors backdrop-blur-sm cursor-pointer"
        >
          <option value="de">DE</option>
          <option value="en">EN</option>
          <option value="tr">TR</option>
          <option value="es">ES</option>
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
            <a href="/mindset-shift/app/privacy" className="text-white/30 hover:text-white/60 transition-colors">
              {locale === 'de' ? 'Datenschutz' : 'Privacy'}
            </a>
            <a href="/mindset-shift/app/privacy" className="text-white/30 hover:text-white/60 transition-colors">
              {locale === 'de' ? 'Impressum' : 'Legal'}
            </a>
            <a href="/mindset-shift/app/faq" className="text-white/30 hover:text-white/60 transition-colors">
              FAQ
            </a>
            <a href="/mindset-shift/app/sponsors" className="text-white/30 hover:text-white/60 transition-colors">
              {locale === 'de' ? 'Sponsoren' : 'Sponsors'}
            </a>
          </div>
          <a href="https://tbai.cloud" target="_blank" rel="noopener noreferrer" className="opacity-30 hover:opacity-60 transition-opacity">
            <img src="/mindset-shift/tbai-cloud-logo.png" alt="tbai" className="h-6 mx-auto" />
          </a>
          <p className="text-white/15 text-xs">
            © {new Date().getFullYear()} AI-Shift Happens by tbai
          </p>
        </div>
      </footer>
    </div>
  )
}

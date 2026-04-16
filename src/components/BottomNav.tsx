import { useLocation, Link } from 'react-router-dom'
import type { Locale } from '../types'

interface NavItem {
  path: string
  emoji: string
  label: Record<Locale, string>
}

const NAV_ITEMS: NavItem[] = [
  { path: '/app', emoji: '🏠', label: { de: 'Home', en: 'Home' } },
  { path: '/app/daily', emoji: '🧠', label: { de: 'Quiz', en: 'Quiz' } },
  { path: '/app/leaderboard', emoji: '🏆', label: { de: 'Ranking', en: 'Ranking' } },
  { path: '/app/stats', emoji: '📊', label: { de: 'Stats', en: 'Stats' } },
  { path: '/app/profile', emoji: '👤', label: { de: 'Profil', en: 'Profile' } },
]

export default function BottomNav({ locale }: { locale: Locale }) {
  const location = useLocation()

  // Only show on /app/* routes, not on landing/login
  if (!location.pathname.startsWith('/app')) return null

  // Hide during quiz play (feedback/playing states)
  const hideOn = ['/app/daily', '/app/freeplay', '/app/challenge']
  if (hideOn.some(p => location.pathname === p)) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bg-base/95 backdrop-blur-sm border-t border-white/6 safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around py-1.5">
        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                isActive ? 'text-primary' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <span className={`text-lg ${isActive ? '' : 'grayscale opacity-60'}`}>{item.emoji}</span>
              <span className="text-[10px] font-semibold">{item.label[locale]}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

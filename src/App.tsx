import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { registerServiceWorker, scheduleLocalReminder, isReminderEnabled } from './lib/notifications'
import { useLocale } from './hooks/useLocale'
import CookieConsent from './components/CookieConsent'
import ErrorBoundary from './components/ErrorBoundary'

// Eager: landing + dashboard (first paint)
import { LandingPage } from './pages/LandingPage'
import AuthScreen from './components/AuthScreen'
import { DashboardPage } from './pages/DashboardPage'

// Lazy: everything else
const DailyQuizPage = lazy(() => import('./pages/DailyQuizPage').then(m => ({ default: m.DailyQuizPage })))
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const FaqPage = lazy(() => import('./pages/FaqPage').then(m => ({ default: m.FaqPage })))
const FreePlayPage = lazy(() => import('./pages/FreePlayPage').then(m => ({ default: m.FreePlayPage })))
const ChallengePage = lazy(() => import('./pages/ChallengePage').then(m => ({ default: m.ChallengePage })))
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })))
const TeamPage = lazy(() => import('./pages/TeamPage').then(m => ({ default: m.TeamPage })))
const StatsPage = lazy(() => import('./pages/StatsPage').then(m => ({ default: m.StatsPage })))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })))

function Loading() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <div className="text-text-muted animate-pulse">Loading...</div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function LoginPage() {
  const { user } = useAuth()
  if (user) return <Navigate to="/app" replace />
  return <AuthScreen />
}

export default function App() {
  const { locale } = useLocale()

  useEffect(() => {
    registerServiceWorker()
    if (isReminderEnabled()) scheduleLocalReminder()
  }, [])

  return (
    <ErrorBoundary>
    <BrowserRouter basename="/mindset-shift">
      <div className="min-h-screen bg-bg-base text-text-primary font-sans">
        <CookieConsent locale={locale} />
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/app" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/app/daily" element={<ProtectedRoute><DailyQuizPage /></ProtectedRoute>} />
            <Route path="/app/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
            <Route path="/app/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/app/freeplay" element={<ProtectedRoute><FreePlayPage /></ProtectedRoute>} />
            <Route path="/app/challenge" element={<ProtectedRoute><ChallengePage /></ProtectedRoute>} />
            <Route path="/app/faq" element={<ProtectedRoute><FaqPage /></ProtectedRoute>} />
            <Route path="/app/team" element={<ProtectedRoute><TeamPage /></ProtectedRoute>} />
            <Route path="/app/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
            <Route path="/app/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
            <Route path="/app/privacy" element={<PrivacyPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
    </ErrorBoundary>
  )
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { LandingPage } from './pages/LandingPage'
import AuthScreen from './components/AuthScreen'
import { DashboardPage } from './pages/DashboardPage'
import { DailyQuizPage } from './pages/DailyQuizPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { ProfilePage } from './pages/ProfilePage'
import { FaqPage } from './pages/FaqPage'
import { FreePlayPage } from './pages/FreePlayPage'
import { ChallengePage } from './pages/ChallengePage'
import { AdminPage } from './pages/AdminPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <div className="text-text-muted animate-pulse">Loading...</div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function LoginPage() {
  const { user } = useAuth()
  if (user) return <Navigate to="/app" replace />
  return <AuthScreen />
}

export default function App() {
  return (
    <BrowserRouter basename="/mindset-shift">
      <div className="min-h-screen bg-bg-base text-text-primary font-sans">
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
          <Route path="/app/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

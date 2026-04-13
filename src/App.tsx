import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AuthScreen from './components/AuthScreen'
import { DashboardPage } from './pages/DashboardPage'
import { DailyQuizPage } from './pages/DailyQuizPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { ProfilePage } from './pages/ProfilePage'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-text-muted animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!user) return <AuthScreen />

  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/daily" element={<DailyQuizPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/mindset-shift">
      <div className="min-h-screen bg-bg-base text-text-primary font-sans">
        <AppRoutes />
      </div>
    </BrowserRouter>
  )
}

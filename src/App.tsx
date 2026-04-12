import { BrowserRouter } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AuthScreen from './components/AuthScreen'

function AppContent() {
  const { user, profile, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <AuthScreen />
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans flex flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold">AI-Shift Happens</h1>
      <p className="text-text-secondary">
        Willkommen, {profile?.display_name ?? user.email}
      </p>
      <button
        onClick={signOut}
        className="bg-bg-card border border-bg-card-border text-text-primary px-6 py-2 rounded-xl hover:bg-bg-accent transition-colors"
      >
        Abmelden
      </button>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/mindset-shift">
      <AppContent />
    </BrowserRouter>
  )
}

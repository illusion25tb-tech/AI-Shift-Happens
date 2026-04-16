import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'
import { supabase } from '../lib/supabase'

export default function AuthScreen() {
  const { signInWithGoogle, signInWithLinkedIn, signInWithEmail, signUpWithEmail } = useAuth()
  const { locale, t } = useLocale()

  const [isSignUp, setIsSignUp] = useState(false)
  const [showForgotPw, setShowForgotPw] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setSubmitting(true)
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password)
        setSuccessMessage(t('auth.emailVerification'))
      } else {
        await signInWithEmail(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🧠</div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">AI-Shift Happens</h1>
          <p className="text-text-secondary">{t('auth.tagline')}</p>
        </div>

        {/* Card */}
        <div className="bg-bg-card border border-bg-card-border rounded-2xl p-6 space-y-4">

          {/* Google Button */}
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            {t('auth.signInWithGoogle')}
          </button>

          {/* LinkedIn Button */}
          <button
            onClick={signInWithLinkedIn}
            className="w-full flex items-center justify-center gap-3 font-semibold py-3 px-4 rounded-xl transition-colors text-white"
            style={{ backgroundColor: '#0A66C2' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#004182')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0A66C2')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            {t('auth.signInWithLinkedIn')}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-bg-card-border"></div>
            <span className="text-text-muted text-sm">{t('auth.orWithEmail')}</span>
            <div className="flex-1 h-px bg-bg-card-border"></div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              required
              className="w-full bg-bg-mid border border-bg-card-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
              required
              className="w-full bg-bg-mid border border-bg-card-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
            />

            {error && (
              <p className="text-danger text-sm">{error}</p>
            )}

            {successMessage && (
              <p className="text-success text-sm">{successMessage}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              {submitting
                ? t('auth.submitting')
                : isSignUp
                ? t('auth.signUp')
                : t('auth.signIn')}
            </button>
          </form>

          {/* Forgot password */}
          {!isSignUp && !showForgotPw && (
            <button
              onClick={() => setShowForgotPw(true)}
              className="text-xs text-text-muted hover:text-primary transition-colors w-full text-center"
            >
              {locale === 'de' ? 'Passwort vergessen?' : 'Forgot password?'}
            </button>
          )}

          {showForgotPw && (
            <div className="bg-bg-mid border border-bg-card-border rounded-xl p-4 space-y-2">
              <p className="text-xs text-text-secondary">
                {locale === 'de'
                  ? 'E-Mail eingeben — du bekommst einen Link zum Zurücksetzen.'
                  : 'Enter your email — you will receive a reset link.'}
              </p>
              <button
                onClick={async () => {
                  if (!email) { setError(locale === 'de' ? 'Bitte E-Mail eingeben' : 'Please enter email'); return }
                  setSubmitting(true)
                  const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/mindset-shift/app/profile',
                  })
                  setSubmitting(false)
                  if (resetErr) { setError(resetErr.message) }
                  else {
                    setSuccessMessage(locale === 'de' ? 'Reset-Link gesendet!' : 'Reset link sent!')
                    setShowForgotPw(false)
                  }
                }}
                disabled={submitting}
                className="w-full bg-primary/20 text-primary font-semibold py-2 rounded-lg text-sm hover:bg-primary/30 transition-colors disabled:opacity-50"
              >
                {submitting ? '...' : (locale === 'de' ? 'Reset-Link senden' : 'Send reset link')}
              </button>
            </div>
          )}

          {/* Toggle */}
          <p className="text-center text-text-secondary text-sm">
            {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.noAccount')}{' '}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccessMessage(null); setShowForgotPw(false) }}
              className="text-primary hover:text-primary-hover underline transition-colors"
            >
              {isSignUp ? t('auth.signIn') : t('auth.signUp')}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

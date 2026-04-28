import { useState, useEffect } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'
import { setSentryUser, clearSentryUser } from '../lib/sentry'

interface UseAuthReturn {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithLinkedIn: () => Promise<void>
  signInWithApple: () => Promise<void>
  signInWithMicrosoft: () => Promise<void>
  signInWithMagicLink: (email: string) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const REDIRECT_URL = window.location.origin + import.meta.env.BASE_URL + 'app'

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data as Profile
}

// Wenn der User vor dem Login auf der Landing eine Sprache gewählt hat
// (localStorage.locale gesetzt) und das vom Profile abweicht, wird das Profile
// nachgeführt. Damit gewinnt die User-Wahl gegen den Default 'de' aus dem
// handle_new_user-Trigger und get-daily-quiz liefert Fragen in der richtigen Sprache.
function syncLocaleToProfile(userId: string, profile: Profile | null) {
  if (!profile) return
  const chosen = localStorage.getItem('locale')
  if (!chosen || chosen === profile.locale) return
  if (!['de', 'en', 'tr', 'es'].includes(chosen)) return
  supabase.from('profiles').update({ locale: chosen }).eq('id', userId).then(() => {})
}

export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let initDone = false

    // Safety-Net: nach 8s spätestens Loading=false, damit App nicht ewig hängt
    const safetyTimer = setTimeout(() => {
      if (mounted && !initDone) {
        initDone = true
        setLoading(false)
      }
    }, 8000)

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          setSentryUser({ id: session.user.id, email: session.user.email })
          const p = await fetchProfile(session.user.id)
          if (!mounted) return
          setProfile(p)
          syncLocaleToProfile(session.user.id, p)
        }
      } finally {
        if (mounted) {
          initDone = true
          setLoading(false)
        }
      }
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          setSentryUser({ id: session.user.id, email: session.user.email })
          const p = await fetchProfile(session.user.id)
          if (!mounted) return
          setProfile(p)
          syncLocaleToProfile(session.user.id, p)

          // Auto-claim referral after signup
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            const refCode = localStorage.getItem('shift-happens-referral')
            if (refCode && p && !p.invited_by) {
              supabase.functions.invoke('claim-referral', {
                body: { invite_code: refCode },
                headers: session.access_token
                  ? { Authorization: `Bearer ${session.access_token}` }
                  : undefined,
              }).then(() => {
                localStorage.removeItem('shift-happens-referral')
              }).catch(() => {})
            }
          }
        } else {
          setProfile(null)
          clearSentryUser()
        }
        if (mounted) {
          initDone = true
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(safetyTimer)
      subscription.unsubscribe()
    }
  }, [])

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: REDIRECT_URL },
    })
  }

  const signInWithLinkedIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: { redirectTo: REDIRECT_URL },
    })
  }

  const signInWithApple = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: REDIRECT_URL },
    })
  }

  const signInWithMicrosoft = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: REDIRECT_URL,
        scopes: 'openid email profile',
      },
    })
  }

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: REDIRECT_URL },
    })
    if (error) throw error
  }

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: REDIRECT_URL },
    })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return {
    session,
    user,
    profile,
    loading,
    signInWithGoogle,
    signInWithLinkedIn,
    signInWithApple,
    signInWithMicrosoft,
    signInWithMagicLink,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  }
}

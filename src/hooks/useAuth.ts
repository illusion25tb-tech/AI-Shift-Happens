import { useState, useEffect } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface UseAuthReturn {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithLinkedIn: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const REDIRECT_URL = window.location.origin + '/mindset-shift/'

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

export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        try {
          const p = await fetchProfile(session.user.id)
          setProfile(p)
        } catch (e) {
          console.error('Profile fetch failed:', e)
        }
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          const p = await fetchProfile(session.user.id)
          setProfile(p)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
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
    signInWithEmail,
    signUpWithEmail,
    signOut,
  }
}

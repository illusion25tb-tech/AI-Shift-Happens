import { useState, useCallback, useEffect } from 'react'
import type { LeaderboardEntry } from '../types'

type Tab = 'weekly' | 'alltime' | 'halloffame'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

interface UseLeaderboardReturn {
  tab: Tab
  entries: LeaderboardEntry[]
  loading: boolean
  error: string | null
  weekStart: string | null
  setTab: (tab: Tab) => void
}

export function useLeaderboard(): UseLeaderboardReturn {
  const [tab, setTabState] = useState<Tab>('weekly')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [weekStart, setWeekStart] = useState<string | null>(null)

  const loadTab = useCallback(async (t: Tab) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/get-leaderboard?tab=${t}`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setEntries(data.entries ?? [])
      setWeekStart(data.week_start ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  const setTab = useCallback((t: Tab) => {
    setTabState(t)
    loadTab(t)
  }, [loadTab])

  useEffect(() => { loadTab('weekly') }, [loadTab])

  return { tab, entries, loading, error, weekStart, setTab }
}

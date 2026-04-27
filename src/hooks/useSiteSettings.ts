import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Globaler Module-Cache: Settings sind site-wide identisch und aendern sich
// selten — eine Tab-Lifetime-Cache reicht. Verschiedene Components teilen
// sich den selben fetch.
let cache: Record<string, unknown> | null = null
let inflight: Promise<Record<string, unknown>> | null = null

async function loadSettings(): Promise<Record<string, unknown>> {
  const { data } = await supabase.from('site_settings').select('key, value')
  const map: Record<string, unknown> = {}
  for (const row of data ?? []) map[row.key] = row.value
  cache = map
  return map
}

/**
 * Liefert site-wide Feature-Flags / Settings. Beispiel:
 *   const settings = useSiteSettings()
 *   if (settings.linkedin_share_enabled !== false) { ... }
 *
 * `!== false` weil undefined = noch nicht geladen → Feature soll dann an sein
 * (kein Flicker beim ersten Mount).
 */
export function useSiteSettings() {
  const [settings, setSettings] = useState<Record<string, unknown>>(cache ?? {})

  useEffect(() => {
    if (cache) {
      setSettings(cache)
      return
    }
    if (!inflight) inflight = loadSettings().finally(() => { inflight = null })
    inflight.then(s => setSettings(s))
  }, [])

  return settings
}

// Cache invalidieren — nutzt der Admin nach einem set_setting Call,
// damit der naechste useSiteSettings()-Aufruf neu laedt.
export function invalidateSiteSettingsCache() {
  cache = null
}

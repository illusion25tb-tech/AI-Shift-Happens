import type { Locale } from '../types'

export type I18nField = Record<string, string> | null | undefined

/**
 * Liest einen i18n-JSONB-Feldwert mit Locale-Fallback.
 * Reihenfolge: aktuelle Locale → en → de → fallback (alte Single-Locale-Spalte) → ''.
 */
export function getI18nText(
  field: I18nField,
  locale: Locale,
  fallback?: string | null
): string {
  if (field) {
    if (field[locale]) return field[locale]
    if (field.en) return field.en
    if (field.de) return field.de
  }
  return fallback ?? ''
}

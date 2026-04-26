-- Migration: Sponsors & Prizes i18n
-- Created: 2026-04-26
-- Issue #4 from HANDOFF-2026-04-25: Sponsor-Daten i18n via JSONB

-- 1. JSONB-Spalten hinzufuegen (sponsors.description_i18n, prizes.title_i18n + description_i18n)
ALTER TABLE public.sponsors
  ADD COLUMN IF NOT EXISTS description_i18n jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.prizes
  ADD COLUMN IF NOT EXISTS title_i18n jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.prizes
  ADD COLUMN IF NOT EXISTS description_i18n jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. Backfill: existierende Single-Locale-Werte als {de: <wert>} uebernehmen
--    (1:1 Uebernahme inkl. evtl. ASCII-Umlauten — Korrektur erfolgt manuell ueber Admin-UI)
UPDATE public.sponsors
  SET description_i18n = jsonb_build_object('de', description)
  WHERE description IS NOT NULL
    AND description != ''
    AND description_i18n = '{}'::jsonb;

UPDATE public.prizes
  SET title_i18n = jsonb_build_object('de', title)
  WHERE title IS NOT NULL
    AND title != ''
    AND title_i18n = '{}'::jsonb;

UPDATE public.prizes
  SET description_i18n = jsonb_build_object('de', description)
  WHERE description IS NOT NULL
    AND description != ''
    AND description_i18n = '{}'::jsonb;

-- 3. Hinweis-Kommentare fuer alte Spalten (Backwards-Compat-Phase)
COMMENT ON COLUMN public.sponsors.description IS 'DEPRECATED: use description_i18n. Bleibt vorerst als Fallback.';
COMMENT ON COLUMN public.prizes.title IS 'DEPRECATED: use title_i18n. Bleibt vorerst als Fallback.';
COMMENT ON COLUMN public.prizes.description IS 'DEPRECATED: use description_i18n. Bleibt vorerst als Fallback.';

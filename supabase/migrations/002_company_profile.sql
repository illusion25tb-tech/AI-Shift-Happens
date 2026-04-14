-- Migration: Add company_name to profiles for company leaderboard
-- Created: 2026-04-14
-- Description: Adds company_name field with normalized index for deduplication

-- Add company_name column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name text;

-- Normalized index for deduplication: "Siemens", "siemens", " SIEMENS " all match
CREATE INDEX IF NOT EXISTS idx_profiles_company_normalized
  ON public.profiles (lower(trim(company_name)))
  WHERE company_name IS NOT NULL;

-- Index for company leaderboard aggregation
CREATE INDEX IF NOT EXISTS idx_profiles_company_name
  ON public.profiles (company_name)
  WHERE company_name IS NOT NULL;

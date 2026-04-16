-- Migration: Security hardening
-- Created: 2026-04-16

-- is_admin column (was added via Management API, now in migration for reproducibility)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- team_role column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS team_role text DEFAULT 'member'
  CHECK (team_role IN ('captain', 'admin', 'member'));

-- Prevent duplicate daily quiz submissions
CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_attempts_daily_unique
  ON public.quiz_attempts (user_id, daily_quiz_id)
  WHERE daily_quiz_id IS NOT NULL AND finished_at IS NOT NULL;

-- Prevent double referral claims
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_invited_by_unique
  ON public.profiles (id) WHERE invited_by IS NOT NULL;

-- Restrict profile UPDATE to safe columns only
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (display_name, locale, avatar_url, company_name) ON public.profiles TO authenticated;

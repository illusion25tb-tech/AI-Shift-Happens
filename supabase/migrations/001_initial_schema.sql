-- Supabase Schema Migration: Initial Setup
-- Created: 2026-04-12
-- Description: Creates profiles, questions, quizzes, quiz attempts, scores, badges, and challenges tables with RLS policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================================================

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  locale text NOT NULL DEFAULT 'de' CHECK (locale IN ('de', 'en')),
  level int DEFAULT 1,
  total_xp int DEFAULT 0,
  current_streak int DEFAULT 0,
  longest_streak int DEFAULT 0,
  last_played_at date,
  invite_code text UNIQUE DEFAULT substr(md5(random()::text),1,8),
  invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  team_name text,
  created_at timestamptz DEFAULT now()
);

-- Create index for invite_code lookups
CREATE INDEX idx_profiles_invite_code ON public.profiles(invite_code);
CREATE INDEX idx_profiles_invited_by ON public.profiles(invited_by);

-- ============================================================================
-- 2. TRIGGER: handle_new_user()
-- ============================================================================

CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      ''
    ),
    NEW.raw_user_meta_data->>'avatar_url' OR NEW.raw_user_meta_data->>'picture'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 3. QUESTIONS TABLE
-- ============================================================================

CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id text UNIQUE,
  locale text CHECK (locale IN ('de', 'en')),
  pair_id text,
  category text,
  scenario_text text,
  mindset_tip text,
  options jsonb,
  difficulty int CHECK (difficulty BETWEEN 1 AND 3),
  is_active bool DEFAULT true,
  generated_by text DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_questions_locale_category
  ON public.questions(locale, category)
  WHERE is_active = true;

CREATE INDEX idx_questions_pair_id ON public.questions(pair_id);
CREATE INDEX idx_questions_external_id ON public.questions(external_id);

-- ============================================================================
-- 4. DAILY_QUIZZES TABLE
-- ============================================================================

CREATE TABLE public.daily_quizzes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_date date NOT NULL,
  locale text NOT NULL CHECK (locale IN ('de', 'en')),
  question_ids uuid[] NOT NULL,
  bonus_question_id uuid REFERENCES public.questions(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(quiz_date, locale)
);

-- Index for daily lookups
CREATE INDEX idx_daily_quizzes_date_locale ON public.daily_quizzes(quiz_date, locale);

-- ============================================================================
-- 5. QUIZ_ATTEMPTS TABLE
-- ============================================================================

CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_type text NOT NULL CHECK (quiz_type IN ('daily', 'freeplay', 'challenge')),
  daily_quiz_id uuid REFERENCES public.daily_quizzes(id) ON DELETE SET NULL,
  category text,
  total_score int DEFAULT 0,
  max_streak int DEFAULT 0,
  answers jsonb DEFAULT '[]'::jsonb,
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_quiz_attempts_user_type ON public.quiz_attempts(user_id, quiz_type);
CREATE INDEX idx_quiz_attempts_daily_quiz_user ON public.quiz_attempts(daily_quiz_id, user_id);
CREATE INDEX idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);

-- ============================================================================
-- 6. WEEKLY_SCORES TABLE
-- ============================================================================

CREATE TABLE public.weekly_scores (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  daily_scores jsonb DEFAULT '{}'::jsonb,
  total_score int DEFAULT 0,
  rank int,
  is_champion bool DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Index for leaderboard queries
CREATE INDEX idx_weekly_scores_week_total ON public.weekly_scores(week_start, total_score DESC);
CREATE INDEX idx_weekly_scores_user_week ON public.weekly_scores(user_id, week_start);

-- ============================================================================
-- 7. USER_BADGES TABLE
-- ============================================================================

CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_type text NOT NULL,
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

-- Index for badge lookups
CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);

-- ============================================================================
-- 8. CHALLENGES TABLE
-- ============================================================================

CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenger_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_ids uuid[] NOT NULL,
  challenger_score int,
  challenged_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenged_score int,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Indexes for challenge lookups
CREATE INDEX idx_challenges_challenger_id ON public.challenges(challenger_id);
CREATE INDEX idx_challenges_challenged_id ON public.challenges(challenged_id);
CREATE INDEX idx_challenges_created_at ON public.challenges(created_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES RLS
-- ============================================================================

-- Everyone can view all profiles (public leaderboard)
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (via trigger, but explicit for safety)
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- QUESTIONS RLS
-- ============================================================================

-- Authenticated users can view questions
CREATE POLICY "questions_select_authenticated"
  ON public.questions FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- DAILY_QUIZZES RLS
-- ============================================================================

-- Authenticated users can view daily quizzes
CREATE POLICY "daily_quizzes_select_authenticated"
  ON public.daily_quizzes FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- QUIZ_ATTEMPTS RLS
-- ============================================================================

-- Users can view their own quiz attempts
CREATE POLICY "quiz_attempts_select_own"
  ON public.quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own quiz attempts
CREATE POLICY "quiz_attempts_insert_own"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own quiz attempts
CREATE POLICY "quiz_attempts_update_own"
  ON public.quiz_attempts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- WEEKLY_SCORES RLS
-- ============================================================================

-- Everyone can view weekly scores (public leaderboard)
CREATE POLICY "weekly_scores_select_all"
  ON public.weekly_scores FOR SELECT
  USING (true);

-- ============================================================================
-- USER_BADGES RLS
-- ============================================================================

-- Everyone can view user badges
CREATE POLICY "user_badges_select_all"
  ON public.user_badges FOR SELECT
  USING (true);

-- ============================================================================
-- CHALLENGES RLS
-- ============================================================================

-- Challenge participants can view challenges
CREATE POLICY "challenges_select_participants"
  ON public.challenges FOR SELECT
  USING (
    auth.uid() = challenger_id
    OR auth.uid() = challenged_id
  );

-- Authenticated users can insert challenges (with their own challenger_id)
CREATE POLICY "challenges_insert_authenticated"
  ON public.challenges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = challenger_id);

-- Challenge participants can update challenges
CREATE POLICY "challenges_update_participants"
  ON public.challenges FOR UPDATE
  USING (
    auth.uid() = challenger_id
    OR auth.uid() = challenged_id
  )
  WITH CHECK (
    auth.uid() = challenger_id
    OR auth.uid() = challenged_id
  );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Anonymous users can only view public data
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.weekly_scores TO anon;
GRANT SELECT ON public.user_badges TO anon;

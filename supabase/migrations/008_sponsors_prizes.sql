-- Migration: Sponsors & Prizes
-- Created: 2026-04-16

CREATE TABLE IF NOT EXISTS public.sponsors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  logo_url text,
  website_url text,
  description text,
  tier text DEFAULT 'standard' CHECK (tier IN ('gold', 'silver', 'standard')),
  is_active boolean DEFAULT true,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prizes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sponsor_id uuid REFERENCES public.sponsors(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  image_url text,
  prize_type text DEFAULT 'weekly' CHECK (prize_type IN ('weekly', 'monthly', 'special')),
  value_eur numeric,
  week_start date,
  month_start date,
  winner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimed boolean DEFAULT false,
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY sponsors_select_all ON public.sponsors FOR SELECT USING (true);
CREATE POLICY prizes_select_all ON public.prizes FOR SELECT USING (true);
GRANT SELECT ON public.sponsors TO anon, authenticated;
GRANT ALL ON public.sponsors TO authenticated;
GRANT ALL ON public.prizes TO authenticated;

CREATE INDEX IF NOT EXISTS idx_sponsors_active ON public.sponsors (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_prizes_type_week ON public.prizes (prize_type, week_start);
CREATE INDEX IF NOT EXISTS idx_prizes_winner ON public.prizes (winner_id) WHERE winner_id IS NOT NULL;

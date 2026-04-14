-- Migration: Teams for Team Battles
-- Created: 2026-04-14

CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  invite_code text UNIQUE DEFAULT substr(md5(random()::text),1,6),
  captain_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teams_invite_code ON public.teams(invite_code);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON public.profiles(team_id) WHERE team_id IS NOT NULL;

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY teams_select_all ON public.teams FOR SELECT USING (true);
CREATE POLICY teams_insert_auth ON public.teams FOR INSERT TO authenticated WITH CHECK (auth.uid() = captain_id);
GRANT ALL ON public.teams TO authenticated;
GRANT SELECT ON public.teams TO anon;

-- 010: Team Battles — Team vs Team Challenges
CREATE TABLE IF NOT EXISTS team_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  challenged_team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  challenger_score int DEFAULT 0,
  challenged_score int DEFAULT 0,
  winner_team_id uuid REFERENCES teams(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(challenger_team_id, challenged_team_id, week_start)
);

-- RLS
ALTER TABLE team_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_challenges_select" ON team_challenges FOR SELECT USING (true);
CREATE POLICY "team_challenges_insert" ON team_challenges FOR INSERT WITH CHECK (true);
CREATE POLICY "team_challenges_update" ON team_challenges FOR UPDATE USING (true);

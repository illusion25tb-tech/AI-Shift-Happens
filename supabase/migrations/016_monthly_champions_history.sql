-- Migration: Monthly Champions History
-- Created: 2026-04-28
--
-- Bug-Fix: run_monthly_champion() vergibt das Badge ON CONFLICT DO NOTHING,
-- daher wird ein Mehrfach-Champion nur 1× gezaehlt. Wir fuehren eine
-- monthly_champions Tabelle ein (analog weekly_scores.is_champion), damit die
-- History korrekt ist und Hall-of-Fame "X-facher Sieger" zeigen kann.

CREATE TABLE IF NOT EXISTS public.monthly_champions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month_start date NOT NULL,
  total_score int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (month_start)
);

CREATE INDEX IF NOT EXISTS idx_monthly_champions_user ON public.monthly_champions(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_champions_month ON public.monthly_champions(month_start DESC);

ALTER TABLE public.monthly_champions ENABLE ROW LEVEL SECURITY;
CREATE POLICY monthly_champions_select_all ON public.monthly_champions FOR SELECT USING (true);
GRANT SELECT ON public.monthly_champions TO anon, authenticated;
GRANT ALL ON public.monthly_champions TO service_role;

-- Cron-Function aktualisieren: schreibt jetzt auch in monthly_champions.
-- Das Badge bleibt zusaetzlich als Profil-Auszeichnung (User sieht es im
-- Profile-Badge-Grid einmalig — Mehrfach-Wins zeigt die Hall of Fame).
CREATE OR REPLACE FUNCTION public.run_monthly_champion()
RETURNS void AS $fn$
DECLARE
  v_month_start date;
  v_month_end date;
  v_champion RECORD;
BEGIN
  v_month_start := date_trunc('month', CURRENT_DATE - interval '1 month')::date;
  v_month_end := (date_trunc('month', CURRENT_DATE) - interval '1 day')::date;

  SELECT ws.user_id, SUM(ws.total_score)::int as total
  INTO v_champion
  FROM weekly_scores ws
  WHERE ws.week_start >= v_month_start
    AND ws.week_start <= v_month_end
  GROUP BY ws.user_id
  ORDER BY total DESC
  LIMIT 1;

  IF v_champion IS NULL THEN RETURN; END IF;

  -- Neu: History persistieren (multi-win-fest)
  INSERT INTO public.monthly_champions (user_id, month_start, total_score)
  VALUES (v_champion.user_id, v_month_start, v_champion.total)
  ON CONFLICT (month_start) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        total_score = EXCLUDED.total_score;

  -- Badge bleibt single-grant (das Profil zeigt 1× das Badge, die Hall of
  -- Fame zaehlt die echten Siege)
  INSERT INTO public.user_badges (user_id, badge_type)
  VALUES (v_champion.user_id, 'monthly_champion')
  ON CONFLICT (user_id, badge_type) DO NOTHING;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER;

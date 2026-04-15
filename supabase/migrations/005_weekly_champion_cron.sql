-- Migration: Weekly Champion auto-ranking via pg_cron
-- Created: 2026-04-15
-- Schedule: Every Monday 00:10 UTC (02:10 CEST)

CREATE OR REPLACE FUNCTION public.run_weekly_champion()
RETURNS void AS $fn$
DECLARE
  v_week_start date;
  v_scores RECORD;
  v_rank int := 0;
  v_champion_id uuid;
BEGIN
  v_week_start := date_trunc('week', CURRENT_DATE - interval '7 days')::date;

  v_rank := 0;
  FOR v_scores IN
    SELECT id, user_id, total_score
    FROM weekly_scores
    WHERE week_start = v_week_start
    ORDER BY total_score DESC
  LOOP
    v_rank := v_rank + 1;
    UPDATE weekly_scores SET rank = v_rank, is_champion = (v_rank = 1)
    WHERE id = v_scores.id;

    IF v_rank = 1 THEN
      v_champion_id := v_scores.user_id;
    END IF;
  END LOOP;

  IF v_champion_id IS NOT NULL THEN
    INSERT INTO user_badges (user_id, badge_type)
    VALUES (v_champion_id, 'weekly_champion')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT cron.schedule('weekly-champion', '10 0 * * 1', 'SELECT public.run_weekly_champion()');

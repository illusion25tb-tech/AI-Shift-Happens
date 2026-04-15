-- Migration: Monthly Champion auto-ranking via pg_cron
-- Created: 2026-04-15
-- Schedule: 1st of each month at 00:15 UTC

CREATE OR REPLACE FUNCTION public.run_monthly_champion()
RETURNS void AS $fn$
DECLARE
  v_month_start date;
  v_month_end date;
  v_champion RECORD;
BEGIN
  v_month_start := date_trunc('month', CURRENT_DATE - interval '1 month')::date;
  v_month_end := (date_trunc('month', CURRENT_DATE) - interval '1 day')::date;

  SELECT ws.user_id, SUM(ws.total_score) as total
  INTO v_champion
  FROM weekly_scores ws
  WHERE ws.week_start >= v_month_start
    AND ws.week_start <= v_month_end
  GROUP BY ws.user_id
  ORDER BY total DESC
  LIMIT 1;

  IF v_champion IS NULL THEN RETURN; END IF;

  INSERT INTO user_badges (user_id, badge_type)
  VALUES (v_champion.user_id, 'monthly_champion')
  ON CONFLICT (user_id, badge_type) DO NOTHING;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT cron.schedule('monthly-champion', '15 0 1 * *', 'SELECT public.run_monthly_champion()');

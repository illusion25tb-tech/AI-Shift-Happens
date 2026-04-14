-- Migration: Auto-generate daily quizzes via pg_cron
-- Created: 2026-04-14
-- Schedule: Mo-Fr 00:05 UTC (02:05 CEST)

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

CREATE OR REPLACE FUNCTION public.create_daily_quiz_auto()
RETURNS void AS $$
DECLARE
  v_date date := CURRENT_DATE;
  v_dow int := EXTRACT(DOW FROM CURRENT_DATE);
  v_locale text;
  v_qids uuid[];
  v_bonus uuid;
  v_exists boolean;
BEGIN
  -- Skip weekends (0=Sun, 6=Sat)
  IF v_dow IN (0, 6) THEN RETURN; END IF;

  FOREACH v_locale IN ARRAY ARRAY['de', 'en']
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM daily_quizzes WHERE quiz_date = v_date AND locale = v_locale
    ) INTO v_exists;

    IF v_exists THEN CONTINUE; END IF;

    -- Pick 3 random active questions
    SELECT array_agg(id) INTO v_qids
    FROM (
      SELECT id FROM questions
      WHERE locale = v_locale AND is_active = true
      ORDER BY random() LIMIT 3
    ) sub;

    -- Pick 1 bonus question (not in main set)
    SELECT id INTO v_bonus
    FROM questions
    WHERE locale = v_locale AND is_active = true
      AND id != ALL(COALESCE(v_qids, ARRAY[]::uuid[]))
    ORDER BY random() LIMIT 1;

    IF array_length(v_qids, 1) >= 3 THEN
      INSERT INTO daily_quizzes (quiz_date, locale, question_ids, bonus_question_id)
      VALUES (v_date, v_locale, v_qids, v_bonus);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule: Mo-Fr at 00:05 UTC
SELECT cron.schedule(
  'create-daily-quiz',
  '5 0 * * 1-5',
  'SELECT public.create_daily_quiz_auto()'
);

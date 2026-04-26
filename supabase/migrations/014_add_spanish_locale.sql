-- Migration: Add Spanish (es) locale support
-- Created: 2026-04-26
-- Migration 012 hatte tr hinzugefügt aber nicht es. Damit User die 'es' wählen
-- können und get-daily-quiz nicht crasht, muss der CHECK-Constraint erweitert werden.

ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_locale_check;
ALTER TABLE questions ADD CONSTRAINT questions_locale_check CHECK (locale IN ('de', 'en', 'tr', 'es'));

ALTER TABLE daily_quizzes DROP CONSTRAINT IF EXISTS daily_quizzes_locale_check;
ALTER TABLE daily_quizzes ADD CONSTRAINT daily_quizzes_locale_check CHECK (locale IN ('de', 'en', 'tr', 'es'));

ALTER TABLE email_log DROP CONSTRAINT IF EXISTS email_log_locale_check;
ALTER TABLE email_log ADD CONSTRAINT email_log_locale_check CHECK (locale IN ('de', 'en', 'tr', 'es'));

-- Diagnose-Query: Aktuelle Frage-Verteilung pro Locale
SELECT locale, count(*) as count
FROM questions
GROUP BY locale
ORDER BY locale;

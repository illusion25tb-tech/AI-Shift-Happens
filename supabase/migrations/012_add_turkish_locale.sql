-- Add Turkish locale support
ALTER TABLE questions DROP CONSTRAINT questions_locale_check;
ALTER TABLE questions ADD CONSTRAINT questions_locale_check CHECK (locale IN ('de', 'en', 'tr'));

-- Also update daily_quizzes and email_log if they have locale constraints
ALTER TABLE daily_quizzes DROP CONSTRAINT IF EXISTS daily_quizzes_locale_check;
ALTER TABLE daily_quizzes ADD CONSTRAINT daily_quizzes_locale_check CHECK (locale IN ('de', 'en', 'tr'));

ALTER TABLE email_log DROP CONSTRAINT IF EXISTS email_log_locale_check;
ALTER TABLE email_log ADD CONSTRAINT email_log_locale_check CHECK (locale IN ('de', 'en', 'tr'));

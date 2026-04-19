-- 009: Confidence Betting + SHIFT Buddy + Bullshit-Detektor
-- Ersetzt Speed-Bonus durch Confidence-basiertes Scoring

-- SHIFT-Mode auf Profil (serious = Mentor, cheeky = frecher Buddy)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS shift_mode text NOT NULL DEFAULT 'cheeky';

-- Bullshit-Trap Flag auf Fragen
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS is_bullshit_trap boolean NOT NULL DEFAULT false;

-- Check constraint fuer shift_mode
ALTER TABLE profiles
  ADD CONSTRAINT profiles_shift_mode_check CHECK (shift_mode IN ('serious', 'cheeky'));

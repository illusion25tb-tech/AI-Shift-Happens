export interface QuizOption {
  text: string
  score: number
  feedbackText: string
}

export interface Question {
  id: string
  external_id: string
  locale: 'de' | 'en'
  pair_id: string | null
  category: string
  scenario_text: string
  mindset_tip: string
  options: QuizOption[]
  difficulty: 1 | 2 | 3
}

export interface QuestionForClient {
  id: string
  category: string
  scenario_text: string
  options: { text: string; index: number }[]
  is_bonus: boolean
}

export interface AnswerResult {
  question_id: string
  selected_index: number
  base_score: number
  streak_multi: number
  speed_bonus: number
  bonus_multi: number
  total_score: number
  feedback_text: string
  mindset_tip: string
  is_correct: boolean
  is_dangerous: boolean
}

export interface QuizAttempt {
  id: string
  user_id: string
  quiz_type: 'daily' | 'freeplay' | 'challenge'
  daily_quiz_id: string | null
  category: string | null
  total_score: number
  max_streak: number
  answers: AnswerResult[]
  started_at: string
  finished_at: string | null
}

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  locale: 'de' | 'en'
  level: number
  total_xp: number
  current_streak: number
  longest_streak: number
  last_played_at: string | null
  invite_code: string
  team_name: string | null
}

export type Locale = 'de' | 'en'

export type GameState =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'feedback'
  | 'finished'
  | 'error'

export interface Badge {
  type: string
  emoji: string
  title: { de: string; en: string }
  description: { de: string; en: string }
}

export interface UserBadge {
  badge_type: string
  earned_at: string
}

export interface WeeklyScore {
  user_id: string
  display_name: string
  avatar_url: string | null
  week_start: string
  total_score: number
  rank: number
  is_champion: boolean
  level: number
  current_streak: number
}

export interface LeaderboardEntry {
  rank: number
  user_id: string
  display_name: string
  avatar_url: string | null
  total_score: number
  level: number
  current_streak: number
  is_champion: boolean
}

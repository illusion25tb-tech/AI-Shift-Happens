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

export interface LeaderboardEntry {
  user_id: string
  display_name: string
  level: number
  total_score: number
  current_streak: number
  rank: number
}

export type Locale = 'de' | 'en'

export type GameState =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'feedback'
  | 'finished'
  | 'error'

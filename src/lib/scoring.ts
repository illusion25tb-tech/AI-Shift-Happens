import { STREAK_MULTIPLIERS, SPEED_BONUS_MAX, SPEED_BONUS_DECAY, BONUS_MULTIPLIER } from './constants'

export function getStreakMultiplier(streakCount: number, isBonus = false): number {
  const maxIndex = isBonus ? STREAK_MULTIPLIERS.length - 1 : STREAK_MULTIPLIERS.length - 2
  const rawIndex = isBonus ? streakCount : streakCount - 1
  const index = Math.min(rawIndex, maxIndex)
  return STREAK_MULTIPLIERS[Math.max(0, index)]
}

interface ScoreInput {
  optionScore: number
  streakCount: number
  answerTimeMs: number
  isBonus: boolean
}

interface ScoreResult {
  base_score: number
  streak_multi: number
  speed_bonus: number
  bonus_multi: number
  total_score: number
  is_correct: boolean
  is_dangerous: boolean
}

export function calculateScore(input: ScoreInput): ScoreResult {
  const { optionScore, streakCount, answerTimeMs, isBonus } = input
  const is_correct = optionScore === 100
  const is_dangerous = optionScore < 0
  const base_score = optionScore
  const streak_multi = is_correct ? getStreakMultiplier(streakCount, isBonus) : 1.0
  const bonus_multi = isBonus ? BONUS_MULTIPLIER : 1.0
  const answerTimeSec = answerTimeMs / 1000
  const speed_bonus = is_correct ? Math.max(0, Math.round(SPEED_BONUS_MAX - answerTimeSec * SPEED_BONUS_DECAY)) : 0
  const total_score = is_correct
    ? Math.round(base_score * streak_multi * bonus_multi + speed_bonus * bonus_multi)
    : base_score
  return { base_score, streak_multi, speed_bonus, bonus_multi, total_score, is_correct, is_dangerous }
}

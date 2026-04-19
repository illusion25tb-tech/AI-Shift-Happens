import { STREAK_MULTIPLIERS, CONFIDENCE_SCORES, CALIBRATION_BONUS, CALIBRATION_MALUS, BULLSHIT_DETECT_BONUS, BONUS_MULTIPLIER } from './constants'
import type { ConfidenceLevel } from './constants'

export function getStreakMultiplier(streakCount: number, isBonus = false): number {
  const maxIndex = isBonus ? STREAK_MULTIPLIERS.length - 1 : STREAK_MULTIPLIERS.length - 2
  const rawIndex = isBonus ? streakCount : streakCount - 1
  const index = Math.min(rawIndex, maxIndex)
  return STREAK_MULTIPLIERS[Math.max(0, index)]
}

interface ScoreInput {
  optionScore: number
  streakCount: number
  confidence: ConfidenceLevel
  isBonus: boolean
  isBullshitTrap: boolean
}

interface ScoreResult {
  base_score: number
  streak_multi: number
  confidence_multi: number
  bonus_multi: number
  total_score: number
  is_correct: boolean
  is_dangerous: boolean
}

export function calculateScore(input: ScoreInput): ScoreResult {
  const { optionScore, streakCount, confidence, isBonus, isBullshitTrap } = input
  const is_correct = optionScore === 100
  const is_dangerous = optionScore < 0

  const scores = CONFIDENCE_SCORES[confidence]
  let base_score: number

  if (is_correct) {
    base_score = scores.correct
  } else if (isBullshitTrap) {
    base_score = scores.bullshit
  } else {
    base_score = scores.wrong
  }

  const streak_multi = is_correct ? getStreakMultiplier(streakCount, isBonus) : 1.0
  const bonus_multi = isBonus ? BONUS_MULTIPLIER : 1.0
  const confidence_multi = confidence

  const total_score = is_correct
    ? Math.round(base_score * streak_multi * bonus_multi)
    : base_score

  return { base_score, streak_multi, confidence_multi, bonus_multi, total_score, is_correct, is_dangerous }
}

// Calibration bonus at end of quiz
export function calculateCalibrationBonus(
  answers: Array<{ confidence: ConfidenceLevel; is_correct: boolean }>,
): number {
  const confidentAnswers = answers.filter(a => a.confidence === 3)
  if (confidentAnswers.length === 0) return 0

  const correctRate = confidentAnswers.filter(a => a.is_correct).length / confidentAnswers.length

  if (correctRate >= 0.8) return CALIBRATION_BONUS
  if (correctRate < 0.5) return CALIBRATION_MALUS
  return 0
}

// Bullshit detector bonus — reward for NOT going confident on traps
export function calculateBullshitBonus(
  answers: Array<{ is_bullshit_trap: boolean; confidence: ConfidenceLevel }>,
): number {
  return answers.filter(a => a.is_bullshit_trap && a.confidence < 3).length * BULLSHIT_DETECT_BONUS
}

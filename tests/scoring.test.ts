import { describe, it, expect } from 'vitest'
import { calculateScore, getStreakMultiplier } from '../src/lib/scoring'

describe('getStreakMultiplier', () => {
  it('returns 1.0 for first correct answer', () => {
    expect(getStreakMultiplier(1)).toBe(1.0)
  })
  it('returns 1.5 for second consecutive correct', () => {
    expect(getStreakMultiplier(2)).toBe(1.5)
  })
  it('returns 2.0 for third', () => {
    expect(getStreakMultiplier(3)).toBe(2.0)
  })
  it('caps at 2.5 for 4+ (non-bonus)', () => {
    expect(getStreakMultiplier(4)).toBe(2.5)
    expect(getStreakMultiplier(10)).toBe(2.5)
  })
  it('caps at 3.0 for 4+ (bonus)', () => {
    expect(getStreakMultiplier(4, true)).toBe(3.0)
  })
})

describe('calculateScore', () => {
  it('scores +100 base for correct answer', () => {
    const result = calculateScore({ optionScore: 100, streakCount: 1, answerTimeMs: 10_000, isBonus: false })
    expect(result.base_score).toBe(100)
    expect(result.is_correct).toBe(true)
    expect(result.is_dangerous).toBe(false)
  })

  it('scores 0 for traditional answer', () => {
    const result = calculateScore({ optionScore: 0, streakCount: 3, answerTimeMs: 5_000, isBonus: false })
    expect(result.base_score).toBe(0)
    expect(result.total_score).toBe(0)
    expect(result.speed_bonus).toBe(0)
    expect(result.is_correct).toBe(false)
    expect(result.is_dangerous).toBe(false)
  })

  it('scores -100 for dangerous answer', () => {
    const result = calculateScore({ optionScore: -100, streakCount: 3, answerTimeMs: 5_000, isBonus: false })
    expect(result.base_score).toBe(-100)
    expect(result.total_score).toBe(-100)
    expect(result.speed_bonus).toBe(0)
    expect(result.is_dangerous).toBe(true)
  })

  it('applies streak multiplier to correct answers', () => {
    // At 30s (no speed bonus): 100 * 2.0 = 200
    const result = calculateScore({ optionScore: 100, streakCount: 3, answerTimeMs: 30_000, isBonus: false })
    expect(result.streak_multi).toBe(2.0)
    expect(result.total_score).toBe(200)
  })

  it('calculates speed bonus for correct fast answers', () => {
    // SPEED_BONUS_DECAY = 1.67, so 4s → round(50 - 4*1.67) = round(43.32) = 43
    const result = calculateScore({ optionScore: 100, streakCount: 1, answerTimeMs: 4_000, isBonus: false })
    expect(result.speed_bonus).toBe(43)
    expect(result.total_score).toBe(143)
  })

  it('gives zero speed bonus at 30+ seconds', () => {
    // 30s timer: at 30s → round(50 - 30*1.67) = round(-0.1) → 0
    const result = calculateScore({ optionScore: 100, streakCount: 1, answerTimeMs: 30_000, isBonus: false })
    expect(result.speed_bonus).toBe(0)
    expect(result.total_score).toBe(100)
  })

  it('applies 1.5x bonus multiplier for bonus questions', () => {
    // streak 4 bonus: 3.0x, bonus: 1.5x, speed at 4s: 43
    // total = round(100 * 3.0 * 1.5 + 43 * 1.5) = round(450 + 64.5) = 515
    const result = calculateScore({ optionScore: 100, streakCount: 4, answerTimeMs: 4_000, isBonus: true })
    expect(result.bonus_multi).toBe(1.5)
    expect(result.streak_multi).toBe(3.0)
    expect(result.total_score).toBe(515)
  })
})

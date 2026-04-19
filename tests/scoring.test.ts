import { describe, it, expect } from 'vitest'
import { calculateScore, getStreakMultiplier, calculateCalibrationBonus, calculateBullshitBonus } from '../src/lib/scoring'

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

describe('calculateScore — Confidence Betting', () => {
  it('vorsichtig + richtig = +50', () => {
    const r = calculateScore({ optionScore: 100, streakCount: 1, confidence: 1, isBonus: false, isBullshitTrap: false })
    expect(r.base_score).toBe(50)
    expect(r.total_score).toBe(50)
    expect(r.is_correct).toBe(true)
  })

  it('mittel + richtig = +150', () => {
    const r = calculateScore({ optionScore: 100, streakCount: 1, confidence: 2, isBonus: false, isBullshitTrap: false })
    expect(r.base_score).toBe(150)
    expect(r.total_score).toBe(150)
  })

  it('sicher + richtig = +300', () => {
    const r = calculateScore({ optionScore: 100, streakCount: 1, confidence: 3, isBonus: false, isBullshitTrap: false })
    expect(r.base_score).toBe(300)
    expect(r.total_score).toBe(300)
  })

  it('sicher + falsch = -150', () => {
    const r = calculateScore({ optionScore: 0, streakCount: 1, confidence: 3, isBonus: false, isBullshitTrap: false })
    expect(r.base_score).toBe(-150)
    expect(r.total_score).toBe(-150)
    expect(r.is_correct).toBe(false)
  })

  it('vorsichtig + falsch = 0', () => {
    const r = calculateScore({ optionScore: 0, streakCount: 1, confidence: 1, isBonus: false, isBullshitTrap: false })
    expect(r.base_score).toBe(0)
    expect(r.total_score).toBe(0)
  })

  it('sicher + bullshit trap = -200', () => {
    const r = calculateScore({ optionScore: 0, streakCount: 1, confidence: 3, isBonus: false, isBullshitTrap: true })
    expect(r.base_score).toBe(-200)
    expect(r.total_score).toBe(-200)
  })

  it('mittel + bullshit trap = -75', () => {
    const r = calculateScore({ optionScore: 0, streakCount: 1, confidence: 2, isBonus: false, isBullshitTrap: true })
    expect(r.base_score).toBe(-75)
    expect(r.total_score).toBe(-75)
  })

  it('vorsichtig + bullshit trap = 0 (kein Schaden)', () => {
    const r = calculateScore({ optionScore: 0, streakCount: 1, confidence: 1, isBonus: false, isBullshitTrap: true })
    expect(r.base_score).toBe(0)
    expect(r.total_score).toBe(0)
  })

  it('applies streak multiplier to confident correct', () => {
    // sicher + richtig + streak 3: 300 * 2.0 = 600
    const r = calculateScore({ optionScore: 100, streakCount: 3, confidence: 3, isBonus: false, isBullshitTrap: false })
    expect(r.streak_multi).toBe(2.0)
    expect(r.total_score).toBe(600)
  })

  it('applies bonus multiplier', () => {
    // sicher + richtig + bonus: streak 1 + isBonus → streakMulti=1.5, bonus=1.5
    // 300 * 1.5 * 1.5 = 675
    const r = calculateScore({ optionScore: 100, streakCount: 1, confidence: 3, isBonus: true, isBullshitTrap: false })
    expect(r.bonus_multi).toBe(1.5)
    expect(r.total_score).toBe(675)
  })

  it('applies streak + bonus multiplier', () => {
    // sicher + richtig + streak 4 bonus: 300 * 3.0 * 1.5 = 1350
    const r = calculateScore({ optionScore: 100, streakCount: 4, confidence: 3, isBonus: true, isBullshitTrap: false })
    expect(r.total_score).toBe(1350)
  })

  it('marks dangerous answers', () => {
    const r = calculateScore({ optionScore: -100, streakCount: 1, confidence: 3, isBonus: false, isBullshitTrap: false })
    expect(r.is_dangerous).toBe(true)
    // Dangerous answers use confidence wrong scoring
    expect(r.base_score).toBe(-150)
  })
})

describe('calculateCalibrationBonus', () => {
  it('returns +100 for good calibration (>= 80% confident correct)', () => {
    const answers = [
      { confidence: 3 as const, is_correct: true },
      { confidence: 3 as const, is_correct: true },
      { confidence: 3 as const, is_correct: true },
      { confidence: 3 as const, is_correct: true },
      { confidence: 3 as const, is_correct: false },
    ]
    expect(calculateCalibrationBonus(answers)).toBe(100)
  })

  it('returns -100 for bad calibration (< 50% confident correct)', () => {
    const answers = [
      { confidence: 3 as const, is_correct: false },
      { confidence: 3 as const, is_correct: false },
      { confidence: 3 as const, is_correct: true },
    ]
    expect(calculateCalibrationBonus(answers)).toBe(-100)
  })

  it('returns 0 if no confident answers', () => {
    const answers = [
      { confidence: 1 as const, is_correct: true },
      { confidence: 2 as const, is_correct: false },
    ]
    expect(calculateCalibrationBonus(answers)).toBe(0)
  })

  it('returns 0 for moderate calibration (50-79%)', () => {
    const answers = [
      { confidence: 3 as const, is_correct: true },
      { confidence: 3 as const, is_correct: false },
    ]
    expect(calculateCalibrationBonus(answers)).toBe(0)
  })
})

describe('calculateBullshitBonus', () => {
  it('rewards not being confident on bullshit traps', () => {
    const answers = [
      { is_bullshit_trap: true, confidence: 1 as const },  // detected
      { is_bullshit_trap: true, confidence: 2 as const },  // detected
      { is_bullshit_trap: true, confidence: 3 as const },  // fell for it
      { is_bullshit_trap: false, confidence: 1 as const }, // not a trap, irrelevant
    ]
    expect(calculateBullshitBonus(answers)).toBe(100) // 2 × 50
  })

  it('returns 0 if no traps', () => {
    const answers = [
      { is_bullshit_trap: false, confidence: 3 as const },
    ]
    expect(calculateBullshitBonus(answers)).toBe(0)
  })
})

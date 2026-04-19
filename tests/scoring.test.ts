import { describe, it, expect } from 'vitest'
import { calculateScore, getStreakMultiplier, calculateCalibrationBonus, calculateBullshitBonus } from '../src/lib/scoring'

describe('getStreakMultiplier', () => {
  it('returns 1.0 for first correct answer', () => {
    expect(getStreakMultiplier(1)).toBe(1.0)
  })
  it('returns 1.5 for second consecutive correct', () => {
    expect(getStreakMultiplier(2)).toBe(1.5)
  })
  it('caps at 2.5 for 4+ (non-bonus)', () => {
    expect(getStreakMultiplier(4)).toBe(2.5)
  })
  it('caps at 3.0 for 4+ (bonus)', () => {
    expect(getStreakMultiplier(4, true)).toBe(3.0)
  })
})

describe('calculateScore — Confidence + Speed', () => {
  const base = { streakCount: 1, answerTimeMs: 60000, isBonus: false, isBullshitTrap: false }

  it('vorsichtig + richtig + slow = +50', () => {
    const r = calculateScore({ ...base, optionScore: 100, confidence: 1 })
    expect(r.base_score).toBe(50)
    expect(r.speed_bonus).toBe(0) // 60s = no speed bonus
    expect(r.total_score).toBe(50)
  })

  it('sicher + richtig + slow = +300', () => {
    const r = calculateScore({ ...base, optionScore: 100, confidence: 3 })
    expect(r.total_score).toBe(300)
  })

  it('sicher + richtig + fast (5s) = 300 + speed bonus', () => {
    const r = calculateScore({ ...base, optionScore: 100, confidence: 3, answerTimeMs: 5000 })
    // speed_bonus = round(50 - 5 * 0.83) = round(45.85) = 46
    expect(r.speed_bonus).toBe(46)
    expect(r.total_score).toBe(300 + 46) // 346
  })

  it('sicher + falsch = -150 (no speed bonus)', () => {
    const r = calculateScore({ ...base, optionScore: 0, confidence: 3 })
    expect(r.base_score).toBe(-150)
    expect(r.speed_bonus).toBe(0)
    expect(r.total_score).toBe(-150)
  })

  it('sicher + bullshit trap = -200', () => {
    const r = calculateScore({ ...base, optionScore: 0, confidence: 3, isBullshitTrap: true })
    expect(r.total_score).toBe(-200)
  })

  it('vorsichtig + falsch = 0', () => {
    const r = calculateScore({ ...base, optionScore: 0, confidence: 1 })
    expect(r.total_score).toBe(0)
  })

  it('applies streak multiplier to base, speed bonus separate', () => {
    // sicher + richtig + streak 3 + fast 5s: (300 * 2.0) + 46 = 646
    const r = calculateScore({ ...base, optionScore: 100, confidence: 3, streakCount: 3, answerTimeMs: 5000 })
    expect(r.streak_multi).toBe(2.0)
    expect(r.speed_bonus).toBe(46)
    expect(r.total_score).toBe(646)
  })

  it('applies bonus multiplier to both base and speed', () => {
    // sicher + richtig + bonus + streak 4 + fast 5s
    // base: 300 * 3.0 * 1.5 = 1350, speed: 46 * 1.5 = 69 → total 1419
    const r = calculateScore({ ...base, optionScore: 100, confidence: 3, streakCount: 4, answerTimeMs: 5000, isBonus: true })
    expect(r.total_score).toBe(1419)
  })

  it('speed bonus is 0 at 60s', () => {
    const r = calculateScore({ ...base, optionScore: 100, confidence: 2, answerTimeMs: 60000 })
    expect(r.speed_bonus).toBe(0)
    expect(r.total_score).toBe(150)
  })

  it('speed bonus maxes at 50 for instant answer', () => {
    const r = calculateScore({ ...base, optionScore: 100, confidence: 1, answerTimeMs: 0 })
    expect(r.speed_bonus).toBe(50)
    expect(r.total_score).toBe(100) // 50 + 50
  })
})

describe('calculateCalibrationBonus', () => {
  it('returns +100 for good calibration (>= 80%)', () => {
    const answers = [
      { confidence: 3 as const, is_correct: true },
      { confidence: 3 as const, is_correct: true },
      { confidence: 3 as const, is_correct: true },
      { confidence: 3 as const, is_correct: true },
      { confidence: 3 as const, is_correct: false },
    ]
    expect(calculateCalibrationBonus(answers)).toBe(100)
  })

  it('returns -100 for bad calibration (< 50%)', () => {
    const answers = [
      { confidence: 3 as const, is_correct: false },
      { confidence: 3 as const, is_correct: false },
      { confidence: 3 as const, is_correct: true },
    ]
    expect(calculateCalibrationBonus(answers)).toBe(-100)
  })

  it('returns 0 if no confident answers', () => {
    expect(calculateCalibrationBonus([{ confidence: 1 as const, is_correct: true }])).toBe(0)
  })
})

describe('calculateBullshitBonus', () => {
  it('rewards not being confident on traps', () => {
    const answers = [
      { is_bullshit_trap: true, confidence: 1 as const },
      { is_bullshit_trap: true, confidence: 2 as const },
      { is_bullshit_trap: true, confidence: 3 as const },
      { is_bullshit_trap: false, confidence: 1 as const },
    ]
    expect(calculateBullshitBonus(answers)).toBe(100)
  })
})

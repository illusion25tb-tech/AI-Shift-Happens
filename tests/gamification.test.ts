import { describe, it, expect } from 'vitest'
import { getLevelForXp, getXpForScore, getStreakXpMultiplier, checkBadgesAfterDaily } from '../src/lib/gamification'

describe('getLevelForXp', () => {
  it('returns level 1 for 0 XP', () => {
    const r = getLevelForXp(0)
    expect(r.level).toBe(1)
    expect(r.emoji).toBe('🌱')
    expect(r.titleDe).toBe('AI Rookie')
    expect(r.nextLevelXp).toBe(1000)
  })
  it('returns level 2 for 1000 XP', () => {
    const r = getLevelForXp(1000)
    expect(r.level).toBe(2)
    expect(r.titleDe).toBe('AI User')
  })
  it('returns level 6 for 100000+ XP', () => {
    const r = getLevelForXp(150000)
    expect(r.level).toBe(6)
    expect(r.titleDe).toBe('AI Dirigent')
    expect(r.nextLevelXp).toBeNull()
  })
  it('returns level 3 for 7500 XP', () => {
    const r = getLevelForXp(7500)
    expect(r.level).toBe(3)
    expect(r.currentXp).toBe(7500)
    expect(r.nextLevelXp).toBe(15000)
  })
})

describe('getXpForScore', () => {
  it('returns score as XP for positive scores', () => {
    expect(getXpForScore(190)).toBe(190)
  })
  it('returns 0 for negative scores', () => {
    expect(getXpForScore(-100)).toBe(0)
  })
  it('returns 0 for zero score', () => {
    expect(getXpForScore(0)).toBe(0)
  })
})

describe('getStreakXpMultiplier', () => {
  it('returns 1.0 for 0-4 days', () => {
    expect(getStreakXpMultiplier(0)).toBe(1.0)
    expect(getStreakXpMultiplier(4)).toBe(1.0)
  })
  it('returns 1.25 for 5-9 days', () => {
    expect(getStreakXpMultiplier(5)).toBe(1.25)
    expect(getStreakXpMultiplier(9)).toBe(1.25)
  })
  it('returns 1.5 for 10-19 days', () => {
    expect(getStreakXpMultiplier(10)).toBe(1.5)
  })
  it('returns 2.0 for 20+ days', () => {
    expect(getStreakXpMultiplier(20)).toBe(2.0)
    expect(getStreakXpMultiplier(100)).toBe(2.0)
  })
})

describe('checkBadgesAfterDaily', () => {
  it('awards perfect_round for 4/4 correct', () => {
    const answers = [
      { is_correct: true, total_score: 140, time_ms: 4000 },
      { is_correct: true, total_score: 190, time_ms: 5000 },
      { is_correct: true, total_score: 240, time_ms: 3000 },
      { is_correct: true, total_score: 435, time_ms: 4000 },
    ]
    const badges = checkBadgesAfterDaily(answers, [], 1)
    expect(badges).toContain('perfect_round')
  })
  it('awards speed_demon for 3 correct under 15s total', () => {
    const answers = [
      { is_correct: true, total_score: 100, time_ms: 3000 },
      { is_correct: true, total_score: 100, time_ms: 4000 },
      { is_correct: true, total_score: 100, time_ms: 4000 },
      { is_correct: false, total_score: 0, time_ms: 10000 },
    ]
    const badges = checkBadgesAfterDaily(answers, [], 1)
    expect(badges).toContain('speed_demon')
  })
  it('does not award already earned badges', () => {
    const answers = [
      { is_correct: true, total_score: 140, time_ms: 4000 },
      { is_correct: true, total_score: 190, time_ms: 5000 },
      { is_correct: true, total_score: 240, time_ms: 3000 },
      { is_correct: true, total_score: 435, time_ms: 4000 },
    ]
    const badges = checkBadgesAfterDaily(answers, ['perfect_round'], 1)
    expect(badges).not.toContain('perfect_round')
  })
  it('awards streak_7 for 7-day streak', () => {
    const answers = [{ is_correct: true, total_score: 100, time_ms: 5000 }]
    const badges = checkBadgesAfterDaily(answers, [], 7)
    expect(badges).toContain('streak_7')
  })
  it('does not award streak_7 for 6-day streak', () => {
    const answers = [{ is_correct: true, total_score: 100, time_ms: 5000 }]
    const badges = checkBadgesAfterDaily(answers, [], 6)
    expect(badges).not.toContain('streak_7')
  })
})

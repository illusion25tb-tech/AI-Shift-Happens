import { LEVELS, STREAK_XP_MULTIPLIERS } from './constants'

export interface LevelInfo {
  level: number
  emoji: string
  titleDe: string
  titleEn: string
  currentXp: number
  nextLevelXp: number | null
}

export function getLevelForXp(xp: number): LevelInfo {
  let matched: (typeof LEVELS)[number] = LEVELS[0]
  for (const lvl of LEVELS) {
    if (xp >= lvl.xp) matched = lvl
  }
  const nextLevel = LEVELS.find(l => l.level === matched.level + 1)
  return {
    level: matched.level,
    emoji: matched.emoji,
    titleDe: matched.title.de,
    titleEn: matched.title.en,
    currentXp: xp,
    nextLevelXp: nextLevel?.xp ?? null,
  }
}

export function getXpForScore(totalScore: number): number {
  return Math.max(0, totalScore)
}

export function getStreakXpMultiplier(streakDays: number): number {
  let multi = 1.0
  for (const tier of STREAK_XP_MULTIPLIERS) {
    if (streakDays >= tier.minDays) multi = tier.multi
  }
  return multi
}

interface DailyAnswer {
  is_correct: boolean
  total_score: number
  time_ms: number
}

export function checkBadgesAfterDaily(
  answers: DailyAnswer[],
  existingBadges: string[],
  currentStreak: number,
): string[] {
  const newBadges: string[] = []
  function award(type: string) {
    if (!existingBadges.includes(type) && !newBadges.includes(type)) newBadges.push(type)
  }

  if (answers.length >= 4 && answers.every(a => a.is_correct)) award('perfect_round')

  const correctAnswers = answers.filter(a => a.is_correct)
  if (correctAnswers.length >= 3) {
    const fastestThree = [...correctAnswers].sort((a, b) => a.time_ms - b.time_ms).slice(0, 3)
    const totalTimeMs = fastestThree.reduce((sum, a) => sum + a.time_ms, 0)
    if (totalTimeMs < 15000) award('speed_demon')
  }

  if (currentStreak >= 7) award('streak_7')
  if (currentStreak >= 30) award('streak_30')
  if (currentStreak >= 100) award('streak_100')

  return newBadges
}

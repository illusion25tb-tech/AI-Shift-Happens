export interface LevelInfo {
  level: number
  titleDe: string
  titleEn: string
  emoji: string
  nextLevelXp: number | null
}

const LEVELS: LevelInfo[] = [
  { level: 1, titleDe: 'Einsteiger',      titleEn: 'Beginner',     emoji: '🌱', nextLevelXp: 1000 },
  { level: 2, titleDe: 'Lernender',       titleEn: 'Learner',      emoji: '📚', nextLevelXp: 5000 },
  { level: 3, titleDe: 'Fortgeschritten', titleEn: 'Advanced',     emoji: '⚡', nextLevelXp: 15000 },
  { level: 4, titleDe: 'Experte',         titleEn: 'Expert',       emoji: '🎯', nextLevelXp: 40000 },
  { level: 5, titleDe: 'Meister',         titleEn: 'Master',       emoji: '🏆', nextLevelXp: 100000 },
  { level: 6, titleDe: 'Legende',         titleEn: 'Legend',       emoji: '🌟', nextLevelXp: null },
]

export function getLevelForXp(totalXp: number): LevelInfo {
  let current = LEVELS[0]
  for (const lvl of LEVELS) {
    if (lvl.nextLevelXp === null || totalXp < lvl.nextLevelXp) {
      current = lvl
      break
    }
    current = lvl
  }
  return current
}

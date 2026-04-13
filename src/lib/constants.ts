import type { Badge } from '../types'

export const CATEGORIES = [
  'prompt-architecture',
  'creativity-ideation',
  'critical-thinking',
  'efficiency-analysis',
  'privacy-ethics',
  'workflow-integration',
  'automation-agents',
  'knowledge-research',
  'change-collaboration',
  'quality-measurement',
] as const

export type CategoryId = (typeof CATEGORIES)[number]

export const CATEGORY_LABELS: Record<CategoryId, { de: string; en: string }> = {
  'prompt-architecture': { de: 'Prompt-Architektur', en: 'Prompt Architecture' },
  'creativity-ideation': { de: 'Kreativität & Ideation', en: 'Creativity & Ideation' },
  'critical-thinking': { de: 'Kritisches Denken & Validierung', en: 'Critical Thinking & Validation' },
  'efficiency-analysis': { de: 'Effizienz & Analyse', en: 'Efficiency & Analysis' },
  'privacy-ethics': { de: 'Datenschutz & Ethik', en: 'Privacy & Ethics' },
  'workflow-integration': { de: 'Workflow-Integration', en: 'Workflow Integration' },
  'automation-agents': { de: 'Automatisierung & Agenten', en: 'Automation & Agents' },
  'knowledge-research': { de: 'Wissensmanagement & Recherche', en: 'Knowledge Management & Research' },
  'change-collaboration': { de: 'Change & Zusammenarbeit', en: 'Change & Collaboration' },
  'quality-measurement': { de: 'Messbarkeit & Qualität', en: 'Quality & Measurement' },
}

export const LEVELS = [
  { level: 1, title: { de: 'AI Rookie', en: 'AI Rookie' }, xp: 0, emoji: '🌱' },
  { level: 2, title: { de: 'AI User', en: 'AI User' }, xp: 1_000, emoji: '💡' },
  { level: 3, title: { de: 'AI Thinker', en: 'AI Thinker' }, xp: 5_000, emoji: '🧠' },
  { level: 4, title: { de: 'AI Strategist', en: 'AI Strategist' }, xp: 15_000, emoji: '🎯' },
  { level: 5, title: { de: 'AI Architect', en: 'AI Architect' }, xp: 40_000, emoji: '🏗️' },
  { level: 6, title: { de: 'AI Dirigent', en: 'AI Dirigent' }, xp: 100_000, emoji: '👑' },
] as const

export const STREAK_MULTIPLIERS = [1.0, 1.5, 2.0, 2.5, 3.0] as const

export const DAILY_QUESTION_COUNT = 3
export const BONUS_QUESTION_COUNT = 1
export const FREEPLAY_QUESTION_COUNT = 10
export const SPEED_BONUS_MAX = 50
export const SPEED_BONUS_DECAY = 2.5
export const BONUS_MULTIPLIER = 1.5

export const BADGES: Badge[] = [
  { type: 'perfect_round', emoji: '🎯', title: { de: 'Perfektionist', en: 'Perfectionist' }, description: { de: 'Erste perfekte Daily-Runde (4/4 richtig)', en: 'First perfect daily round (4/4 correct)' } },
  { type: 'speed_demon', emoji: '⚡', title: { de: 'Speed Demon', en: 'Speed Demon' }, description: { de: '3 Fragen in unter 15 Sekunden richtig', en: '3 questions correct in under 15 seconds' } },
  { type: 'universalist', emoji: '🧩', title: { de: 'Universalist', en: 'Universalist' }, description: { de: 'Alle 10 Kategorien mindestens 1× gespielt', en: 'All 10 categories played at least once' } },
  { type: 'meister', emoji: '🎓', title: { de: 'Meister', en: 'Master' }, description: { de: '10× hintereinander 100 Pts in einer Kategorie', en: '10 consecutive 100pt answers in one category' } },
  { type: 'streak_7', emoji: '🔥', title: { de: 'Auf Feuer', en: 'On Fire' }, description: { de: '7-Tage-Streak', en: '7-day streak' } },
  { type: 'streak_30', emoji: '🌋', title: { de: 'Unaufhaltsam', en: 'Unstoppable' }, description: { de: '30-Tage-Streak', en: '30-day streak' } },
  { type: 'streak_100', emoji: '💎', title: { de: 'Diamant', en: 'Diamond' }, description: { de: '100-Tage-Streak', en: '100-day streak' } },
  { type: 'early_bird', emoji: '🌅', title: { de: 'Frühaufsteher', en: 'Early Bird' }, description: { de: '5× Daily Quiz vor 8:00 Uhr', en: '5× Daily Quiz before 8:00 AM' } },
  { type: 'duelist', emoji: '⚔️', title: { de: 'Duellant', en: 'Duelist' }, description: { de: 'Erste Challenge gewonnen', en: 'First challenge won' } },
  { type: 'recruiter', emoji: '📣', title: { de: 'Recruiter Gold', en: 'Recruiter Gold' }, description: { de: '5 Kollegen eingeladen', en: '5 colleagues invited' } },
  { type: 'weekly_champion', emoji: '🏅', title: { de: 'Wochen-Champion', en: 'Weekly Champion' }, description: { de: '1× Platz 1 im Wochen-Ranking', en: '1× rank #1 in weekly ranking' } },
  { type: 'serial_winner', emoji: '👑', title: { de: 'Seriensieger', en: 'Serial Winner' }, description: { de: '3× Wochen-Champion', en: '3× weekly champion' } },
]

export const STREAK_XP_MULTIPLIERS = [
  { minDays: 0, multi: 1.0 },
  { minDays: 5, multi: 1.25 },
  { minDays: 10, multi: 1.5 },
  { minDays: 20, multi: 2.0 },
] as const

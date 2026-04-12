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

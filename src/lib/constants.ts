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

export const BADGES = [
  {
    type: 'first_quiz',
    emoji: '🎯',
    title: { de: 'Erstes Quiz', en: 'First Quiz' },
    description: { de: 'Erstes Quiz abgeschlossen', en: 'Completed first quiz' },
  },
  {
    type: 'streak_3',
    emoji: '🔥',
    title: { de: '3-Tage-Streak', en: '3-Day Streak' },
    description: { de: '3 Tage in Folge gespielt', en: 'Played 3 days in a row' },
  },
  {
    type: 'streak_7',
    emoji: '⚡',
    title: { de: '7-Tage-Streak', en: '7-Day Streak' },
    description: { de: '7 Tage in Folge gespielt', en: 'Played 7 days in a row' },
  },
  {
    type: 'streak_30',
    emoji: '💎',
    title: { de: '30-Tage-Streak', en: '30-Day Streak' },
    description: { de: '30 Tage in Folge gespielt', en: 'Played 30 days in a row' },
  },
  {
    type: 'perfect_score',
    emoji: '⭐',
    title: { de: 'Perfekt!', en: 'Perfect!' },
    description: { de: 'Alle Fragen richtig beantwortet', en: 'Answered all questions correctly' },
  },
  {
    type: 'level_3',
    emoji: '🧠',
    title: { de: 'AI Thinker', en: 'AI Thinker' },
    description: { de: 'Level 3 erreicht', en: 'Reached level 3' },
  },
  {
    type: 'level_5',
    emoji: '🏗️',
    title: { de: 'AI Architect', en: 'AI Architect' },
    description: { de: 'Level 5 erreicht', en: 'Reached level 5' },
  },
  {
    type: 'xp_10000',
    emoji: '🚀',
    title: { de: '10.000 XP', en: '10,000 XP' },
    description: { de: '10.000 XP gesammelt', en: 'Collected 10,000 XP' },
  },
  {
    type: 'categories_all',
    emoji: '🌈',
    title: { de: 'Allrounder', en: 'All-Rounder' },
    description: { de: 'Alle Kategorien gespielt', en: 'Played all categories' },
  },
] as const

export type BadgeType = (typeof BADGES)[number]['type']

export const STREAK_MULTIPLIERS = [1.0, 1.5, 2.0, 2.5, 3.0] as const

export const DAILY_QUESTION_COUNT = 3
export const BONUS_QUESTION_COUNT = 1
export const FREEPLAY_QUESTION_COUNT = 10
export const SPEED_BONUS_MAX = 50
export const SPEED_BONUS_DECAY = 2.5
export const BONUS_MULTIPLIER = 1.5

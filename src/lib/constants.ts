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
  {
    type: 'weekly_champion',
    emoji: '👑',
    title: { de: 'Wochen-Champion', en: 'Weekly Champion' },
    description: { de: 'Wochen-Sieger geworden', en: 'Won weekly championship' },
  },
  {
    type: 'monthly_champion',
    emoji: '🏆',
    title: { de: 'Monats-Champion', en: 'Monthly Champion' },
    description: { de: 'Monats-Sieger geworden', en: 'Won monthly championship' },
  },
  {
    type: 'serial_winner',
    emoji: '🔱',
    title: { de: 'Seriensieg', en: 'Serial Winner' },
    description: { de: '3x Wochen-Champion', en: '3x Weekly Champion' },
  },
  {
    type: 'duelist',
    emoji: '⚔️',
    title: { de: 'Duellant', en: 'Duelist' },
    description: { de: 'Erste Challenge gewonnen', en: 'Won first challenge' },
  },
  {
    type: 'speed_demon',
    emoji: '💨',
    title: { de: 'Blitzschnell', en: 'Speed Demon' },
    description: { de: '3 richtige Antworten unter je 5 Sekunden', en: '3 correct answers under 5 seconds each' },
  },
  {
    type: 'night_owl',
    emoji: '🦉',
    title: { de: 'Nachteule', en: 'Night Owl' },
    description: { de: 'Quiz nach 22 Uhr gespielt', en: 'Played quiz after 10 PM' },
  },
  {
    type: 'early_bird',
    emoji: '🐦',
    title: { de: 'Frühaufsteher', en: 'Early Bird' },
    description: { de: 'Quiz vor 7 Uhr gespielt', en: 'Played quiz before 7 AM' },
  },
  {
    type: 'marathon',
    emoji: '🏃',
    title: { de: 'Marathon', en: 'Marathon' },
    description: { de: '10 Quizzes an einem Tag', en: '10 quizzes in one day' },
  },
  {
    type: 'team_player',
    emoji: '🤝',
    title: { de: 'Teamplayer', en: 'Team Player' },
    description: { de: 'Einem Team beigetreten', en: 'Joined a team' },
  },
  {
    type: 'recruiter',
    emoji: '📣',
    title: { de: 'Recruiter', en: 'Recruiter' },
    description: { de: '3 Spieler eingeladen', en: 'Invited 3 players' },
  },
  {
    type: 'perfectionist',
    emoji: '💎',
    title: { de: 'Perfektionist', en: 'Perfectionist' },
    description: { de: '3x perfektes Quiz', en: '3x perfect quiz' },
  },
  {
    type: 'comeback',
    emoji: '🔄',
    title: { de: 'Comeback', en: 'Comeback' },
    description: { de: 'Nach 7+ Tagen Pause zurückgekehrt', en: 'Returned after 7+ days break' },
  },
  {
    type: 'century',
    emoji: '💯',
    title: { de: 'Centurion', en: 'Centurion' },
    description: { de: '100 Quizzes gespielt', en: 'Played 100 quizzes' },
  },
  {
    type: 'xp_50000',
    emoji: '🌟',
    title: { de: '50.000 XP', en: '50,000 XP' },
    description: { de: '50.000 XP gesammelt', en: 'Collected 50,000 XP' },
  },
  {
    type: 'specialist',
    emoji: '🎓',
    title: { de: 'Spezialist', en: 'Specialist' },
    description: { de: '80%+ Trefferquote in einer Kategorie', en: '80%+ accuracy in one category' },
  },
] as const

export type BadgeType = (typeof BADGES)[number]['type']

export const STREAK_MULTIPLIERS = [1.0, 1.5, 2.0, 2.5, 3.0] as const

export const STREAK_XP_MULTIPLIERS = [
  { minDays: 0, multi: 1.0 },
  { minDays: 5, multi: 1.25 },
  { minDays: 10, multi: 1.5 },
  { minDays: 20, multi: 2.0 },
] as const

export const DAILY_QUESTION_COUNT = 3
export const BONUS_QUESTION_COUNT = 1
export const FREEPLAY_QUESTION_COUNT = 10
export const SPEED_BONUS_MAX = 50
export const SPEED_BONUS_DECAY = 1.67  // 50 / 30s = ~1.67 per second
export const BONUS_MULTIPLIER = 1.5

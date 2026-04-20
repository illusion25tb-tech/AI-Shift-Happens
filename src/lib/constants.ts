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
  'ai-law-regulation',
  'ai-security-risk',
  'ai-leadership',
  'ai-sales-marketing',
  'ai-cost-business',
  'ai-everyday',
  'ai-career',
  'ai-communication',
  'ai-tools-comparison',
  'ai-customer-service',
  'ai-finance',
  'ai-health',
  'ai-education',
  'ai-manufacturing',
  'ai-public-sector',
  'ai-media-content',
  'ai-sustainability',
  'ai-psychology',
  'ai-myths-facts',
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
  'ai-law-regulation': { de: 'KI & Recht', en: 'AI & Law' },
  'ai-security-risk': { de: 'KI-Sicherheit & Risiko', en: 'AI Security & Risk' },
  'ai-leadership': { de: 'KI & Führung', en: 'AI & Leadership' },
  'ai-sales-marketing': { de: 'KI im Vertrieb', en: 'AI in Sales & Marketing' },
  'ai-cost-business': { de: 'KI-Kosten & Business Case', en: 'AI Cost & Business Case' },
  'ai-everyday': { de: 'KI im Alltag', en: 'AI in Everyday Life' },
  'ai-career': { de: 'KI & Karriere', en: 'AI & Career' },
  'ai-communication': { de: 'KI & Kommunikation', en: 'AI & Communication' },
  'ai-tools-comparison': { de: 'KI-Tools im Vergleich', en: 'AI Tools Comparison' },
  'ai-customer-service': { de: 'KI & Kundenservice', en: 'AI & Customer Service' },
  'ai-finance': { de: 'KI & Finanzen', en: 'AI & Finance' },
  'ai-health': { de: 'KI & Gesundheit', en: 'AI & Health' },
  'ai-education': { de: 'KI & Bildung', en: 'AI & Education' },
  'ai-manufacturing': { de: 'KI & Handwerk/Produktion', en: 'AI & Manufacturing' },
  'ai-public-sector': { de: 'KI & Öffentlicher Dienst', en: 'AI & Public Sector' },
  'ai-media-content': { de: 'KI & Medien/Content', en: 'AI & Media/Content' },
  'ai-sustainability': { de: 'KI & Nachhaltigkeit', en: 'AI & Sustainability' },
  'ai-psychology': { de: 'KI & Psychologie', en: 'AI & Psychology' },
  'ai-myths-facts': { de: 'KI-Mythen & Fakten', en: 'AI Myths & Facts' },
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
  {
    type: 'bullshit_radar',
    emoji: '🎭',
    title: { de: 'Bullshit-Radar', en: 'BS Radar' },
    description: { de: '10 Bullshit-Fallen erkannt', en: '10 BS traps detected' },
  },
  {
    type: 'berater_killer',
    emoji: '💀',
    title: { de: 'Berater-Killer', en: 'Consultant Killer' },
    description: { de: '20 Bullshit-Fallen erkannt', en: '20 BS traps detected' },
  },
  {
    type: 'realist',
    emoji: '🧭',
    title: { de: 'Realist', en: 'Realist' },
    description: { de: '10 Quizzes mit >80% Kalibrierung', en: '10 quizzes with >80% calibration' },
  },
  {
    type: 'all_in',
    emoji: '🃏',
    title: { de: 'All-In', en: 'All-In' },
    description: { de: '5x Sicher gewählt und richtig', en: '5x confident and correct in a row' },
  },
  {
    type: 'pokerface',
    emoji: '🎰',
    title: { de: 'Pokerface', en: 'Poker Face' },
    description: { de: 'Jede Confidence-Stufe in einem Quiz genutzt', en: 'Used every confidence level in one quiz' },
  },
  {
    type: 'overconfident',
    emoji: '🤡',
    title: { de: 'Overconfident', en: 'Overconfident' },
    description: { de: '3x Sicher + falsch in einer Woche', en: '3x confident + wrong in one week' },
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

export const CATEGORY_COLORS: Record<CategoryId, string> = {
  'prompt-architecture': '#5B4FC7',
  'creativity-ideation': '#DB2777',
  'critical-thinking': '#DC2626',
  'efficiency-analysis': '#2DD4BF',
  'privacy-ethics': '#F97316',
  'workflow-integration': '#3B82F6',
  'automation-agents': '#8B5CF6',
  'knowledge-research': '#059669',
  'change-collaboration': '#FBBF24',
  'quality-measurement': '#06B6D4',
  'ai-law-regulation': '#EF4444',
  'ai-security-risk': '#F43F5E',
  'ai-leadership': '#A855F7',
  'ai-sales-marketing': '#10B981',
  'ai-cost-business': '#F59E0B',
  'ai-everyday': '#60A5FA',
  'ai-career': '#C084FC',
  'ai-communication': '#34D399',
  'ai-tools-comparison': '#FB923C',
  'ai-customer-service': '#38BDF8',
  'ai-finance': '#4ADE80',
  'ai-health': '#F87171',
  'ai-education': '#FBBF24',
  'ai-manufacturing': '#94A3B8',
  'ai-public-sector': '#818CF8',
  'ai-media-content': '#E879F9',
  'ai-sustainability': '#22D3EE',
  'ai-psychology': '#FB7185',
  'ai-myths-facts': '#A78BFA',
}

export const DAILY_QUESTION_COUNT = 3
export const BONUS_QUESTION_COUNT = 1
export const FREEPLAY_QUESTION_COUNT = 10
export const BONUS_MULTIPLIER = 1.5
export const SPEED_BONUS_MAX = 50
export const SPEED_BONUS_DECAY = 0.83  // 50 / 60s = ~0.83 per second
export const TIMER_SECONDS = 60

// ── Confidence Betting ──
export type ConfidenceLevel = 1 | 2 | 3

export const CONFIDENCE_SCORES = {
  1: { correct:  50, wrong:    0, bullshit:    0 },  // Vorsichtig
  2: { correct: 150, wrong:  -50, bullshit:  -75 },  // Mittel
  3: { correct: 300, wrong: -150, bullshit: -200 },  // Sicher
} as const

export const CALIBRATION_BONUS = 100
export const CALIBRATION_MALUS = -100
export const BULLSHIT_DETECT_BONUS = 50

export const CONFIDENCE_LABELS = {
  1: { de: 'Hmm...', en: 'Hmm...', emoji: '🤔' },
  2: { de: 'Ziemlich sicher', en: 'Pretty sure', emoji: '🎯' },
  3: { de: 'Absolut sicher!', en: 'Absolutely sure!', emoji: '🔥' },
} as const

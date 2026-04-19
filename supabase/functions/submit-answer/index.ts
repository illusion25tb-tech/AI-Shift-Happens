import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const STREAK_MULTIPLIERS = [1.0, 1.5, 2.0, 2.5, 3.0]
const BONUS_MULTIPLIER = 1.5

// Confidence Betting scores
const CONFIDENCE_SCORES: Record<number, { correct: number; wrong: number; bullshit: number }> = {
  1: { correct:  50, wrong:    0, bullshit:    0 },  // Vorsichtig
  2: { correct: 150, wrong:  -50, bullshit:  -75 },  // Mittel
  3: { correct: 300, wrong: -150, bullshit: -200 },  // Sicher
}

function getStreakMultiplier(streakCount: number, isBonus: boolean): number {
  const maxIndex = isBonus ? 4 : 3
  const index = Math.min(streakCount, maxIndex)
  return STREAK_MULTIPLIERS[index]
}

// Deterministic hash for SHIFT quote selection
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash)
}

// SHIFT quotes — server-side so client can't peek ahead
const SHIFT_QUOTES: Record<string, Record<string, Record<string, string[]>>> = {
  confident_correct: {
    serious: {
      de: ['Korrekt. Fundierte Überzeugung — genau das zählt.', 'Präzise Einschätzung, richtige Entscheidung.', 'Confidence und Kompetenz im Einklang.', 'So sieht fundierte Entscheidungsfindung aus.', 'Souverän. Das ist KI-Readiness.', 'Starke Leistung.'],
      en: ['Correct. Well-founded conviction.', 'Precise assessment, right decision.', 'Confidence and competence aligned.', 'Sound decision-making.', 'Confident and correct. AI readiness.', 'Strong performance.'],
    },
    cheeky: {
      de: ['No cap — das war clean.', 'Sheesh.', 'Main character energy. Verdient.', 'Full send — und gelandet.', 'CEO-Material.', 'GG.', 'Vorstandspräsentation: Bestanden.', 'Das war ein Power Move.'],
      en: ['No cap — that was clean.', 'Sheesh.', 'Main character energy. Earned.', 'Full send — and landed.', 'CEO material.', 'GG.', 'Board presentation: Passed.', 'That was a power move.'],
    },
  },
  confident_wrong: {
    serious: {
      de: ['Hohe Überzeugung, falsches Ergebnis.', 'Selbstsicherheit war hier unbegründet.', 'Die Fakten sagen nein.', 'Überschätzung ist das größte KI-Risiko.', 'Klare Fehleinschätzung.', 'Confidence ohne Grundlage kostet.'],
      en: ['High conviction, wrong outcome.', 'Self-confidence was unfounded here.', 'The facts say no.', 'Overestimation is the biggest AI risk.', 'Clear misjudgment.', 'Confidence without foundation costs.'],
    },
    cheeky: {
      de: ['Uff.', 'Bold move. Hat nicht gezahlt.', 'Main character energy mit Statistenrolle.', 'CEO-Confidence, Praktikanten-Wissen.', 'Reply-All auf die falsche Mail.', 'Fake it till you make it? Not today.', 'Respekt für den Mut. Aber aua.', 'Premium Overconfidence.', 'Alexa, wie löscht man eine Karriereentscheidung?'],
      en: ['Oof.', 'Bold move. Didn\'t pay off.', 'Main character energy with an extra role.', 'CEO confidence, intern knowledge.', 'Reply-All on the wrong email.', 'Fake it till you make it? Not today.', 'Respect for the courage. But ouch.', 'Premium overconfidence.', 'Alexa, how do you undo a career decision?'],
    },
  },
  confident_bullshit: {
    serious: {
      de: ['Buzzwords ersetzen keine Substanz.', 'Die professionell klingende Antwort war die Falle.', 'Komplexe Sprache ist kein Qualitätsmerkmal.', 'Berater-Deutsch. Klingt gut, bringt nichts.', 'Hohle Phrasen erkennen ist eine Kernkompetenz.'],
      en: ['Buzzwords don\'t replace substance.', 'The professional-sounding answer was the trap.', 'Complex language isn\'t a quality marker.', 'Consultant-speak. Sounds great, delivers nothing.', 'Detecting empty phrases is a core skill.'],
    },
    cheeky: {
      de: ['Du bist auf Berater-Deutsch reingefallen.', 'LinkedIn-Post mit 47 Emojis. Genauso falsch.', 'McKinsey hätte 200k berechnet. Gleicher Fehler.', 'Synergistisch transformiert — trotzdem daneben.', 'Agil, disruptiv, innovativ — komplett falsch.', 'Du hast Buzzword-Bingo gewonnen. Aber nicht das Quiz.'],
      en: ['You fell for consultant-speak.', 'LinkedIn post with 47 emojis. Just as wrong.', 'McKinsey would charge 200k. Same mistake.', 'Synergistically transformed — still wrong.', 'Agile, disruptive, innovative — completely wrong.', 'You won buzzword bingo. But not the quiz.'],
    },
  },
  cautious_correct: {
    serious: {
      de: ['Richtig. Vertrauen Sie Ihrem Wissen stärker.', 'Mehr Überzeugung wäre berechtigt.', 'Sie wissen mehr als Sie denken.', 'Gute Analyse, zu wenig Selbstvertrauen.'],
      en: ['Correct. Trust your knowledge more.', 'More conviction would be justified.', 'You know more than you think.', 'Good analysis, too little self-trust.'],
    },
    cheeky: {
      de: ['Du wusstest das. Warum so shy?', 'Imposter Syndrome called. Kannst auflegen.', 'Ferrari im ersten Gang.', 'Mehr YOLO, weniger Hmm.', 'Das war ein Flüster-Mic-Drop.'],
      en: ['You knew this. Why so shy?', 'Imposter syndrome called. You can hang up.', 'Ferrari in first gear.', 'More YOLO, less hmm.', 'That was a whisper mic-drop.'],
    },
  },
  cautious_wrong: {
    serious: {
      de: ['Vorsicht war berechtigt. Kein Schaden.', 'Gute Selbsteinschätzung.', 'Nicht gewusst und richtig eingeschätzt.'],
      en: ['Caution was justified. No damage.', 'Good self-assessment.', 'Didn\'t know and assessed correctly.'],
    },
    cheeky: {
      de: ['Gut, dass du unsicher warst.', 'Self-awareness: 100. KI-Wissen: Wird noch.', 'Wenigstens ehrlich zu dir selbst.', 'Schadensbegrenzung: Profi.'],
      en: ['Good thing you were unsure.', 'Self-awareness: 100. AI knowledge: WIP.', 'At least honest with yourself.', 'Damage control: Pro.'],
    },
  },
  medium_correct: {
    serious: {
      de: ['Richtig. Gesundes Maß an Vorsicht.', 'Gute Einschätzung.', 'Mittelweg hat sich ausgezahlt.'],
      en: ['Correct. Healthy caution.', 'Good assessment.', 'Middle ground paid off.'],
    },
    cheeky: {
      de: ['Solide. Nicht spektakulär, aber solide.', 'Korrekt. Nächstes Mal trau dich.', 'Mittelweg-Andy wins again.'],
      en: ['Solid. Not spectacular, but solid.', 'Correct. Next time dare more.', 'Middle-ground Andy wins again.'],
    },
  },
  medium_wrong: {
    serious: {
      de: ['Vorsicht hat den Schaden begrenzt.', 'Falsch, aber klug abgesichert.', 'Moderate Fehleinschätzung.'],
      en: ['Caution limited the damage.', 'Wrong, but smartly hedged.', 'Moderate misjudgment.'],
    },
    cheeky: {
      de: ['Nope. Aber immerhin kein All-In.', 'L, aber ein kleines L.', 'Passiert. Weiter.'],
      en: ['Nope. At least no all-in.', 'L, but a small L.', 'Happens. Next.'],
    },
  },
}

function pickQuote(situation: string, mode: string, locale: string, questionId: string, userId: string): string {
  const quotes = SHIFT_QUOTES[situation]?.[mode]?.[locale]
  if (!quotes || quotes.length === 0) return ''
  const hash = simpleHash(questionId + userId)
  return quotes[hash % quotes.length]
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await anonClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const {
      question_id,
      selected_index,
      confidence,
      time_ms,
      streak_count,
      is_bonus,
    }: {
      question_id: string
      selected_index: number
      confidence: number
      time_ms: number
      streak_count: number
      is_bonus: boolean
    } = body

    if (question_id === undefined || selected_index === undefined || confidence === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: question_id, selected_index, confidence' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate confidence level
    if (![1, 2, 3].includes(confidence)) {
      return new Response(
        JSON.stringify({ error: 'confidence must be 1, 2, or 3' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Fetch question + user profile (for shift_mode)
    const [questionResult, profileResult] = await Promise.all([
      serviceClient.from('questions').select('*').eq('id', question_id).single(),
      serviceClient.from('profiles').select('shift_mode, locale').eq('id', user.id).single(),
    ])

    if (questionResult.error || !questionResult.data) {
      return new Response(
        JSON.stringify({ error: 'Question not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const question = questionResult.data
    const shiftMode = profileResult.data?.shift_mode ?? 'cheeky'
    const userLocale = profileResult.data?.locale ?? 'de'

    const options = question.options as Array<{ text: string; score: number; feedbackText: string }>
    const selectedOption = options[selected_index]

    if (!selectedOption) {
      return new Response(
        JSON.stringify({ error: 'Invalid selected_index' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Server-side confidence scoring
    const is_correct = selectedOption.score === 100
    const is_dangerous = selectedOption.score < 0
    const is_bullshit_trap = question.is_bullshit_trap ?? false
    const scores = CONFIDENCE_SCORES[confidence]

    let base_score: number
    if (is_correct) {
      base_score = scores.correct
    } else if (is_bullshit_trap) {
      base_score = scores.bullshit
    } else {
      base_score = scores.wrong
    }

    const streak_multi = is_correct
      ? getStreakMultiplier(streak_count ?? 0, is_bonus ?? false)
      : 1.0

    const bonus_multi = (is_bonus ?? false) ? BONUS_MULTIPLIER : 1.0

    const total_score = is_correct
      ? Math.round(base_score * streak_multi * bonus_multi)
      : base_score

    // Pick SHIFT quote based on situation
    let situation: string
    if (is_correct) {
      situation = confidence === 3 ? 'confident_correct' : confidence === 1 ? 'cautious_correct' : 'medium_correct'
    } else if (is_bullshit_trap && confidence === 3) {
      situation = 'confident_bullshit'
    } else {
      situation = confidence === 3 ? 'confident_wrong' : confidence === 1 ? 'cautious_wrong' : 'medium_wrong'
    }

    const shift_quote = pickQuote(situation, shiftMode, userLocale, question_id, user.id)

    return new Response(
      JSON.stringify({
        question_id,
        selected_index,
        confidence,
        base_score,
        streak_multi,
        confidence_multi: confidence,
        bonus_multi,
        total_score,
        feedback_text: selectedOption.feedbackText ?? '',
        mindset_tip: question.mindset_tip ?? '',
        is_correct,
        is_dangerous,
        is_bullshit_trap,
        shift_quote,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('submit-answer error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

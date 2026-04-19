import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const STREAK_MULTIPLIERS = [1.0, 1.5, 2.0, 2.5, 3.0]
const SPEED_BONUS_MAX = 50
const SPEED_BONUS_DECAY = 1.67  // 50 / 30s timer
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

// Deterministic hash for SHIFT quote
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

// SHIFT quotes (compact subset — full set lives in frontend)
const SQ: Record<string, Record<string, string[]>> = {
  confident_correct_de: ['Korrekt. Fundierte Überzeugung.', 'Präzise Einschätzung. Exzellent.', 'Souverän. Das ist KI-Readiness.', 'Starke Leistung.'],
  confident_correct_en: ['Correct. Well-founded conviction.', 'Precise assessment. Excellent.', 'Confident and correct. AI readiness.', 'Strong performance.'],
  confident_correct_cheeky_de: ['No cap — das war clean.', 'Sheesh.', 'CEO-Material.', 'GG.', 'Full send — und gelandet.', 'Das war ein Power Move.'],
  confident_correct_cheeky_en: ['No cap — that was clean.', 'Sheesh.', 'CEO material.', 'GG.', 'Full send — and landed.', 'That was a power move.'],
  confident_wrong_de: ['Hohe Überzeugung, falsches Ergebnis.', 'Überschätzung ist das größte KI-Risiko.', 'Confidence ohne Grundlage kostet.'],
  confident_wrong_en: ['High conviction, wrong outcome.', 'Overestimation is the biggest AI risk.', 'Confidence without foundation costs.'],
  confident_wrong_cheeky_de: ['Uff.', 'Bold move. Hat nicht gezahlt.', 'CEO-Confidence, Praktikanten-Wissen.', 'Fake it till you make it? Not today.', 'Respekt für den Mut. Aber aua.', 'Alexa, wie löscht man eine Karriereentscheidung?'],
  confident_wrong_cheeky_en: ['Oof.', 'Bold move. Didn\'t pay off.', 'CEO confidence, intern knowledge.', 'Fake it till you make it? Not today.', 'Respect for the courage. But ouch.', 'Alexa, how do you undo a career decision?'],
  bullshit_de: ['Buzzwords ersetzen keine Substanz.', 'Berater-Deutsch. Klingt gut, bringt nichts.', 'Hohle Phrasen erkennen ist eine Kernkompetenz.'],
  bullshit_en: ['Buzzwords don\'t replace substance.', 'Consultant-speak. Sounds great, delivers nothing.', 'Detecting empty phrases is a core skill.'],
  bullshit_cheeky_de: ['Du bist auf Berater-Deutsch reingefallen.', 'LinkedIn-Post mit 47 Emojis. Genauso falsch.', 'McKinsey hätte 200k berechnet. Gleicher Fehler.', 'Agil, disruptiv, innovativ — komplett falsch.'],
  bullshit_cheeky_en: ['You fell for consultant-speak.', 'LinkedIn post with 47 emojis. Just as wrong.', 'McKinsey would charge 200k. Same mistake.', 'Agile, disruptive, innovative — completely wrong.'],
  cautious_correct_de: ['Richtig. Vertrauen Sie Ihrem Wissen stärker.', 'Korrekt — mehr Überzeugung wäre berechtigt.'],
  cautious_correct_en: ['Correct. Trust your knowledge more.', 'Right — more conviction would earn more.'],
  cautious_correct_cheeky_de: ['Du wusstest das. Warum so shy?', 'Imposter Syndrome called. Kannst auflegen.', 'Ferrari im ersten Gang.', 'Mehr YOLO, weniger Hmm.'],
  cautious_correct_cheeky_en: ['You knew this. Why so shy?', 'Imposter syndrome called. Hang up.', 'Ferrari in first gear.', 'More YOLO, less hmm.'],
  cautious_wrong_de: ['Vorsicht war berechtigt. Kein Schaden.', 'Gute Selbsteinschätzung.'],
  cautious_wrong_en: ['Caution was justified. No damage.', 'Good self-assessment.'],
  cautious_wrong_cheeky_de: ['Gut, dass du unsicher warst.', 'Self-awareness: 100. KI-Wissen: Wird noch.'],
  cautious_wrong_cheeky_en: ['Good thing you were unsure.', 'Self-awareness: 100. AI knowledge: WIP.'],
  medium_correct_de: ['Richtig. Gesundes Maß an Vorsicht.', 'Korrekt. Mittelweg hat sich ausgezahlt.'],
  medium_correct_en: ['Correct. Healthy caution.', 'Correct. Middle ground paid off.'],
  medium_correct_cheeky_de: ['Solide. Nicht spektakulär, aber solide.', 'Korrekt. Nächstes Mal trau dich.'],
  medium_correct_cheeky_en: ['Solid. Not spectacular, but solid.', 'Correct. Next time dare more.'],
  medium_wrong_de: ['Vorsicht hat den Schaden begrenzt.', 'Moderate Fehleinschätzung.'],
  medium_wrong_en: ['Caution limited the damage.', 'Moderate misjudgment.'],
  medium_wrong_cheeky_de: ['Nope. Aber immerhin kein All-In.', 'Passiert. Weiter.'],
  medium_wrong_cheeky_en: ['Nope. At least no all-in.', 'Happens. Next.'],
}

function pickQuote(situation: string, mode: string, locale: string, qId: string, uId: string): string {
  const key = mode === 'cheeky' ? `${situation}_cheeky_${locale}` : `${situation}_${locale}`
  const arr = SQ[key]
  if (!arr || arr.length === 0) return ''
  return arr[simpleHash(qId + uId) % arr.length]
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth — we verify in code, not at gateway
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
    const { question_id, selected_index, confidence, time_ms, streak_count, is_bonus } = body

    if (question_id === undefined || selected_index === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Fetch question
    const { data: question, error: qErr } = await serviceClient
      .from('questions').select('*').eq('id', question_id).single()

    if (qErr || !question) {
      return new Response(
        JSON.stringify({ error: 'Question not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch profile for shift_mode
    const { data: profile } = await serviceClient
      .from('profiles').select('*').eq('id', user.id).single()

    const shiftMode = (profile as any)?.shift_mode ?? 'cheeky'
    const userLocale = profile?.locale ?? 'de'

    const options = question.options as Array<{ text: string; score: number; feedbackText: string }>
    const selectedOption = options[selected_index]
    if (!selectedOption) {
      return new Response(
        JSON.stringify({ error: 'Invalid selected_index' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const is_correct = selectedOption.score === 100
    const is_dangerous = selectedOption.score < 0
    const is_bullshit_trap = (question as any).is_bullshit_trap ?? false

    // Confidence betting + Speed bonus (60s timer)
    const validConfidence = [1, 2, 3].includes(confidence) ? confidence : 2
    const scores = CONFIDENCE_SCORES[validConfidence]

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

    // Speed bonus: 0-50 for fast correct answers (60s timer, decay 0.83/s)
    const timeMs = Math.max(0, time_ms ?? 60000)
    const speed_bonus = is_correct
      ? Math.max(0, Math.round(SPEED_BONUS_MAX - (timeMs / 1000) * SPEED_BONUS_DECAY))
      : 0

    const total_score = is_correct
      ? Math.round(base_score * streak_multi * bonus_multi + speed_bonus * bonus_multi)
      : base_score

    // SHIFT quote
    let situation = ''
    if (is_correct) {
      situation = (validConfidence === 3) ? 'confident_correct' : (validConfidence === 1) ? 'cautious_correct' : 'medium_correct'
    } else if (is_bullshit_trap && validConfidence === 3) {
      situation = 'bullshit'
    } else {
      situation = (validConfidence === 3) ? 'confident_wrong' : (validConfidence === 1) ? 'cautious_wrong' : 'medium_wrong'
    }
    const shift_quote = pickQuote(situation, shiftMode, userLocale, question_id, user.id)

    return new Response(
      JSON.stringify({
        question_id,
        selected_index,
        confidence: validConfidence,
        base_score,
        streak_multi,
        speed_bonus,
        confidence_multi: validConfidence,
        bonus_multi,
        total_score,
        feedback_text: selectedOption.feedbackText ?? '',
        mindset_tip: question.mindset_tip ?? '',
        is_correct,
        is_dangerous,
        is_bullshit_trap,
        shift_quote: shift_quote || undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('submit-answer error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error', detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

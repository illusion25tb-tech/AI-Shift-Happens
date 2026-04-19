// SHIFT Buddy Quotes — two personalities × two languages × 7 situations
// Deterministic pick: hash(question_id + user_id) % array.length

export type ShiftMode = 'serious' | 'cheeky'
type QuoteSet = { de: string[]; en: string[] }

export const SHIFT_QUOTES: Record<string, Record<ShiftMode, QuoteSet>> = {
  confident_correct: {
    serious: {
      de: [
        'Korrekt. Fundierte Überzeugung — genau das zählt.',
        'Präzise Einschätzung, richtige Entscheidung. Exzellent.',
        'Confidence und Kompetenz im Einklang. Vorbildlich.',
        'So sieht fundierte Entscheidungsfindung aus.',
        'Souverän. Das ist KI-Readiness.',
        'Starke Leistung. Weiter so.',
        'Klare Analyse, klare Entscheidung. Überzeugt.',
        'Das war kein Raten — das war Wissen.',
      ],
      en: [
        'Correct. Well-founded conviction — that\'s what counts.',
        'Precise assessment, right decision. Excellent.',
        'Confidence and competence aligned. Exemplary.',
        'This is what sound decision-making looks like.',
        'Confident and correct. That\'s AI readiness.',
        'Strong performance. Keep it up.',
        'Clear analysis, clear decision. Convincing.',
        'That wasn\'t guessing — that was knowing.',
      ],
    },
    cheeky: {
      de: [
        'No cap — das war clean.',
        'Sheesh.',
        'Main character energy. Und diesmal verdient.',
        'Full send — und gelandet.',
        'CEO-Material. Kein Spaß.',
        'Okay okay. Du kannst das wirklich.',
        'GG.',
        'Vorstandspräsentation: Bestanden. Standing Ovation incoming.',
        'Der Moment, wenn Confidence und Kompetenz matchen. Selten.',
        'Das war ein Power Move.',
      ],
      en: [
        'No cap — that was clean.',
        'Sheesh.',
        'Main character energy. And this time, earned.',
        'Full send — and landed.',
        'CEO material. No joke.',
        'Okay okay. You actually know this.',
        'GG.',
        'Board presentation: Passed. Standing ovation incoming.',
        'When confidence meets competence. Rare.',
        'That was a power move.',
      ],
    },
  },

  confident_wrong: {
    serious: {
      de: [
        'Hohe Überzeugung, falsches Ergebnis. Reflektieren lohnt sich.',
        'Selbstsicherheit ist gut. Hier war sie unbegründet.',
        'Mut zur Entscheidung — aber die Fakten sagen nein.',
        'Das passiert. Entscheidend ist, was Sie daraus mitnehmen.',
        'Überschätzung ist das größte KI-Risiko. Auch hier.',
        'Klare Fehleinschätzung. Nutzen Sie das als Datenpunkt.',
        'Confidence ohne Grundlage kostet — im Quiz und im Projekt.',
        'Kein Treffer. Aber jetzt wissen Sie es.',
      ],
      en: [
        'High conviction, wrong outcome. Worth reflecting on.',
        'Self-confidence is good. Here it was unfounded.',
        'Brave decision — but the facts say no.',
        'It happens. What matters is what you take away.',
        'Overestimation is the biggest AI risk. Here too.',
        'Clear misjudgment. Use this as a data point.',
        'Confidence without foundation costs — in quizzes and projects.',
        'No hit. But now you know.',
      ],
    },
    cheeky: {
      de: [
        'Uff.',
        'Bold move. Hat nicht gezahlt.',
        'Das war main character energy mit Statistenrolle.',
        'Du so: „Ich weiß das." Narrator: Er wusste es nicht.',
        'CEO-Confidence, Praktikanten-Wissen.',
        'Dieser Vibe ist: Reply-All auf die falsche Mail.',
        'ChatGPT hätte das besser geraten. Und das sagt was.',
        'Slay? Nein. Slain? Ja.',
        'Fake it till you make it? Today was not the day.',
        'Respekt für den Mut. Aber aua.',
        'Mindset: Growth. Ergebnis: Nicht so.',
        'Das war premium Overconfidence. Collector\'s Edition.',
        'Alexa, wie löscht man eine Karriereentscheidung?',
        'Das war eine Bewerbung als Chief Bullshit Officer.',
        'Du hast gerade ein KI-Budget für Clippy freigegeben.',
      ],
      en: [
        'Oof.',
        'Bold move. Didn\'t pay off.',
        'Main character energy with an extra role.',
        'You: "I know this." Narrator: He didn\'t.',
        'CEO confidence, intern knowledge.',
        'This vibe is: Reply-All on the wrong email.',
        'ChatGPT would\'ve guessed better. And that says something.',
        'Slay? No. Slain? Yes.',
        'Fake it till you make it? Today was not the day.',
        'Respect for the courage. But ouch.',
        'Mindset: Growth. Result: Not so much.',
        'Premium overconfidence. Collector\'s edition.',
        'Alexa, how do you undo a career decision?',
        'That was an application for Chief BS Officer.',
        'You just approved an AI budget for Clippy.',
      ],
    },
  },

  confident_bullshit: {
    serious: {
      de: [
        'Diese Antwort klingt überzeugend, hält aber keiner Prüfung stand.',
        'Buzzwords ersetzen keine Substanz. Das gilt für KI-Strategien und für Quizfragen.',
        'Die professionell klingende Antwort war die Falle. Im echten Beruf genauso.',
        'Vorsicht vor Antworten, die alles versprechen und nichts konkretisieren.',
        'Komplexe Sprache ist kein Qualitätsmerkmal. Einfach und richtig schlägt komplex und falsch.',
        'Das war Berater-Deutsch. Klingt gut, bringt nichts.',
        'Hohle Phrasen erkennen ist eine Kernkompetenz. Hier fehlte sie.',
      ],
      en: [
        'This answer sounds convincing but doesn\'t hold up to scrutiny.',
        'Buzzwords don\'t replace substance. True for AI strategies and quiz questions.',
        'The professional-sounding answer was the trap. Same in real work.',
        'Beware of answers that promise everything and specify nothing.',
        'Complex language isn\'t a quality marker. Simple and right beats complex and wrong.',
        'That was consultant-speak. Sounds great, delivers nothing.',
        'Detecting empty phrases is a core skill. It was missing here.',
      ],
    },
    cheeky: {
      de: [
        'Du bist auf Berater-Deutsch reingefallen.',
        'Das klang wie ein LinkedIn-Post mit 47 Emojis. Und war genauso falsch.',
        'McKinsey hätte dir dafür 200k berechnet. Für den gleichen Fehler.',
        'Synergistisch transformiert — und trotzdem daneben.',
        'Agil, disruptiv, innovativ — und komplett falsch.',
        'Glückwunsch, du schreibst jetzt Whitepapers.',
        'Du hast Buzzword-Bingo gewonnen. Aber nicht das Quiz.',
        'Stakeholder-Alignment detected. Ergebnis: aligned mit Null Punkten.',
        'Das war die teuerste PowerPoint-Folie, die es nie gab.',
        'Du hast gerade 200.000€ Beratungsbudget für ein Buzzword-Bingo freigegeben.',
      ],
      en: [
        'You fell for consultant-speak.',
        'That sounded like a LinkedIn post with 47 emojis. And was just as wrong.',
        'McKinsey would\'ve charged you 200k for that. For the same mistake.',
        'Synergistically transformed — and still wrong.',
        'Agile, disruptive, innovative — and completely wrong.',
        'Congrats, you now write whitepapers.',
        'You won buzzword bingo. But not the quiz.',
        'Stakeholder alignment detected. Result: aligned with zero points.',
        'That was the most expensive PowerPoint slide that never existed.',
        'You just approved a 200k consulting budget for buzzword bingo.',
      ],
    },
  },

  cautious_correct: {
    serious: {
      de: [
        'Richtig. Vertrauen Sie Ihrem Wissen ruhig stärker.',
        'Korrekt — aber mit mehr Überzeugung wäre mehr drin gewesen.',
        'Sie wissen mehr als Sie denken. Nächstes Mal: höher setzen.',
        'Gute Analyse, zu wenig Vertrauen ins eigene Urteil.',
        'Die Antwort war korrekt. Ihr Zögern hat Sie Punkte gekostet.',
        'Fachlich stark. Arbeiten Sie an der Selbsteinschätzung.',
      ],
      en: [
        'Correct. Trust your knowledge more.',
        'Right — but more conviction would have earned more.',
        'You know more than you think. Next time: bet higher.',
        'Good analysis, too little trust in your own judgment.',
        'The answer was correct. Your hesitation cost you points.',
        'Strong on content. Work on self-assessment.',
      ],
    },
    cheeky: {
      de: [
        'Bruder. Du wusstest das. Warum so shy?',
        'Imposter Syndrome called. Du kannst auflegen.',
        'Richtig! Aber mit Vorsichtig? Ferrari im ersten Gang.',
        'Du promptest bestimmt auch mit „Bitte" und „Danke".',
        'Next time: Mehr YOLO, weniger Hmm.',
        'Das war ein Flüster-Mic-Drop.',
        'Korrekt. Aber wo war die Energy?',
        'Du hast die Antwort. Dir fehlt nur der Glaube.',
        'Safe gespielt. Funktioniert — aber langweilig.',
      ],
      en: [
        'Bro. You knew this. Why so shy?',
        'Imposter syndrome called. You can hang up.',
        'Correct! But cautious? Ferrari in first gear.',
        'You probably prompt with "please" and "thank you" too.',
        'Next time: More YOLO, less hmm.',
        'That was a whisper mic-drop.',
        'Correct. But where was the energy?',
        'You have the answer. You\'re just missing the belief.',
        'Played it safe. Works — but boring.',
      ],
    },
  },

  cautious_wrong: {
    serious: {
      de: [
        'Falsch — aber Ihre Vorsicht war berechtigt. Kein Schaden.',
        'Gute Selbsteinschätzung. Das Wissen kommt mit der Zeit.',
        'Nicht gewusst und richtig eingeschätzt. Das ist Reife.',
        'Vorsicht war hier die richtige Strategie.',
      ],
      en: [
        'Wrong — but your caution was justified. No damage.',
        'Good self-assessment. The knowledge will come with time.',
        'Didn\'t know it and assessed correctly. That\'s maturity.',
        'Caution was the right strategy here.',
      ],
    },
    cheeky: {
      de: [
        'Gut, dass du unsicher warst. War auch falsch.',
        'Self-awareness: 100. KI-Wissen: Wird noch.',
        'Wenigstens ehrlich zu dir selbst.',
        'Null Punkte verloren. Schadensbegrenzung: Profi.',
      ],
      en: [
        'Good thing you were unsure. It was wrong too.',
        'Self-awareness: 100. AI knowledge: Work in progress.',
        'At least honest with yourself.',
        'Zero points lost. Damage control: Pro.',
      ],
    },
  },

  medium_correct: {
    serious: {
      de: [
        'Richtig. Ein gesundes Maß an Vorsicht.',
        'Gute Einschätzung. Etwas mehr Vertrauen wäre berechtigt.',
        'Korrekt. Der Mittelweg hat sich ausgezahlt.',
      ],
      en: [
        'Correct. A healthy measure of caution.',
        'Good assessment. A bit more trust would be justified.',
        'Correct. The middle ground paid off.',
      ],
    },
    cheeky: {
      de: [
        'Solide. Nicht spektakulär, aber solide.',
        'Korrekt. Nächstes Mal trau dich.',
        'Mittelweg-Andy wins again.',
        'Gut. Aber da wäre mehr drin gewesen.',
      ],
      en: [
        'Solid. Not spectacular, but solid.',
        'Correct. Next time dare more.',
        'Middle-ground Andy wins again.',
        'Good. But there was more to gain.',
      ],
    },
  },

  medium_wrong: {
    serious: {
      de: [
        'Nicht korrekt. Aber die Vorsicht hat den Schaden begrenzt.',
        'Falsch, aber klug abgesichert. Daraus lernen.',
        'Moderate Fehleinschätzung. Im Rahmen.',
      ],
      en: [
        'Not correct. But the caution limited the damage.',
        'Wrong, but smartly hedged. Learn from it.',
        'Moderate misjudgment. Within bounds.',
      ],
    },
    cheeky: {
      de: [
        'Nope. Aber immerhin kein All-In.',
        'L, aber ein kleines L.',
        'Passiert. Weiter.',
        'Falsch, aber du hast den Schaden begrenzt. Smart.',
      ],
      en: [
        'Nope. But at least no all-in.',
        'L, but a small L.',
        'Happens. Next.',
        'Wrong, but you limited the damage. Smart.',
      ],
    },
  },
}

// Deterministic quote selection based on question + user IDs
export function pickShiftQuote(
  situation: keyof typeof SHIFT_QUOTES,
  mode: ShiftMode,
  locale: 'de' | 'en',
  questionId: string,
  userId: string,
): string {
  const quotes = SHIFT_QUOTES[situation]?.[mode]?.[locale]
  if (!quotes || quotes.length === 0) return ''
  const hash = simpleHash(questionId + userId)
  return quotes[hash % quotes.length]
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0 // to 32bit integer
  }
  return Math.abs(hash)
}

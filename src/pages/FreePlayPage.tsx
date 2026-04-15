import { useState, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useLocale } from '../hooks/useLocale'
import { CATEGORIES, CATEGORY_LABELS, FREEPLAY_QUESTION_COUNT } from '../lib/constants'
import ProgressBar from '../components/ProgressBar'
import ScoreDisplay from '../components/ScoreDisplay'
import TimerBar from '../components/TimerBar'
import QuizCard from '../components/QuizCard'
import FeedbackCard from '../components/FeedbackCard'
import ResultScreen from '../components/ResultScreen'
import type { QuestionForClient, AnswerResult } from '../types'
import type { CategoryId } from '../lib/constants'

type FreePlayState = 'select' | 'loading' | 'playing' | 'feedback' | 'finished' | 'error'

export function FreePlayPage() {
  const navigate = useNavigate()
  const { locale, t } = useLocale()
  const [state, setState] = useState<FreePlayState>('select')
  const [, setSelectedCategory] = useState<CategoryId | 'all'>('all')
  const [questions, setQuestions] = useState<QuestionForClient[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerResult[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const streakRef = useRef(0)
  const elapsedMsRef = useRef(0)

  const onTimeUpdate = useCallback((ms: number) => {
    elapsedMsRef.current = ms
  }, [])

  const startGame = useCallback(async (category: CategoryId | 'all') => {
    setSelectedCategory(category)
    setState('loading')
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error: fnError } = await supabase.functions.invoke('get-freeplay-questions', {
        body: {
          category: category === 'all' ? undefined : category,
          locale,
          count: FREEPLAY_QUESTION_COUNT,
        },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      })

      if (fnError || !data?.questions?.length) {
        setState('error')
        setError(locale === 'de' ? 'Keine Fragen gefunden.' : 'No questions found.')
        return
      }

      setQuestions(data.questions)
      setCurrentIndex(0)
      setAnswers([])
      setTotalScore(0)
      setCurrentStreak(0)
      streakRef.current = 0
      setMaxStreak(0)
      setState('playing')
    } catch (err) {
      setState('error')
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [locale])

  const handleSelect = useCallback(async (selectedIndex: number) => {
    const question = questions[currentIndex]
    if (!question) return

    setState('loading')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error: fnError } = await supabase.functions.invoke('submit-answer', {
        body: {
          question_id: question.id,
          selected_index: selectedIndex,
          time_ms: elapsedMsRef.current,
          streak_count: streakRef.current + 1,
          is_bonus: false,
        },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      })

      if (fnError) {
        setState('error')
        setError(fnError.message ?? 'Submit error')
        return
      }

      const result: AnswerResult = data

      let newStreak = streakRef.current
      if (result.is_dangerous) {
        newStreak = 0
      } else if (result.is_correct) {
        newStreak = streakRef.current + 1
      }
      streakRef.current = newStreak

      setAnswers(prev => [...prev, result])
      setTotalScore(prev => prev + result.total_score)
      setCurrentStreak(newStreak)
      setMaxStreak(prev => Math.max(prev, newStreak))
      setState('feedback')
    } catch (err) {
      setState('error')
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [questions, currentIndex])

  const handleNext = useCallback(() => {
    if (currentIndex >= questions.length - 1) {
      setState('finished')
    } else {
      setCurrentIndex(prev => prev + 1)
      setState('playing')
    }
  }, [currentIndex, questions.length])

  const playAgain = useCallback(() => {
    setState('select')
    setQuestions([])
    setAnswers([])
  }, [])

  const currentQuestion = questions[currentIndex] ?? null
  const lastAnswer = answers.length > 0 ? answers[answers.length - 1] : null
  const isLastQuestion = currentIndex >= questions.length - 1

  // Category selection screen
  if (state === 'select') {
    return (
      <div className="min-h-screen bg-bg-base text-text-primary font-sans flex flex-col">
        <header className="flex items-center gap-3 px-5 py-4 border-b border-white/6">
          <Link to="/app" className="text-text-muted hover:text-text-primary transition-colors text-lg">&larr;</Link>
          <span className="text-lg font-bold tracking-tight text-primary">Free Play</span>
        </header>

        <main className="flex-1 flex flex-col px-5 py-6 gap-4 max-w-md mx-auto w-full">
          <p className="text-text-secondary text-sm">
            {locale === 'de'
              ? `Wähle eine Kategorie oder spiele alle. ${FREEPLAY_QUESTION_COUNT} zufällige Fragen pro Runde.`
              : `Choose a category or play all. ${FREEPLAY_QUESTION_COUNT} random questions per round.`}
          </p>

          <button
            onClick={() => startGame('all')}
            className="w-full bg-primary/20 border border-primary/30 rounded-2xl px-5 py-4 text-left hover:bg-primary/30 transition-colors"
          >
            <div className="text-lg font-bold text-primary">🎲 {locale === 'de' ? 'Alle Kategorien' : 'All Categories'}</div>
            <div className="text-text-secondary text-sm mt-1">
              {locale === 'de' ? 'Zufällig gemischt aus allen 10 Bereichen' : 'Randomly mixed from all 10 areas'}
            </div>
          </button>

          <div className="flex flex-col gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => startGame(cat)}
                className="w-full bg-white/4 border border-white/6 rounded-xl px-4 py-3 text-left hover:border-primary/30 transition-colors"
              >
                <span className="font-semibold text-sm">{CATEGORY_LABELS[cat][locale]}</span>
              </button>
            ))}
          </div>
        </main>
      </div>
    )
  }

  // Loading (initial)
  if (state === 'loading' && questions.length === 0) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  // Error
  if (state === 'error') {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-4 px-5">
        <p className="text-danger text-center">{error}</p>
        <button onClick={playAgain} className="text-primary hover:text-primary-hover underline text-sm transition-colors">
          {locale === 'de' ? 'Zurück zur Auswahl' : 'Back to selection'}
        </button>
      </div>
    )
  }

  // Finished
  if (state === 'finished') {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col">
        <header className="flex items-center px-5 py-4 border-b border-bg-card-border">
          <button onClick={playAgain} className="text-text-secondary hover:text-text-primary transition-colors text-lg">&larr;</button>
        </header>
        <div className="flex-1 flex flex-col justify-center px-5 py-8 max-w-md mx-auto w-full">
          <ResultScreen
            score={totalScore}
            answers={answers}
            maxStreak={maxStreak}
            locale={locale}
            onBack={playAgain}
            t={t}
          />
        </div>
      </div>
    )
  }

  // Playing / Feedback
  if (!currentQuestion) return null

  const isPlaying = state === 'playing'
  const isFeedback = state === 'feedback'

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <header className="flex items-center justify-between px-5 py-4 border-b border-bg-card-border">
        <button onClick={() => navigate('/app')} className="text-text-secondary hover:text-text-primary transition-colors text-lg">&larr;</button>
        <ScoreDisplay score={totalScore} streak={currentStreak} />
      </header>

      <div className="px-5 pt-4 pb-2 max-w-md mx-auto w-full space-y-2">
        <ProgressBar current={currentIndex} total={questions.length} bonusIndex={-1} />
        <TimerBar maxSeconds={30} onTimeUpdate={onTimeUpdate} running={isPlaying} />
      </div>

      <div className="flex-1 px-5 py-4 max-w-md mx-auto w-full space-y-4 overflow-y-auto">
        <QuizCard
          question={currentQuestion}
          locale={locale}
          disabled={!isPlaying}
          onSelect={handleSelect}
        />

        {isFeedback && lastAnswer && (
          <FeedbackCard
            result={lastAnswer}
            streak={currentStreak}
            isLast={isLastQuestion}
            onNext={handleNext}
            t={t}
          />
        )}
      </div>
    </div>
  )
}

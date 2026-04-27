import { useEffect, useRef, useCallback, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../hooks/useLocale'
import { useQuiz } from '../hooks/useQuiz'
import { lf } from '../lib/constants'
import ProgressBar from '../components/ProgressBar'
import ScoreDisplay from '../components/ScoreDisplay'
import TimerBar from '../components/TimerBar'
import QuizCard from '../components/QuizCard'
import FeedbackCard from '../components/FeedbackCard'
import ResultScreen from '../components/ResultScreen'
import BadgeUnlock from '../components/BadgeUnlock'

export function DailyQuizPage() {
  const navigate = useNavigate()
  useAuth()
  const { locale, t } = useLocale()
  const quiz = useQuiz()

  const [showBadgeUnlock, setShowBadgeUnlock] = useState(true)

  const elapsedMsRef = useRef<number>(0)

  const onTimeUpdate = useCallback((ms: number) => {
    elapsedMsRef.current = ms
  }, [])

  useEffect(() => {
    quiz.startDaily()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelect = (index: number, confidence: 1 | 2 | 3) => {
    quiz.submitAnswer(index, confidence, elapsedMsRef.current)
  }

  const handleNext = () => {
    quiz.nextQuestion()
  }

  const handleBack = () => {
    navigate('/app')
  }

  // Bonus question index: last question (index = questions.length - 1)
  const bonusIndex = quiz.questions.length > 0 ? quiz.questions.length - 1 : -1

  // Loading state
  if (quiz.gameState === 'loading' || quiz.gameState === 'idle') {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  // Weekend state
  if (quiz.gameState === 'weekend') {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-6 px-5">
        <div className="text-6xl">☀️</div>
        <h2 className="text-xl font-bold text-center">
          {lf({ de: 'Wochenende!', en: 'Weekend!', tr: 'Hafta Sonu!', es: '¡Fin de semana!' }, locale)}
        </h2>
        <p className="text-text-secondary text-center text-sm max-w-xs">
          {locale === 'de'
            ? 'Das Daily Quiz findet Mo\u2013Fr statt. Dein Streak bleibt über das Wochenende erhalten!'
            : 'The daily quiz runs Mon\u2013Fri. Your streak is preserved over the weekend!'}
        </p>
        <Link
          to="/app/freeplay"
          className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-xl transition-colors"
        >
          {lf({ de: '🎮 Free Play starten', en: '🎮 Start Free Play', tr: '🎮 Serbest Oyunu Başlat', es: '🎮 Iniciar Juego Libre' }, locale)}
        </Link>
        <Link
          to="/app/challenge"
          className="border border-white/10 text-text-secondary font-semibold py-3 px-8 rounded-xl hover:bg-white/4 transition-colors"
        >
          {lf({ de: '⚔️ Challenge starten', en: '⚔️ Start Challenge', tr: '⚔️ Düello Başlat', es: '⚔️ Iniciar Duelo' }, locale)}
        </Link>
        <button onClick={handleBack} className="text-text-muted text-sm hover:text-text-secondary">
          &larr; {lf({ de: 'Zurück', en: 'Back', tr: 'Geri', es: 'Atrás' }, locale)}
        </button>
      </div>
    )
  }

  // Error state
  if (quiz.gameState === 'error') {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-4 px-5">
        <p className="text-danger text-center">{quiz.error ?? t('quiz.error')}</p>
        <button
          onClick={handleBack}
          className="text-primary hover:text-primary-hover underline text-sm transition-colors"
        >
          ← {t('quiz.back')}
        </button>
      </div>
    )
  }

  // Finished state
  if (quiz.gameState === 'finished') {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col">
        <header className="flex items-center px-5 py-4 border-b border-bg-card-border">
          <button
            onClick={handleBack}
            className="text-text-secondary hover:text-text-quiz transition-colors text-lg"
          >
            ←
          </button>
        </header>
        <div className="flex-1 flex flex-col justify-center px-5 py-8 max-w-md mx-auto w-full">
          <>
            {showBadgeUnlock && quiz.gamificationResult?.new_badges && quiz.gamificationResult.new_badges.length > 0 && (
              <AnimatePresence>
                <BadgeUnlock
                  badgeTypes={quiz.gamificationResult.new_badges}
                  locale={locale}
                  onClose={() => setShowBadgeUnlock(false)}
                />
              </AnimatePresence>
            )}
            <ResultScreen
              score={quiz.totalScore}
              answers={quiz.answers}
              maxStreak={quiz.maxStreak}
              locale={locale}
              onBack={handleBack}
              t={t}
              gamificationResult={quiz.gamificationResult}
            />
          </>
        </div>
      </div>
    )
  }

  // Playing or feedback state
  const currentQuestion = quiz.currentQuestion
  if (!currentQuestion) return null

  const isPlaying = quiz.gameState === 'playing'
  const isFeedback = quiz.gameState === 'feedback'

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-bg-card-border">
        <button
          onClick={handleBack}
          className="text-text-secondary hover:text-text-quiz transition-colors text-lg"
        >
          ←
        </button>
        <ScoreDisplay score={quiz.totalScore} streak={quiz.currentStreak} />
      </header>

      {/* Progress */}
      <div className="px-5 pt-4 pb-2 max-w-md mx-auto w-full space-y-2">
        <ProgressBar
          current={quiz.currentIndex}
          total={quiz.questions.length}
          bonusIndex={bonusIndex}
        />
        <TimerBar
          maxSeconds={60}
          onTimeUpdate={onTimeUpdate}
          running={isPlaying}
        />
      </div>

      {/* Quiz content */}
      <div className="flex-1 px-5 py-4 max-w-md mx-auto w-full space-y-4 overflow-y-auto">
        <QuizCard
          question={currentQuestion}
          locale={locale}
          disabled={!isPlaying}
          onSubmit={handleSelect}
        />

        {isFeedback && quiz.lastAnswer && (
          <FeedbackCard
            result={quiz.lastAnswer}
            streak={quiz.currentStreak}
            isLast={quiz.isLastQuestion}
            onNext={handleNext}
            t={t}
          />
        )}
      </div>
    </div>
  )
}

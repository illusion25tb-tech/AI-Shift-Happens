import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useLocale } from '../hooks/useLocale'
import { useAuth } from '../hooks/useAuth'
import { lf } from '../lib/constants'

const L = {
  challenge1v1: { de: '1v1 Challenge', en: '1v1 Challenge', tr: '1v1 Düello', es: 'Duelo 1v1' },
  challengeSomeone: { de: 'Fordere jemanden heraus!', en: 'Challenge someone!', tr: 'Birine meydan oku!', es: '¡Reta a alguien!' },
  startChallenge: { de: 'Challenge starten', en: 'Start Challenge', tr: 'Düello Başlat', es: 'Iniciar Duelo' },
  back: { de: 'Zurück', en: 'Back', tr: 'Geri', es: 'Atrás' },
  opponent: { de: 'Gegner', en: 'Opponent', tr: 'Rakip', es: 'Oponente' },
  you: { de: 'Du', en: 'You', tr: 'Sen', es: 'Tú' },
  waiting: { de: 'Wartet...', en: 'Waiting...', tr: 'Bekliyor...', es: 'Esperando...' },
  youWin: { de: '🎉 Du gewinnst!', en: '🎉 You win!', tr: '🎉 Kazandın!', es: '🎉 ¡Ganaste!' },
  closeLoss: { de: '😤 Knapp verloren!', en: '😤 Close loss!', tr: '😤 Kıl payı kaybettin!', es: '😤 ¡Pérdida ajustada!' },
  tie: { de: '🤝 Unentschieden!', en: '🤝 Tie!', tr: '🤝 Berabere!', es: '🤝 ¡Empate!' },
  shareLink: { de: 'Challenge-Link teilen', en: 'Share challenge link', tr: 'Düello bağlantısını paylaş', es: 'Compartir enlace del duelo' },
  copy: { de: 'Kopieren', en: 'Copy', tr: 'Kopyala', es: 'Copiar' },
  copyLink: { de: '🔗 Challenge-Link kopieren', en: '🔗 Copy challenge link', tr: '🔗 Düello bağlantısını kopyala', es: '🔗 Copiar enlace del duelo' },
  backToDashboard: { de: 'Zurück zum Dashboard', en: 'Back to Dashboard', tr: 'Panele Geri Dön', es: 'Volver al Panel' },
}
import ProgressBar from '../components/ProgressBar'
import ScoreDisplay from '../components/ScoreDisplay'
import TimerBar from '../components/TimerBar'
import QuizCard from '../components/QuizCard'
import FeedbackCard from '../components/FeedbackCard'
import type { QuestionForClient, AnswerResult } from '../types'

type ChallengeState = 'menu' | 'creating' | 'loading' | 'playing' | 'feedback' | 'finished' | 'result' | 'error'

interface ChallengeInfo {
  challenge_id: string
  challenger_name: string
  challenger_score: number | null
  challenged_score: number | null
  is_challenger: boolean
  already_played: boolean
  completed: boolean
}

export function ChallengePage() {
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { locale, t } = useLocale()

  const [state, setState] = useState<ChallengeState>('menu')
  const [challengeInfo, setChallengeInfo] = useState<ChallengeInfo | null>(null)
  const [questions, setQuestions] = useState<QuestionForClient[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerResult[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [, setMaxStreak] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [challengeLink, setChallengeLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const streakRef = useRef(0)
  const elapsedMsRef = useRef(0)
  const onTimeUpdate = useCallback((ms: number) => { elapsedMsRef.current = ms }, [])

  // Check for challenge_id in URL
  const challengeIdFromUrl = searchParams.get('id')

  useEffect(() => {
    if (challengeIdFromUrl) {
      loadChallenge(challengeIdFromUrl)
    }
  }, [challengeIdFromUrl])

  const loadChallenge = useCallback(async (challengeId: string) => {
    setState('loading')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error: fnError } = await supabase.functions.invoke('get-challenge', {
        body: { challenge_id: challengeId },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      })

      if (fnError || data?.error) {
        setState('error')
        setError(data?.error ?? fnError?.message ?? 'Challenge not found')
        return
      }

      setChallengeInfo(data)

      if (data.already_played) {
        setState('result')
      } else {
        setQuestions(data.questions ?? [])
        setCurrentIndex(0)
        setAnswers([])
        setTotalScore(0)
        setCurrentStreak(0)
        streakRef.current = 0
        setMaxStreak(0)
        setState('playing')
      }
    } catch (err) {
      setState('error')
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [])

  const createChallenge = useCallback(async () => {
    setState('creating')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error: fnError } = await supabase.functions.invoke('create-challenge', {
        body: { locale },
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      })

      if (fnError || data?.error) {
        setState('error')
        setError(data?.error ?? fnError?.message ?? 'Failed to create challenge')
        return
      }

      const link = `${window.location.origin}${import.meta.env.BASE_URL}app/challenge?id=${data.challenge_id}`
      setChallengeLink(link)

      // Now load and play the challenge ourselves
      loadChallenge(data.challenge_id)
    } catch (err) {
      setState('error')
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [locale, loadChallenge])

  const handleSelect = useCallback(async (selectedIndex: number, confidence: 1 | 2 | 3) => {
    const question = questions[currentIndex]
    if (!question) return

    setState('loading')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error: fnError } = await supabase.functions.invoke('submit-answer', {
        body: {
          question_id: question.id,
          selected_index: selectedIndex,
          confidence,
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
      if (result.is_dangerous) newStreak = 0
      else if (result.is_correct) newStreak = streakRef.current + 1
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

  const handleNext = useCallback(async () => {
    if (currentIndex >= questions.length - 1) {
      // Save score to challenge
      if (challengeInfo) {
        const scoreField = challengeInfo.is_challenger ? 'challenger_score' : 'challenged_score'
        const updateData: Record<string, any> = { [scoreField]: totalScore }

        // If opponent already played, mark challenge as completed + check winner
        const opponentScore = challengeInfo.is_challenger
          ? challengeInfo.challenged_score
          : challengeInfo.challenger_score
        if (opponentScore !== null) {
          updateData.completed_at = new Date().toISOString()

          // Award duelist badge if we won
          if (totalScore > opponentScore) {
            supabase.from('user_badges')
              .upsert({ user_id: user?.id, badge_type: 'duelist' }, { onConflict: 'user_id,badge_type' })
              .then(() => {})
          }
        }

        // Update challenged_id if we're the opponent
        if (!challengeInfo.is_challenger) {
          updateData.challenged_id = user?.id
        }

        await supabase
          .from('challenges')
          .update(updateData)
          .eq('id', challengeInfo.challenge_id)

        setChallengeInfo(prev => prev ? {
          ...prev,
          [challengeInfo.is_challenger ? 'challenger_score' : 'challenged_score']: totalScore,
        } : null)
      }
      setState('result')
    } else {
      setCurrentIndex(prev => prev + 1)
      setState('playing')
    }
  }, [currentIndex, questions.length, challengeInfo, totalScore, user])

  const copyLink = useCallback(() => {
    if (!challengeLink) return
    navigator.clipboard.writeText(challengeLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [challengeLink])

  const currentQuestion = questions[currentIndex] ?? null
  const lastAnswer = answers.length > 0 ? answers[answers.length - 1] : null
  const isLastQuestion = currentIndex >= questions.length - 1
  const isPlaying = state === 'playing'
  const isFeedback = state === 'feedback'

  // Menu — create new challenge
  if (state === 'menu') {
    return (
      <div className="min-h-screen bg-bg-base text-text-primary font-sans flex flex-col">
        <header className="flex items-center gap-3 px-5 py-4 border-b border-white/6">
          <Link to="/app" className="text-text-muted hover:text-text-primary text-lg">&larr;</Link>
          <span className="text-lg font-bold tracking-tight text-primary">
            {lf(L.challenge1v1, locale)}
          </span>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-5 gap-6">
          <div className="text-6xl">⚔️</div>
          <h2 className="text-xl font-bold text-center">
            {lf(L.challengeSomeone, locale)}
          </h2>
          <p className="text-text-secondary text-sm text-center max-w-xs">
            {lf({
              de: '5 gleiche Fragen für beide Spieler. Wer holt mehr Punkte?',
              en: '5 identical questions for both players. Who scores more?',
              tr: 'Her iki oyuncu için 5 aynı soru. Kim daha çok puan alır?',
              es: '5 preguntas idénticas para ambos jugadores. ¿Quién consigue más puntos?',
            }, locale)}
          </p>
          <button
            onClick={createChallenge}
            className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-xl transition-colors"
          >
            {lf(L.startChallenge, locale)}
          </button>
        </main>
      </div>
    )
  }

  // Creating / Loading
  if (state === 'creating' || (state === 'loading' && questions.length === 0)) {
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
        <Link to="/app" className="text-primary hover:underline text-sm">&larr; {lf(L.back, locale)}</Link>
      </div>
    )
  }

  // Result / comparison
  if (state === 'result') {
    const myScore = challengeInfo?.is_challenger ? challengeInfo.challenger_score : challengeInfo?.challenged_score
    const opponentScore = challengeInfo?.is_challenger ? challengeInfo.challenged_score : challengeInfo?.challenger_score
    const opponentName = challengeInfo?.is_challenger ? lf(L.opponent, locale) : (challengeInfo?.challenger_name ?? 'Challenger')
    const finalMyScore = myScore ?? totalScore

    return (
      <div className="min-h-screen bg-bg-base text-text-primary font-sans flex flex-col">
        <header className="flex items-center gap-3 px-5 py-4 border-b border-white/6">
          <Link to="/app" className="text-text-muted hover:text-text-primary text-lg">&larr;</Link>
          <span className="text-lg font-bold tracking-tight text-primary">Challenge</span>
        </header>
        <main className="flex-1 flex flex-col px-5 py-8 max-w-md mx-auto w-full gap-6">
          {/* Score comparison */}
          <div className="text-center space-y-4">
            <div className="text-4xl">⚔️</div>

            <div className="flex items-center justify-center gap-6">
              {/* My score */}
              <div className="text-center flex-1">
                <p className="text-xs text-text-muted uppercase">{lf(L.you, locale)}</p>
                <p className="text-3xl font-mono font-bold text-primary">{finalMyScore}</p>
              </div>

              <div className="text-text-muted text-xl font-bold">vs</div>

              {/* Opponent score */}
              <div className="text-center flex-1">
                <p className="text-xs text-text-muted uppercase">{opponentName}</p>
                {opponentScore !== null && opponentScore !== undefined ? (
                  <p className="text-3xl font-mono font-bold text-fire">{opponentScore}</p>
                ) : (
                  <p className="text-sm text-text-muted italic mt-2">
                    {lf(L.waiting, locale)}
                  </p>
                )}
              </div>
            </div>

            {opponentScore !== null && opponentScore !== undefined && (
              <div className="text-lg font-bold mt-4">
                {finalMyScore > opponentScore
                  ? lf(L.youWin, locale)
                  : finalMyScore < opponentScore
                  ? lf(L.closeLoss, locale)
                  : lf(L.tie, locale)}
              </div>
            )}
          </div>

          {/* Share link */}
          {challengeLink && (
            <div className="bg-white/4 border border-white/6 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-text-muted uppercase">
                {lf(L.shareLink, locale)}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={challengeLink}
                  readOnly
                  className="flex-1 bg-white/6 border border-white/10 rounded-lg px-3 py-2 text-xs text-text-secondary font-mono truncate"
                />
                <button
                  onClick={copyLink}
                  className="text-xs font-semibold px-3 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                >
                  {copied ? '✓' : lf(L.copy, locale)}
                </button>
              </div>
            </div>
          )}

          {/* If we haven't shared link yet, generate one */}
          {!challengeLink && challengeInfo && (
            <button
              onClick={() => {
                const link = `${window.location.origin}${import.meta.env.BASE_URL}app/challenge?id=${challengeInfo.challenge_id}`
                setChallengeLink(link)
                navigator.clipboard.writeText(link)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="w-full bg-primary/20 text-primary font-semibold py-3 rounded-xl hover:bg-primary/30 transition-colors"
            >
              {lf(L.copyLink, locale)}
            </button>
          )}

          <Link
            to="/app"
            className="w-full text-center border border-white/10 text-text-secondary font-semibold py-3 rounded-xl hover:bg-white/4 transition-colors"
          >
            {lf(L.backToDashboard, locale)}
          </Link>
        </main>
      </div>
    )
  }

  // Playing / Feedback
  if (!currentQuestion) return null

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <header className="flex items-center justify-between px-5 py-4 border-b border-bg-card-border">
        <Link to="/app" className="text-text-secondary hover:text-text-primary transition-colors text-lg">&larr;</Link>
        <ScoreDisplay score={totalScore} streak={currentStreak} />
      </header>

      <div className="px-5 pt-4 pb-2 max-w-md mx-auto w-full space-y-2">
        <ProgressBar current={currentIndex} total={questions.length} bonusIndex={-1} />
        <TimerBar maxSeconds={60} onTimeUpdate={onTimeUpdate} running={isPlaying} />
      </div>

      <div className="flex-1 px-5 py-4 max-w-md mx-auto w-full space-y-4 overflow-y-auto">
        <QuizCard
          question={currentQuestion}
          locale={locale}
          disabled={!isPlaying}
          onSubmit={handleSelect}
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

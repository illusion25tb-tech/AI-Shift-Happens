import { useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { GameState, QuestionForClient, AnswerResult } from '../types'

interface QuizState {
  gameState: GameState
  questions: QuestionForClient[]
  currentIndex: number
  answers: AnswerResult[]
  totalScore: number
  currentStreak: number
  maxStreak: number
  dailyQuizId: string | null
  error: string | null
}

const initialState: QuizState = {
  gameState: 'idle',
  questions: [],
  currentIndex: 0,
  answers: [],
  totalScore: 0,
  currentStreak: 0,
  maxStreak: 0,
  dailyQuizId: null,
  error: null,
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function callEdgeFunction(name: string, body?: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Edge function error: ${res.status}`)
  return data
}

interface UseQuizReturn extends QuizState {
  currentQuestion: QuestionForClient | null
  lastAnswer: AnswerResult | null
  isLastQuestion: boolean
  startDaily: () => Promise<void>
  submitAnswer: (selectedIndex: number, timeMs: number) => Promise<void>
  nextQuestion: () => void
  reset: () => void
}

export function useQuiz(): UseQuizReturn {
  const [state, setState] = useState<QuizState>(initialState)
  const stateRef = useRef<QuizState>(initialState)

  const setStateAndRef = useCallback((updater: (prev: QuizState) => QuizState) => {
    setState(prev => {
      const next = updater(prev)
      stateRef.current = next
      return next
    })
  }, [])

  const startDaily = useCallback(async () => {
    setStateAndRef(prev => ({ ...prev, gameState: 'loading', error: null }))

    try {
      const data = await callEdgeFunction('get-daily-quiz')

      if (data.already_played) {
        const attempt = data.attempt
        setStateAndRef(prev => ({
          ...prev,
          gameState: 'finished',
          totalScore: attempt?.total_score ?? 0,
          maxStreak: attempt?.max_streak ?? 0,
          answers: attempt?.answers ?? [],
          dailyQuizId: attempt?.daily_quiz_id ?? null,
        }))
        return
      }

      setStateAndRef(prev => ({
        ...prev,
        questions: data.questions ?? [],
        dailyQuizId: data.daily_quiz_id ?? null,
        currentIndex: 0,
        answers: [],
        totalScore: 0,
        currentStreak: 0,
        maxStreak: 0,
        gameState: 'playing',
      }))
    } catch (err) {
      setStateAndRef(prev => ({
        ...prev,
        gameState: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      }))
    }
  }, [setStateAndRef])

  const submitAnswer = useCallback(async (selectedIndex: number, timeMs: number) => {
    const current = stateRef.current
    const question = current.questions[current.currentIndex]
    if (!question) return

    setStateAndRef(prev => ({ ...prev, gameState: 'loading' }))

    try {
      const result: AnswerResult = await callEdgeFunction('submit-answer', {
        question_id: question.id,
        selected_index: selectedIndex,
        time_ms: timeMs,
        streak_count: current.currentStreak + 1,
        is_bonus: question.is_bonus,
      })

      setStateAndRef(prev => {
        const newAnswers = [...prev.answers, result]
        const newTotalScore = prev.totalScore + result.total_score
        const newStreak = result.is_dangerous ? 0 : result.is_correct ? prev.currentStreak + 1 : prev.currentStreak
        const newMaxStreak = Math.max(prev.maxStreak, newStreak)

        return {
          ...prev,
          answers: newAnswers,
          totalScore: newTotalScore,
          currentStreak: newStreak,
          maxStreak: newMaxStreak,
          gameState: 'feedback',
        }
      })
    } catch (err) {
      setStateAndRef(prev => ({
        ...prev,
        gameState: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      }))
    }
  }, [setStateAndRef])

  const nextQuestion = useCallback(() => {
    setStateAndRef(prev => {
      const isLast = prev.currentIndex >= prev.questions.length - 1
      if (isLast) return { ...prev, gameState: 'finished' }
      return { ...prev, currentIndex: prev.currentIndex + 1, gameState: 'playing' }
    })
  }, [setStateAndRef])

  const reset = useCallback(() => {
    stateRef.current = initialState
    setState(initialState)
  }, [])

  return {
    ...state,
    currentQuestion: state.questions[state.currentIndex] ?? null,
    lastAnswer: state.answers.length > 0 ? state.answers[state.answers.length - 1] : null,
    isLastQuestion: state.currentIndex >= state.questions.length - 1,
    startDaily,
    submitAnswer,
    nextQuestion,
    reset,
  }
}

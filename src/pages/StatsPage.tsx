import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useLocale } from '../hooks/useLocale'
import { CATEGORIES, CATEGORY_LABELS, lf } from '../lib/constants'
import type { CategoryId } from '../lib/constants'

const L = {
  morePlay: { de: 'Spiele mehr Kategorien für das Radar-Chart.', en: 'Play more categories for the radar chart.', tr: 'Radar grafiği için daha fazla kategori oyna.', es: 'Juega más categorías para el gráfico de radar.' },
  morePlayDays: { de: 'Spiele mehr Tage für den Verlauf.', en: 'Play more days for the history.', tr: 'Geçmiş için daha fazla gün oyna.', es: 'Juega más días para el historial.' },
  statisticsTitle: { de: 'Statistiken', en: 'Statistics', tr: 'İstatistikler', es: 'Estadísticas' },
  playFirstQuiz: { de: 'Spiele dein erstes Quiz für Statistiken.', en: 'Play your first quiz for statistics.', tr: 'İstatistikler için ilk quizini oyna.', es: 'Juega tu primer quiz para ver estadísticas.' },
  quizzes: { de: 'Quizzes', en: 'Quizzes', tr: 'Quizler', es: 'Quizzes' },
  avgScore: { de: 'Ø Score', en: 'Avg Score', tr: 'Ort. Puan', es: 'Puntuación Med.' },
  best: { de: 'Bester', en: 'Best', tr: 'En İyi', es: 'Mejor' },
  accuracy: { de: 'Trefferquote', en: 'Accuracy', tr: 'İsabet Oranı', es: 'Precisión' },
  correct: { de: 'richtig', en: 'correct', tr: 'doğru', es: 'correcto' },
  categoryStrength: { de: 'Kategorien-Stärke', en: 'Category Strength', tr: 'Kategori Gücü', es: 'Fuerza por Categoría' },
  categoryMastery: { de: 'Kategorie-Mastery', en: 'Category Mastery', tr: 'Kategori Ustalığı', es: 'Maestría por Categoría' },
  master: { de: 'Meister', en: 'Master', tr: 'Usta', es: 'Maestro' },
  good: { de: 'Gut', en: 'Good', tr: 'İyi', es: 'Bueno' },
  learning: { de: 'Lernend', en: 'Learning', tr: 'Öğreniyor', es: 'Aprendiendo' },
  scoreHistory: { de: 'Score-Verlauf', en: 'Score History', tr: 'Puan Geçmişi', es: 'Historial de Puntuación' },
  betterThan: {
    de: (pct: number, total: number) => `Besser als ${pct}% aller ${total} Spieler`,
    en: (pct: number, total: number) => `Better than ${pct}% of ${total} players`,
    tr: (pct: number, total: number) => `${total} oyuncunun %${pct}'inden daha iyi`,
    es: (pct: number, total: number) => `Mejor que ${pct}% de ${total} jugadores`,
  },
}

function lfFn<T extends (...args: any[]) => string>(obj: Record<string, T>, locale: string, ...args: Parameters<T>): string {
  return (obj[locale] ?? obj.en)(...args)
}

interface StatsData {
  category_scores: Record<string, number>
  score_history: Array<{ date: string; score: number; count: number }>
  totals: {
    quizzes: number; correct: number; questions: number
    avg_score: number; best_score: number; best_streak: number
  }
  comparison: {
    percentile: number; avg_xp: number; my_xp: number; total_players: number
  } | null
}

// SVG Radar Chart
function RadarChart({ scores, locale }: { scores: Record<string, number>; locale: string }) {
  const size = 280
  const cx = size / 2
  const cy = size / 2
  const radius = 110
  const cats = CATEGORIES.filter(c => scores[c] !== undefined)

  if (cats.length < 3) {
    return (
      <p className="text-text-muted text-sm text-center py-8">
        {lf(L.morePlay, locale)}
      </p>
    )
  }

  const angleStep = (2 * Math.PI) / cats.length
  const getPoint = (i: number, value: number) => {
    const angle = angleStep * i - Math.PI / 2
    const r = (value / 100) * radius
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  }

  // Grid rings
  const rings = [25, 50, 75, 100]

  // Data polygon
  const dataPoints = cats.map((cat, i) => getPoint(i, scores[cat] ?? 0))
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[280px] mx-auto">
      {/* Grid */}
      {rings.map(r => {
        const points = cats.map((_, i) => getPoint(i, r))
        const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
        return <path key={r} d={path} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      })}

      {/* Axes */}
      {cats.map((_, i) => {
        const p = getPoint(i, 100)
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      })}

      {/* Data area */}
      <path d={dataPath} fill="rgba(91,79,199,0.2)" stroke="#5B4FC7" strokeWidth="2" />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#5B4FC7" stroke="#080B1A" strokeWidth="2" />
      ))}

      {/* Labels */}
      {cats.map((cat, i) => {
        const labelPoint = getPoint(i, 125)
        const label = CATEGORY_LABELS[cat as CategoryId]?.[locale as 'de' | 'en'] ?? cat
        const shortLabel = label.length > 12 ? label.slice(0, 11) + '...' : label
        return (
          <text
            key={cat}
            x={labelPoint.x}
            y={labelPoint.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#A8A4BA"
            fontSize="8"
            fontFamily="Space Grotesk, sans-serif"
          >
            {shortLabel}
          </text>
        )
      })}
    </svg>
  )
}

// Score History Chart
function ScoreChart({ history, locale }: { history: StatsData['score_history']; locale: string }) {
  if (history.length < 2) {
    return (
      <p className="text-text-muted text-sm text-center py-4">
        {lf(L.morePlayDays, locale)}
      </p>
    )
  }

  const W = 320
  const H = 120
  const pad = { top: 10, right: 10, bottom: 20, left: 40 }
  const chartW = W - pad.left - pad.right
  const chartH = H - pad.top - pad.bottom

  const maxScore = Math.max(...history.map(h => h.score), 1)
  const points = history.map((h, i) => ({
    x: pad.left + (i / (history.length - 1)) * chartW,
    y: pad.top + chartH - (h.score / maxScore) * chartH,
    ...h,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${pad.top + chartH} L ${points[0].x} ${pad.top + chartH} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* Area */}
      <path d={areaPath} fill="rgba(91,79,199,0.15)" />
      {/* Line */}
      <path d={linePath} fill="none" stroke="#5B4FC7" strokeWidth="2" />
      {/* Points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#5B4FC7" stroke="#080B1A" strokeWidth="1.5" />
      ))}
      {/* X axis labels (first and last date) */}
      <text x={pad.left} y={H - 2} fill="#A8A4BA" fontSize="8" fontFamily="JetBrains Mono">{history[0].date.slice(5)}</text>
      <text x={W - pad.right} y={H - 2} fill="#A8A4BA" fontSize="8" fontFamily="JetBrains Mono" textAnchor="end">{history[history.length - 1].date.slice(5)}</text>
      {/* Y axis */}
      <text x={pad.left - 4} y={pad.top + 4} fill="#A8A4BA" fontSize="8" fontFamily="JetBrains Mono" textAnchor="end">{maxScore}</text>
      <text x={pad.left - 4} y={pad.top + chartH} fill="#A8A4BA" fontSize="8" fontFamily="JetBrains Mono" textAnchor="end">0</text>
    </svg>
  )
}

export function StatsPage() {
  const { locale } = useLocale()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      const { data } = await supabase.functions.invoke('get-stats', {
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      })
      if (data && !data.error) setStats(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans flex flex-col">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-white/6">
        <Link to="/app" className="text-text-muted hover:text-text-primary text-lg">&larr;</Link>
        <span className="text-lg font-bold tracking-tight text-primary">
          {lf(L.statisticsTitle, locale)}
        </span>
      </header>

      <main className="flex-1 px-5 py-6 max-w-md mx-auto w-full space-y-5">
        {!stats || stats.totals.quizzes === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="text-4xl">📊</div>
            <p className="text-text-muted">
              {lf(L.playFirstQuiz, locale)}
            </p>
          </div>
        ) : (
          <>
            {/* Totals */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: lf(L.quizzes, locale), value: stats.totals.quizzes, color: 'text-primary' },
                { label: lf(L.avgScore, locale), value: stats.totals.avg_score, color: 'text-teal' },
                { label: lf(L.best, locale), value: stats.totals.best_score, color: 'text-gold' },
              ].map(s => (
                <div key={s.label} className="bg-white/4 border border-white/6 rounded-xl p-3 text-center">
                  <div className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-text-muted">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Accuracy */}
            <div className="bg-white/4 border border-white/6 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">{lf(L.accuracy, locale)}</span>
                <span className="font-mono font-bold text-primary">
                  {stats.totals.questions > 0 ? Math.round((stats.totals.correct / stats.totals.questions) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-white/6 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${stats.totals.questions > 0 ? (stats.totals.correct / stats.totals.questions) * 100 : 0}%`,
                    background: 'linear-gradient(to right, var(--color-primary), var(--color-teal))',
                  }}
                />
              </div>
              <div className="text-xs text-text-muted mt-1">
                {stats.totals.correct} / {stats.totals.questions} {lf(L.correct, locale)}
              </div>
            </div>

            {/* Comparison */}
            {stats.comparison && stats.comparison.total_players > 1 && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-primary font-mono">Top {100 - stats.comparison.percentile}%</p>
                <p className="text-xs text-text-muted mt-1">
                  {lfFn(L.betterThan, locale, stats.comparison.percentile, stats.comparison.total_players)}
                </p>
              </div>
            )}

            {/* Radar Chart */}
            <div className="bg-white/4 border border-white/6 rounded-xl p-4">
              <h3 className="text-sm font-bold mb-2">
                {lf(L.categoryStrength, locale)}
              </h3>
              <RadarChart scores={stats.category_scores} locale={locale} />
              {/* Legend */}
              <div className="grid grid-cols-2 gap-1 mt-3">
                {Object.entries(stats.category_scores)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, score]) => (
                    <div key={cat} className="flex items-center justify-between text-[10px] px-1">
                      <span className="text-text-muted truncate">
                        {CATEGORY_LABELS[cat as CategoryId]?.[locale as 'de' | 'en'] ?? cat}
                      </span>
                      <span className={`font-mono ${score >= 70 ? 'text-teal' : score >= 40 ? 'text-gold' : 'text-fire'}`}>
                        {score}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Category Mastery */}
            {Object.keys(stats.category_scores).length > 0 && (
              <div className="bg-white/4 border border-white/6 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold">
                  {lf(L.categoryMastery, locale)}
                </h3>
                {Object.entries(stats.category_scores)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, score]) => {
                    const label = CATEGORY_LABELS[cat as CategoryId]?.[locale as 'de' | 'en'] ?? cat
                    const mastery = score >= 80 ? 'master' : score >= 50 ? 'good' : 'learning'
                    const masteryLabel = mastery === 'master'
                      ? lf(L.master, locale)
                      : mastery === 'good'
                      ? lf(L.good, locale)
                      : lf(L.learning, locale)
                    const barColor = mastery === 'master' ? 'bg-teal' : mastery === 'good' ? 'bg-primary' : 'bg-gold'
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-secondary truncate max-w-[60%]">{label}</span>
                          <span className={`text-[10px] font-semibold ${mastery === 'master' ? 'text-teal' : mastery === 'good' ? 'text-primary' : 'text-gold'}`}>
                            {masteryLabel} ({score}%)
                          </span>
                        </div>
                        <div className="w-full bg-white/6 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${barColor} transition-all`} style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}

            {/* Score History */}
            <div className="bg-white/4 border border-white/6 rounded-xl p-4">
              <h3 className="text-sm font-bold mb-2">
                {lf(L.scoreHistory, locale)}
              </h3>
              <ScoreChart history={stats.score_history} locale={locale} />
            </div>
          </>
        )}
      </main>
    </div>
  )
}

interface ScoreDisplayProps {
  score: number
  streak: number
}

export default function ScoreDisplay({ score, streak }: ScoreDisplayProps) {
  return (
    <div className="flex items-center gap-2">
      {streak > 0 && (
        <span className="flex items-center gap-1 text-fire font-semibold text-sm px-2 py-1 rounded-full bg-fire/10 border border-fire/20">
          🔥 {streak}× Streak
        </span>
      )}
      <span className="text-teal font-mono font-bold text-sm px-2 py-1 rounded-full bg-teal/10 border border-teal/20">
        +{score}
      </span>
    </div>
  )
}

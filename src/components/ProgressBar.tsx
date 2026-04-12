interface ProgressBarProps {
  current: number
  total: number
  bonusIndex: number
}

export default function ProgressBar({ current, total, bonusIndex }: ProgressBarProps) {
  return (
    <div className="flex gap-1.5 items-center">
      {Array.from({ length: total }).map((_, i) => {
        const isDone = i < current
        const isCurrent = i === current
        const isBonus = i === bonusIndex

        let className = 'h-2 flex-1 rounded-full transition-all duration-300 '

        if (isBonus) {
          className += 'bg-gold/20 border border-gold'
        } else if (isDone) {
          className += 'bg-primary'
        } else if (isCurrent) {
          className += 'bg-teal'
        } else {
          className += 'bg-white/6'
        }

        return <div key={i} className={className} />
      })}
    </div>
  )
}

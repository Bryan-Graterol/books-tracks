import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number       // 0–100
  className?: string
  showLabel?: boolean
  color?: 'amber' | 'green' | 'blue' | 'purple'
}

const COLOR: Record<string, string> = {
  amber: 'bg-amber-400',
  green: 'bg-green-400',
  blue: 'bg-blue-400',
  purple: 'bg-purple-400',
}

export default function ProgressBar({
  value,
  className,
  showLabel = false,
  color = 'amber',
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="progress-track flex-1">
        <div
          className={cn('progress-bar', COLOR[color])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-zinc-500 tabular-nums w-8 text-right">
          {clamped}%
        </span>
      )}
    </div>
  )
}

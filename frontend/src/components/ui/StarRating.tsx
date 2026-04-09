import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value?: number
  onChange?: (rating: number) => void
  readOnly?: boolean
  size?: 'sm' | 'md'
}

export default function StarRating({
  value = 0,
  onChange,
  readOnly = false,
  size = 'md',
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0)
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (readOnly ? value : (hovered || value))
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readOnly && setHovered(star)}
            onMouseLeave={() => !readOnly && setHovered(0)}
            className={cn(
              'transition-colors',
              readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
            )}
          >
            <Star
              className={cn(
                iconSize,
                'transition-all',
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-transparent text-zinc-600',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

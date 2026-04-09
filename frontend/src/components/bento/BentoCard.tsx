import { cn } from '@/lib/utils'
import type { BentoSize } from '@/types'

const SIZE_CLASSES: Record<BentoSize, string> = {
  '1x1': 'col-span-1 row-span-1',
  '2x1': 'col-span-2 row-span-1',
  '1x2': 'col-span-1 row-span-2',
  '2x2': 'col-span-2 row-span-2',
  '3x1': 'col-span-3 row-span-1',
  '4x1': 'col-span-4 row-span-1',
}

interface BentoCardProps {
  size?: BentoSize
  className?: string
  children: React.ReactNode
  onClick?: () => void
  accent?: boolean
}

export default function BentoCard({
  size = '1x1',
  className,
  children,
  onClick,
  accent = false,
}: BentoCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        SIZE_CLASSES[size],
        'bento-card relative overflow-hidden',
        onClick && 'cursor-pointer hover:bg-surface-hover hover:border-zinc-700',
        accent && 'bg-amber-400/5 border-amber-400/20',
        'transition-all duration-200',
        className,
      )}
    >
      {children}
    </div>
  )
}

import { BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookCoverProps {
  url?: string
  title: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZE: Record<string, string> = {
  xs: 'w-8 h-11',
  sm: 'w-12 h-16',
  md: 'w-16 h-22',
  lg: 'w-24 h-32',
  xl: 'w-32 h-44',
}

export default function BookCover({ url, title, size = 'md', className }: BookCoverProps) {
  return (
    <div
      className={cn(
        SIZE[size],
        'rounded-lg overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0 shadow-lg',
        className,
      )}
    >
      {url ? (
        <img
          src={url}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.currentTarget
            target.style.display = 'none'
            target.nextElementSibling?.removeAttribute('style')
          }}
        />
      ) : null}
      <BookOpen
        className="w-6 h-6 text-zinc-600"
        style={url ? { display: 'none' } : undefined}
      />
    </div>
  )
}

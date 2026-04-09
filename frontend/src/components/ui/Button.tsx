import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const VARIANT: Record<string, string> = {
  primary: 'bg-amber-400 text-zinc-950 hover:bg-amber-300 font-semibold',
  ghost: 'text-zinc-400 hover:text-zinc-100 hover:bg-surface-hover',
  outline: 'border border-surface-border text-zinc-300 hover:border-zinc-600 hover:bg-surface-hover',
  danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20',
}

const SIZE: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-sm rounded-xl gap-2',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
    >
      {children}
    </button>
  )
}

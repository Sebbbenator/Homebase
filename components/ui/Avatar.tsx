import { cn } from '@/lib/utils'

const TINTS = ['bg-accent-soft', 'bg-good-soft', 'bg-info-soft', 'bg-warn-soft']

function tintFor(key: string) {
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return TINTS[hash % TINTS.length]
}

interface AvatarProps {
  /** Stabil nøgle (user id) til farvevalg */
  id?: string
  emoji?: string | null
  name?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZES = {
  xs: 'w-6 h-6 text-[13px]',
  sm: 'w-8 h-8 text-base',
  md: 'w-10 h-10 text-xl',
  lg: 'w-14 h-14 text-3xl',
  xl: 'w-20 h-20 text-5xl',
}

export function Avatar({ id, emoji, name, size = 'md', className }: AvatarProps) {
  const label = name || '?'
  const initial = label.trim().charAt(0).toUpperCase()
  return (
    <span
      title={label}
      aria-label={label}
      className={cn(
        'rounded-full inline-flex items-center justify-center flex-shrink-0 select-none leading-none',
        tintFor(id || label),
        SIZES[size],
        !emoji && 'font-display font-bold text-ink',
        className
      )}
    >
      {emoji || initial}
    </span>
  )
}

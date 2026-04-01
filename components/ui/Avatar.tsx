import { cn, getInitials } from '@/lib/utils'

const COLORS = [
  'bg-orange-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-emerald-600',
  'bg-cyan-600',
  'bg-violet-600',
]

function getColor(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i)
  return COLORS[hash % COLORS.length]
}

interface AvatarProps {
  email?: string
  emoji?: string | null
  displayName?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ email, emoji, displayName, size = 'md', className }: AvatarProps) {
  const label = displayName || email || '?'

  // Show emoji if available
  if (emoji) {
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center flex-shrink-0 bg-neutral-800',
          {
            'w-6 h-6 text-sm': size === 'sm',
            'w-8 h-8 text-lg': size === 'md',
            'w-10 h-10 text-xl': size === 'lg',
          },
          className
        )}
        title={label}
      >
        {emoji}
      </div>
    )
  }

  // Fallback to initials
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0',
        getColor(label),
        {
          'w-6 h-6 text-[10px]': size === 'sm',
          'w-8 h-8 text-xs': size === 'md',
          'w-10 h-10 text-sm': size === 'lg',
        },
        className
      )}
      title={label}
    >
      {getInitials(email || label)}
    </div>
  )
}

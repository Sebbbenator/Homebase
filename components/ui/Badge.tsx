import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'orange'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
        {
          'bg-neutral-800 text-neutral-300': variant === 'default',
          'bg-green-500/15 text-green-400': variant === 'success',
          'bg-yellow-500/15 text-yellow-400': variant === 'warning',
          'bg-red-500/15 text-red-400': variant === 'danger',
          'bg-blue-500/15 text-blue-400': variant === 'info',
          'bg-orange-500/15 text-orange-400': variant === 'orange',
        },
        className
      )}
    >
      {children}
    </span>
  )
}

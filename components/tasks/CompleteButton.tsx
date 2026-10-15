'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FreshState } from '@/lib/freshness'

interface CompleteButtonProps {
  state: FreshState
  label: string
  onClick: () => void
  justDone?: boolean
  size?: 'md' | 'lg'
}

/** Den runde "gjort"-knap. Fremhævet når opgaven trænger. */
export function CompleteButton({ state, label, onClick, justDone, size = 'md' }: CompleteButtonProps) {
  const hot = state === 'now'
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick() }}
      aria-label={`Markér ${label} som gjort`}
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90',
        size === 'lg' ? 'w-12 h-12' : 'w-11 h-11',
        justDone
          ? 'bg-good text-white animate-[bounce-check_0.35s_ease-out]'
          : hot
          ? 'bg-accent text-ink shadow-float'
          : 'bg-card border-2 border-line text-faint hover:border-accent hover:text-accent-ink'
      )}
    >
      <Check className={size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} strokeWidth={3} />
    </button>
  )
}

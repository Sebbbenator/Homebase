'use client'

import { cn } from '@/lib/utils'

interface ProgressBarProps {
  completed: number
  total: number
}

export function ProgressBar({ completed, total }: ProgressBarProps) {
  if (total === 0) return null

  const pct = Math.round((completed / total) * 100)

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-neutral-400">
          {completed} of {total} done today
        </span>
        <span className={cn(
          'text-xs font-bold',
          pct === 100 ? 'text-green-400' : pct >= 50 ? 'text-orange-400' : 'text-neutral-500'
        )}>
          {pct}%
        </span>
      </div>
      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            pct === 100
              ? 'bg-gradient-to-r from-green-500 to-emerald-400'
              : 'bg-gradient-to-r from-orange-600 to-amber-500'
          )}
          style={{ width: `${pct}%`, animation: 'progress-fill 0.8s ease-out both' }}
        />
      </div>
    </div>
  )
}

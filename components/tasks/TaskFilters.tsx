'use client'

import { cn } from '@/lib/utils'

export type FilterType = 'all' | 'mine' | 'completed'

interface TaskFiltersProps {
  active: FilterType
  onChange: (f: FilterType) => void
}

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'mine', label: 'Mine' },
  { value: 'completed', label: 'Done' },
]

export function TaskFilters({ active, onChange }: TaskFiltersProps) {
  return (
    <div className="flex gap-2">
      {FILTERS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={cn(
            'px-3.5 py-1.5 text-sm font-medium rounded-full transition-colors',
            active === value
              ? 'bg-orange-600 text-white'
              : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

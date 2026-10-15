import { cn } from '@/lib/utils'
import { FRESH_STYLE, type Freshness } from '@/lib/freshness'

interface FreshBarProps {
  fresh: Freshness
  showLabel?: boolean
  className?: string
}

/** Friskhedsbar: hvor meget af intervallet er brugt (rød = trænger, gul = snart, grøn = fint) */
export function FreshBar({ fresh, showLabel = true, className }: FreshBarProps) {
  const style = FRESH_STYLE[fresh.state]
  const width = fresh.state === 'none' ? 0 : Math.min(100, Math.max(6, Math.round(fresh.ratio * 100)))
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {showLabel && <span className={cn('text-xs font-semibold', style.text)}>{fresh.label}</span>}
      <div className="h-1.5 rounded-full bg-soft overflow-hidden" aria-hidden="true">
        <div className={cn('h-full rounded-full transition-[width] duration-500', style.bar)} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

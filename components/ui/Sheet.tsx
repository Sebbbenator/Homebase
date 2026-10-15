'use client'

import { useEffect, useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

const noop = () => () => {}
const useIsClient = () => useSyncExternalStore(noop, () => true, () => false)

/** Bottom sheet – glider op fra bunden på mobil, centreret kort på større skærme */
export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  const isClient = useIsClient()

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open || !isClient) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button
        aria-label="Luk"
        onClick={onClose}
        className="anim-fade absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'anim-sheet relative w-full sm:max-w-md max-h-[92dvh] sm:max-h-[85vh] flex flex-col',
          'bg-card text-ink rounded-t-[28px] sm:rounded-[28px] shadow-[0_-8px_30px_rgba(42,33,27,0.18)]',
          className
        )}
      >
        <div className="flex items-center justify-center pt-2.5 pb-1 sm:hidden">
          <span className="w-10 h-1.5 rounded-full bg-line" />
        </div>
        {title && (
          <div className="flex items-center justify-between px-5 pt-2 pb-3 sm:pt-5">
            <h2 className="font-display text-xl font-semibold leading-tight pr-3">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Luk"
              className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-muted hover:bg-soft transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="px-5 pb-5 safe-bottom overflow-y-auto flex-1">{children}</div>
      </div>
    </div>,
    document.body
  )
}

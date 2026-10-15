'use client'

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

interface ToastOptions {
  action?: { label: string; onClick: () => void }
  duration?: number
}

interface ToastItem extends ToastOptions {
  id: number
  message: string
}

interface ToastContextValue {
  show: (message: string, options?: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((message: string, options?: ToastOptions) => {
    const id = ++counter.current
    setToasts((prev) => [...prev.slice(-2), { id, message, ...options }])
    window.setTimeout(() => dismiss(id), options?.duration ?? 5000)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[88px] z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="anim-up pointer-events-auto flex items-center gap-3 max-w-md w-full px-4 py-3 rounded-2xl bg-ink text-ground text-sm font-bold shadow-[0_8px_24px_rgba(42,33,27,0.3)] dark:bg-card dark:text-ink dark:border dark:border-line"
          >
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <button
                onClick={() => { t.action?.onClick(); dismiss(t.id) }}
                className="px-3 py-1.5 rounded-xl bg-accent text-ink text-xs font-extrabold"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

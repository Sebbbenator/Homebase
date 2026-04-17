'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, children, className }: ModalProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Animate in/out
  useEffect(() => {
    if (open) {
      // Small delay so the CSS transition fires after mount
      const t = setTimeout(() => setVisible(true), 10)
      return () => clearTimeout(t)
    } else {
      setVisible(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!mounted) return null
  if (!open && !visible) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          transition: 'opacity 0.3s ease',
          opacity: visible ? 1 : 0,
        }}
      />

      {/* Bottom sheet */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 51,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          className={cn('w-full max-w-lg', className)}
          style={{
            backgroundColor: '#16161e',
            borderRadius: '28px 28px 0 0',
            border: '1px solid rgba(255,255,255,0.06)',
            borderBottom: 'none',
            boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
            maxHeight: '92dvh',
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'auto',
            transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
            transform: visible ? 'translateY(0)' : 'translateY(100%)',
          }}
        >
          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.12)' }} />
          </div>

          {/* Scrollable content */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '8px 20px 40px 20px' }}>
            {children}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
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
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)

  const touchStartY = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (open) {
      setDragY(0)
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

  function onTouchStart(e: React.TouchEvent) {
    // Only start drag when the scroll area is at the top
    const scrollEl = scrollRef.current
    if (scrollEl && scrollEl.scrollTop > 0) return
    touchStartY.current = e.touches[0].clientY
    setDragging(true)
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging) return
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 0) setDragY(delta)
  }

  function onTouchEnd() {
    if (!dragging) return
    setDragging(false)
    if (dragY > 120) {
      setDragY(0)
      onClose()
    } else {
      setDragY(0)
    }
  }

  if (!mounted) return null
  if (!open && !visible) return null

  const sheetTranslate = visible ? dragY : dragY + 9999

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
          transition: dragging ? 'none' : 'opacity 0.3s ease',
          opacity: visible ? Math.max(0, 1 - dragY / 300) : 0,
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
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
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
            transition: dragging ? 'none' : 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
            transform: `translateY(${sheetTranslate}px)`,
          }}
        >
          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.12)' }} />
          </div>

          {/* Scrollable content */}
          <div ref={scrollRef} style={{ overflowY: 'auto', flex: 1, padding: '8px 20px 40px 20px' }}>
            {children}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

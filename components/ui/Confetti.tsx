'use client'

import { useMemo } from 'react'

const COLORS = ['#F26B3A', '#E3A32B', '#2F8F5B', '#3E4DB0', '#F472B6', '#FFD166']

export function Confetti({ show, count = 36 }: { show: boolean; count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        left: 5 + Math.random() * 90,
        delay: Math.random() * 0.4,
        size: 6 + Math.random() * 8,
        color: COLORS[i % COLORS.length],
        round: Math.random() > 0.5,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [show, count]
  )
  if (!show) return null
  return (
    <div className="fixed inset-0 pointer-events-none z-[70]" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className={p.round ? 'absolute rounded-full' : 'absolute rounded-sm'}
          style={{
            left: `${p.left}%`,
            top: '45%',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `confetti-pop 0.9s ${p.delay}s ease-out both`,
          }}
        />
      ))}
    </div>
  )
}

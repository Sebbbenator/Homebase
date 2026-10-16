'use client'

import { useState } from 'react'
import { toggleReaction } from '@/lib/actions/reactions'
import { useToast } from '@/components/ui/Toast'
import { cn, displayName, haptic } from '@/lib/utils'
import type { Profiles, Reaction } from '@/lib/types'

interface ReactionButtonProps {
  completionId: string
  reactions: Reaction[]
  currentUserId: string
  profiles: Profiles
  /** Kan ikke klappe af sig selv */
  disabled?: boolean
}

export function ReactionButton({ completionId, reactions, currentUserId, profiles, disabled }: ReactionButtonProps) {
  const toast = useToast()
  const [local, setLocal] = useState<Reaction[] | null>(null)
  const list = local ?? reactions
  const mine = list.some((r) => r.user_id === currentUserId)
  const names = list.map((r) => displayName(profiles[r.user_id])).join(', ')
  const isTemp = completionId.startsWith('tmp-')

  async function toggle() {
    if (disabled || isTemp) return
    haptic(6)
    const before = list
    setLocal(
      mine
        ? list.filter((r) => r.user_id !== currentUserId)
        : [...list, { id: `tmp-${Date.now()}`, completion_id: completionId, home_id: '', user_id: currentUserId, emoji: '👏', created_at: new Date().toISOString() }]
    )
    try {
      await toggleReaction(completionId)
    } catch {
      setLocal(before)
      toast.show('Kunne ikke gemme reaktionen')
    }
  }

  if (disabled && list.length === 0) return null

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled || isTemp}
      aria-pressed={mine}
      title={names || 'Klap'}
      className={cn(
        'h-7 px-2 rounded-full flex items-center gap-1 text-xs font-extrabold transition-colors flex-shrink-0',
        mine ? 'bg-accent-soft text-accent-ink' : 'bg-soft text-muted',
        (disabled || isTemp) && 'opacity-80'
      )}
    >
      <span aria-hidden="true">👏</span>
      {list.length > 0 && <span>{list.length}</span>}
    </button>
  )
}

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Sheet } from './Sheet'

const EMOJI_GROUPS = [
  { label: 'Ansigter', emojis: ['😀', '😎', '🤩', '😇', '🥳', '😤', '🤓', '😏', '🥰', '🤗', '😴', '🫡', '🤠', '👻', '🤖', '👽'] },
  { label: 'Dyr', emojis: ['🐶', '🐱', '🐻', '🦊', '🐼', '🐨', '🦁', '🐸', '🐧', '🦄', '🐙', '🦋', '🐝', '🐳', '🦈', '🦉', '🦆', '🐢'] },
  { label: 'Mad', emojis: ['🍕', '🍔', '🌮', '🍣', '🍩', '🧁', '🍉', '🥑', '🍟', '☕', '🧋', '🍪', '🌶️', '🍑', '🫐', '🥐'] },
  { label: 'Aktiviteter', emojis: ['⚽', '🎮', '🎸', '🎨', '🏄', '🚀', '🎯', '🏆', '💎', '🔥', '⭐', '🌈', '🎪', '🎭', '🛹', '🏔️'] },
  { label: 'Natur', emojis: ['🌸', '🌻', '🍀', '🌙', '☀️', '🌊', '❄️', '🌵', '🍄', '🪴', '🌴', '🦩', '🐚', '🪸', '🌺', '🍁'] },
]

interface EmojiPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (emoji: string) => void
  current: string
}

export function EmojiPicker({ open, onClose, onSelect, current }: EmojiPickerProps) {
  return (
    <Sheet open={open} onClose={onClose} title="Vælg din avatar">
      {/* Body'en monteres på ny hver gang sheet'et åbnes, så valget starter fra `current` */}
      <PickerBody current={current} onClose={onClose} onSelect={onSelect} />
    </Sheet>
  )
}

function PickerBody({ current, onClose, onSelect }: Omit<EmojiPickerProps, 'open'>) {
  const [selected, setSelected] = useState(current)

  return (
    <div className="flex flex-col gap-4">
      {EMOJI_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-extrabold text-faint uppercase tracking-wider mb-2">{group.label}</p>
          <div className="grid grid-cols-8 gap-1">
            {group.emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelected(emoji)}
                aria-pressed={selected === emoji}
                aria-label={emoji}
                className={cn(
                  'aspect-square rounded-xl flex items-center justify-center text-2xl transition-transform',
                  selected === emoji ? 'bg-accent-soft ring-2 ring-accent scale-110' : 'hover:bg-soft'
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="flex gap-3 pt-2 sticky bottom-0 bg-card">
        <button type="button" onClick={onClose} className="flex-1 h-12 rounded-2xl bg-soft text-body font-extrabold text-[15px]">Annullér</button>
        <button
          type="button"
          onClick={() => { onSelect(selected); onClose() }}
          className="flex-1 h-12 rounded-2xl bg-accent text-ink font-extrabold text-[15px] shadow-float"
        >
          Gem
        </button>
      </div>
    </div>
  )
}

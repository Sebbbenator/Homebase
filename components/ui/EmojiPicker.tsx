'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Modal } from './Modal'

const EMOJI_GROUPS = [
  {
    label: 'Ansigter',
    emojis: ['😀', '😎', '🤩', '😇', '🥳', '😤', '🤓', '😏', '🥰', '🤗', '😴', '🫡', '🤠', '👻', '🤖', '👽'],
  },
  {
    label: 'Dyr',
    emojis: ['🐶', '🐱', '🐻', '🦊', '🐼', '🐨', '🦁', '🐸', '🐧', '🦄', '🐙', '🦋', '🐝', '🐳', '🦈', '🦉'],
  },
  {
    label: 'Mad',
    emojis: ['🍕', '🍔', '🌮', '🍣', '🍩', '🧁', '🍉', '🥑', '🍟', '☕', '🧋', '🍪', '🌶️', '🍑', '🫐', '🥐'],
  },
  {
    label: 'Aktiviteter',
    emojis: ['⚽', '🎮', '🎸', '🎨', '🏄', '🚀', '🎯', '🏆', '💎', '🔥', '⭐', '🌈', '🎪', '🎭', '🛹', '🏔️'],
  },
  {
    label: 'Natur',
    emojis: ['🌸', '🌻', '🍀', '🌙', '☀️', '🌊', '❄️', '🌵', '🍄', '🪴', '🌴', '🦩', '🐚', '🪸', '🌺', '🍁'],
  },
]

interface EmojiPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (emoji: string) => void
  current: string
}

export function EmojiPicker({ open, onClose, onSelect, current }: EmojiPickerProps) {
  const [selected, setSelected] = useState(current)

  function handleConfirm() {
    onSelect(selected)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Vælg din avatar">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {EMOJI_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
              {group.label}
            </p>
            <div className="grid grid-cols-8 gap-1">
              {group.emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setSelected(emoji)}
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all hover:scale-110',
                    selected === emoji
                      ? 'bg-orange-600/20 ring-2 ring-orange-500 scale-110'
                      : 'hover:bg-neutral-800'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-5 pt-4 border-t border-neutral-800">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium rounded-xl text-sm transition-colors"
        >
          Annuller
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-xl text-sm transition-colors"
        >
          Gem
        </button>
      </div>
    </Modal>
  )
}

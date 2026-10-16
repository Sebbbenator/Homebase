'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { SECTIONS } from '@/lib/shopping-sections'
import { TONE_CHIP } from '@/lib/categories'
import { cn } from '@/lib/utils'
import type { ShoppingItem } from '@/lib/types'
import type { ShoppingPatch } from '@/lib/actions/shopping'

interface ItemSheetProps {
  item: ShoppingItem | null
  onClose: () => void
  onSave: (item: ShoppingItem, patch: ShoppingPatch) => void
  onRemove: (item: ShoppingItem) => void
}

const inputClass =
  'w-full h-12 px-4 bg-soft border-2 border-transparent rounded-2xl text-ink placeholder-faint text-[15px] font-semibold focus:outline-none focus:border-accent focus:bg-card transition'

export function ItemSheet({ item, onClose, onSave, onRemove }: ItemSheetProps) {
  return (
    <Sheet open={!!item} onClose={onClose} title="Rediger vare">
      {item && <Body key={item.id} item={item} onClose={onClose} onSave={onSave} onRemove={onRemove} />}
    </Sheet>
  )
}

function Body({ item, onClose, onSave, onRemove }: ItemSheetProps & { item: ShoppingItem }) {
  const [name, setName] = useState(item.name)
  const [quantity, setQuantity] = useState(item.quantity ?? '')
  const [section, setSection] = useState(item.section)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const patch: ShoppingPatch = {}
    if (name.trim() !== item.name) patch.name = name.trim()
    if ((quantity.trim() || null) !== item.quantity) patch.quantity = quantity.trim() || null
    if (section !== item.section) patch.section = section
    if (Object.keys(patch).length) onSave(item, patch)
    onClose()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex gap-2">
        <div className="flex-1 min-w-0">
          <label htmlFor="vare-navn" className="block text-[13px] font-extrabold text-muted mb-2">Vare</label>
          <input id="vare-navn" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
        </div>
        <div className="w-24">
          <label htmlFor="vare-antal" className="block text-[13px] font-extrabold text-muted mb-2">Antal</label>
          <input id="vare-antal" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="fx 2" className={inputClass} />
        </div>
      </div>

      <div>
        <span className="block text-[13px] font-extrabold text-muted mb-2">Sektion i butikken</span>
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              aria-pressed={section === s.id}
              className={cn(
                'h-10 px-3.5 rounded-full text-[13px] font-extrabold border-2 transition-all',
                section === s.id ? cn(TONE_CHIP[s.tone], 'border-current') : 'bg-soft text-muted border-transparent'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="text-xs font-semibold text-faint mt-2">Appen husker sektionen til næste gang, du skriver den samme vare.</p>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => { onRemove(item); onClose() }}
          className="h-12 px-4 rounded-2xl bg-danger-soft text-danger-ink font-extrabold text-[15px] flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" /> Fjern
        </button>
        <button type="submit" disabled={!name.trim()} className="flex-1 h-12 rounded-2xl bg-accent text-ink font-extrabold text-[15px] shadow-float disabled:opacity-50">
          Gem
        </button>
      </div>
    </form>
  )
}

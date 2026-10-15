'use client'

import { useState } from 'react'
import { Check, Plus, ShoppingBasket, Trash2 } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/Toast'
import { useRealtimeShopping } from '@/lib/hooks/useRealtimeShopping'
import { addShoppingItem, clearPurchased, removeShoppingItem, setPurchased } from '@/lib/actions/shopping'
import { cn, displayName, haptic } from '@/lib/utils'
import type { Profiles, ShoppingItem } from '@/lib/types'

interface ShoppingViewProps {
  initialItems: ShoppingItem[]
  homeId: string
  userId: string
  profiles: Profiles
}

export function ShoppingView({ initialItems, homeId, userId, profiles }: ShoppingViewProps) {
  const [items, setItems] = useRealtimeShopping(homeId, initialItems)
  const toast = useToast()
  const [name, setName] = useState('')
  const [qty, setQty] = useState('')
  const [adding, setAdding] = useState(false)
  const [shopMode, setShopMode] = useState(false)

  const pending = items.filter((i) => !i.is_purchased)
  const purchased = items.filter((i) => i.is_purchased)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || adding) return
    setAdding(true)
    const tempId = `tmp-${Date.now()}`
    const temp: ShoppingItem = {
      id: tempId, home_id: homeId, name: trimmed, quantity: qty.trim() || null,
      added_by: userId, is_purchased: false, created_at: new Date().toISOString(),
    }
    setItems((prev) => [temp, ...prev])
    setName('')
    setQty('')
    try {
      const real = await addShoppingItem(trimmed, qty)
      setItems((prev) => {
        const rest = prev.filter((i) => i.id !== tempId)
        return rest.some((i) => i.id === real.id) ? rest : [real, ...rest]
      })
    } catch {
      setItems((prev) => prev.filter((i) => i.id !== tempId))
      toast.show('Kunne ikke tilføje varen')
    } finally {
      setAdding(false)
    }
  }

  async function toggle(item: ShoppingItem) {
    if (item.id.startsWith('tmp-')) return
    haptic(8)
    const next = !item.is_purchased
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_purchased: next } : i)))
    try {
      await setPurchased(item.id, next)
    } catch {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_purchased: !next } : i)))
      toast.show('Kunne ikke gemme')
    }
  }

  async function remove(item: ShoppingItem) {
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    try {
      await removeShoppingItem(item.id)
    } catch {
      setItems((prev) => [item, ...prev])
      toast.show('Kunne ikke slette')
    }
  }

  async function clear() {
    const removed = purchased
    setItems((prev) => prev.filter((i) => !i.is_purchased))
    try {
      await clearPurchased()
      toast.show(`${removed.length} ${removed.length === 1 ? 'vare' : 'varer'} ryddet`)
    } catch {
      setItems((prev) => [...prev, ...removed])
      toast.show('Kunne ikke rydde')
    }
  }

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-bold leading-none">Indkøb</h1>
          <span className="text-[13px] font-bold text-muted">
            {pending.length === 0 ? 'Listen er tom' : `${pending.length} ${pending.length === 1 ? 'vare' : 'varer'} tilbage`}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShopMode((v) => !v)}
          aria-pressed={shopMode}
          className={cn(
            'h-11 px-4 rounded-full flex items-center gap-2 text-[13px] font-extrabold transition-colors',
            shopMode ? 'bg-ink text-ground dark:bg-accent dark:text-ink' : 'bg-card text-body shadow-card'
          )}
        >
          <ShoppingBasket className="w-4 h-4" strokeWidth={2.4} />
          Handle
        </button>
      </div>

      {!shopMode && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <label htmlFor="ny-vare" className="sr-only">Tilføj vare</label>
          <input
            id="ny-vare"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tilføj vare…"
            enterKeyHint="done"
            className="flex-1 min-w-0 h-12 px-4 bg-card border-2 border-line rounded-2xl text-ink placeholder-faint text-[15px] font-semibold focus:outline-none focus:border-accent transition"
          />
          <label htmlFor="ny-antal" className="sr-only">Antal</label>
          <input
            id="ny-antal"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="Antal"
            className="w-20 h-12 px-3 bg-card border-2 border-line rounded-2xl text-ink placeholder-faint text-[14px] font-semibold focus:outline-none focus:border-accent transition"
          />
          <button
            type="submit"
            aria-label="Tilføj"
            disabled={!name.trim() || adding}
            className="w-12 h-12 rounded-2xl bg-accent text-ink flex items-center justify-center flex-shrink-0 shadow-float disabled:opacity-40 disabled:shadow-none"
          >
            <Plus className="w-6 h-6" strokeWidth={3} />
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center text-center gap-3 py-14">
          <span className="w-16 h-16 rounded-3xl bg-info-soft flex items-center justify-center">
            <ShoppingBasket className="w-8 h-8 text-info-ink" />
          </span>
          <p className="font-display text-xl font-semibold">Indkøbslisten er tom</p>
          <p className="text-sm font-semibold text-muted max-w-xs">Skriv en vare ovenfor – alle i huset ser den med det samme.</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="bg-card rounded-card shadow-card overflow-hidden">
              {pending.map((item, i) => (
                <Row key={item.id} item={item} big={shopMode} profiles={profiles} onToggle={() => toggle(item)} onRemove={() => remove(item)} isLast={i === pending.length - 1} />
              ))}
            </div>
          )}

          {purchased.length > 0 && (
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-extrabold text-faint uppercase tracking-wider">Købt ({purchased.length})</h2>
                <button type="button" onClick={clear} className="h-9 px-2 text-[13px] font-extrabold text-accent-ink flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> Ryd købte
                </button>
              </div>
              <div className="bg-card/60 rounded-card overflow-hidden">
                {purchased.map((item, i) => (
                  <Row key={item.id} item={item} big={shopMode} profiles={profiles} onToggle={() => toggle(item)} onRemove={() => remove(item)} isLast={i === purchased.length - 1} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function Row({ item, big, profiles, onToggle, onRemove, isLast }: {
  item: ShoppingItem
  big: boolean
  profiles: Profiles
  onToggle: () => void
  onRemove: () => void
  isLast: boolean
}) {
  const p = profiles[item.added_by]
  return (
    <div className={cn('flex items-center', !isLast && 'border-b border-line', item.is_purchased && 'opacity-60')}>
      <button
        type="button"
        onClick={onToggle}
        role="checkbox"
        aria-checked={item.is_purchased}
        className={cn('flex-1 min-w-0 flex items-center gap-3 pl-4 text-left', big ? 'py-4 min-h-[60px]' : 'py-3 min-h-[52px]')}
      >
        <span
          className={cn(
            'rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
            big ? 'w-9 h-9' : 'w-7 h-7',
            item.is_purchased ? 'bg-good text-white' : 'border-[2.5px] border-line'
          )}
        >
          {item.is_purchased && <Check className={big ? 'w-5 h-5' : 'w-4 h-4'} strokeWidth={3.5} />}
        </span>
        <span className={cn('flex-1 min-w-0 font-extrabold truncate', big ? 'text-[17px]' : 'text-[15px]', item.is_purchased ? 'line-through text-faint' : 'text-ink')}>
          {item.name}
        </span>
        {item.quantity && (
          <span className="text-xs font-extrabold text-muted bg-soft px-2.5 py-1 rounded-full flex-shrink-0">{item.quantity}</span>
        )}
        <Avatar id={item.added_by} emoji={p?.avatar_emoji} name={displayName(p)} size="xs" className="mr-1" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Fjern ${item.name}`}
        className="w-11 h-11 mr-1 rounded-full flex items-center justify-center text-faint hover:text-danger-ink hover:bg-danger-soft active:bg-danger-soft transition-colors flex-shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

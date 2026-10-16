'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, CloudOff, Plus, ShoppingBasket, Trash2, X } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/Toast'
import { ItemSheet } from './ItemSheet'
import { useRealtimeShopping } from '@/lib/hooks/useRealtimeShopping'
import { useOfflineQueue } from '@/lib/hooks/useOfflineQueue'
import { useOnline } from '@/lib/hooks/useOnline'
import { useWakeLock } from '@/lib/hooks/useWakeLock'
import { addShoppingItem, clearPurchased, forgetHistory, removeShoppingItem, setPurchased, startShopping, updateShoppingItem, type ShoppingPatch } from '@/lib/actions/shopping'
import { detectSection, getSection, normalizeName, SECTION_ORDER, SECTIONS, type SectionId } from '@/lib/shopping-sections'
import { TONE_CHIP } from '@/lib/categories'
import { cn, displayName, haptic } from '@/lib/utils'
import type { Profiles, ShoppingHistory, ShoppingItem } from '@/lib/types'

interface ShoppingViewProps {
  initialItems: ShoppingItem[]
  initialHistory: ShoppingHistory[]
  homeId: string
  userId: string
  profiles: Profiles
}

const SNAPSHOT = (homeId: string) => `hb-shopping-items:${homeId}`

export function ShoppingView({ initialItems, initialHistory, homeId, userId, profiles }: ShoppingViewProps) {
  const [items, setItems] = useRealtimeShopping(homeId, initialItems)
  const [history, setHistory] = useState(initialHistory)
  const toast = useToast()
  const online = useOnline()
  const [name, setName] = useState('')
  const [qty, setQty] = useState('')
  const [shopMode, setShopMode] = useState(false)
  const [editing, setEditing] = useState<ShoppingItem | null>(null)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useWakeLock(shopMode)

  const queue = useOfflineQueue({
    homeId,
    onReplaced: (tempId, real) =>
      setItems((prev) => {
        const rest = prev.filter((i) => i.id !== tempId)
        return rest.some((i) => i.id === real.id) ? rest : [real, ...rest]
      }),
    onFlushed: (n) => toast.show(`${n} ${n === 1 ? 'ændring' : 'ændringer'} sendt – du er online igen`),
  })

  // Offline: brug sidste kendte liste fra denne enhed; ellers gem et øjebliksbillede
  useEffect(() => {
    try {
      if (!navigator.onLine) {
        const raw = localStorage.getItem(SNAPSHOT(homeId))
        if (raw) setItems(JSON.parse(raw) as ShoppingItem[])
      }
    } catch { /* ignorér */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeId])
  useEffect(() => {
    try { localStorage.setItem(SNAPSHOT(homeId), JSON.stringify(items)) } catch { /* ignorér */ }
  }, [items, homeId])

  const pending = useMemo(() => items.filter((i) => !i.is_purchased), [items])
  const purchased = useMemo(() => items.filter((i) => i.is_purchased), [items])
  const pendingKeys = useMemo(() => new Set(pending.map((i) => normalizeName(i.name))), [pending])

  const groups = useMemo(() => {
    const by = new Map<SectionId, ShoppingItem[]>()
    for (const i of pending) {
      const id = getSection(i.section).id
      by.set(id, [...(by.get(id) ?? []), i])
    }
    return [...by.entries()]
      .sort((a, b) => SECTION_ORDER[a[0]] - SECTION_ORDER[b[0]])
      .map(([id, list]) => ({ section: getSection(id), items: list.sort((a, b) => a.created_at.localeCompare(b.created_at)) }))
  }, [pending])

  const frequent = useMemo(
    () => history.filter((h) => !pendingKeys.has(h.name_key)).sort((a, b) => b.times - a.times || b.last_used_at.localeCompare(a.last_used_at)).slice(0, 8),
    [history, pendingKeys]
  )

  const suggestions = useMemo(() => {
    const q = normalizeName(name)
    if (q.length < 1) return []
    return history
      .filter((h) => h.name_key.includes(q) && h.name_key !== q)
      .sort((a, b) => Number(b.name_key.startsWith(q)) - Number(a.name_key.startsWith(q)) || b.times - a.times)
      .slice(0, 5)
  }, [name, history])

  const bumpLocalHistory = useCallback((itemName: string, section: string, quantity: string | null) => {
    const key = normalizeName(itemName)
    setHistory((prev) => {
      const existing = prev.find((h) => h.name_key === key)
      if (existing) {
        return prev.map((h) => (h.name_key === key ? { ...h, times: h.times + 1, last_used_at: new Date().toISOString(), section, last_quantity: quantity ?? h.last_quantity } : h))
      }
      return [...prev, { id: `tmp-${key}`, home_id: homeId, name: itemName.trim(), name_key: key, section, last_quantity: quantity, times: 1, last_used_at: new Date().toISOString() }]
    })
  }, [homeId])

  async function add(rawName: string, rawQty: string | null) {
    const trimmed = rawName.trim()
    if (!trimmed) return
    const key = normalizeName(trimmed)
    const already = pending.find((i) => normalizeName(i.name) === key)
    if (already) {
      toast.show(`"${already.name}" er allerede på listen`)
      return
    }
    const known = history.find((h) => h.name_key === key)
    const section = known?.section ?? detectSection(trimmed)
    const quantity = rawQty?.trim() || null
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const temp: ShoppingItem = { id: tempId, home_id: homeId, name: trimmed, quantity, added_by: userId, is_purchased: false, created_at: new Date().toISOString(), section }
    setItems((prev) => [temp, ...prev])
    bumpLocalHistory(trimmed, section, quantity)
    haptic(6)

    const result = await queue.run({ kind: 'add', tempId, name: trimmed, quantity, section }, async () => {
      const real = await addShoppingItem(trimmed, quantity, section)
      setItems((prev) => {
        const rest = prev.filter((i) => i.id !== tempId)
        return rest.some((i) => i.id === real.id) ? rest : [real, ...rest]
      })
    })
    if (result === 'failed') {
      setItems((prev) => prev.filter((i) => i.id !== tempId))
      toast.show('Kunne ikke tilføje varen')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const n = name
    const q = qty
    setName('')
    setQty('')
    inputRef.current?.focus()
    await add(n, q)
  }

  async function toggle(item: ShoppingItem) {
    haptic(8)
    const next = !item.is_purchased
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_purchased: next } : i)))
    const result = await queue.run({ kind: 'toggle', itemId: item.id, purchased: next }, () => setPurchased(item.id, next))
    if (result === 'failed') {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_purchased: !next } : i)))
      toast.show('Kunne ikke gemme')
    }
  }

  async function save(item: ShoppingItem, patch: ShoppingPatch) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...patch, quantity: patch.quantity === undefined ? i.quantity : patch.quantity } : i)))
    if (patch.section) setHistory((prev) => prev.map((h) => (h.name_key === normalizeName(patch.name ?? item.name) ? { ...h, section: patch.section! } : h)))
    const result = await queue.run({ kind: 'update', itemId: item.id, patch }, () => updateShoppingItem(item.id, patch))
    if (result === 'failed') {
      setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)))
      toast.show('Kunne ikke gemme ændringen')
    }
  }

  async function remove(item: ShoppingItem) {
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    const result = await queue.run({ kind: 'remove', itemId: item.id }, () => removeShoppingItem(item.id))
    if (result === 'failed') {
      setItems((prev) => [item, ...prev])
      toast.show('Kunne ikke fjerne varen')
    }
  }

  async function clear() {
    const removed = purchased
    setItems((prev) => prev.filter((i) => !i.is_purchased))
    const result = await queue.run({ kind: 'clear' }, () => clearPurchased())
    if (result === 'failed') {
      setItems((prev) => [...prev, ...removed])
      toast.show('Kunne ikke rydde')
    } else {
      toast.show(`${removed.length} ${removed.length === 1 ? 'vare' : 'varer'} ryddet`)
    }
  }

  async function forget(h: ShoppingHistory) {
    setHistory((prev) => prev.filter((x) => x.id !== h.id))
    if (!h.id.startsWith('tmp-')) forgetHistory(h.id).catch(() => {})
  }

  function toggleShopMode() {
    const next = !shopMode
    setShopMode(next)
    if (next && pending.length > 0 && online) startShopping().catch(() => {})
  }

  const showSuggestions = focused && suggestions.length > 0

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-bold leading-none">Indkøb</h1>
          <span className="text-[13px] font-bold text-muted">
            {pending.length === 0 ? 'Listen er tom' : `${pending.length} ${pending.length === 1 ? 'vare' : 'varer'} tilbage`}
            {groups.length > 1 && ` · ${groups.length} sektioner`}
          </span>
        </div>
        <button
          type="button"
          onClick={toggleShopMode}
          aria-pressed={shopMode}
          className={cn(
            'h-11 px-4 rounded-full flex items-center gap-2 text-[13px] font-extrabold transition-colors',
            shopMode ? 'bg-ink text-ground dark:bg-accent dark:text-ink' : 'bg-card text-body shadow-card'
          )}
        >
          <ShoppingBasket className="w-4 h-4" strokeWidth={2.4} />
          {shopMode ? 'Handler' : 'Handle'}
        </button>
      </div>

      {(!online || queue.size > 0) && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-warn-soft text-warn-ink">
          <CloudOff className="w-5 h-5 flex-shrink-0" />
          <span className="text-[13px] font-bold">
            {!online ? 'Du er offline – ændringer gemmes her og sendes, når du er online igen.' : `${queue.size} ${queue.size === 1 ? 'ændring' : 'ændringer'} venter på at blive sendt…`}
          </span>
        </div>
      )}

      {!shopMode && (
        <div className="flex flex-col gap-3">
          <form onSubmit={handleSubmit} className="relative flex gap-2">
            <label htmlFor="ny-vare" className="sr-only">Tilføj vare</label>
            <input
              id="ny-vare"
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => window.setTimeout(() => setFocused(false), 150)}
              placeholder="Tilføj vare…"
              enterKeyHint="done"
              autoComplete="off"
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
              disabled={!name.trim()}
              className="w-12 h-12 rounded-2xl bg-accent text-ink flex items-center justify-center flex-shrink-0 shadow-float disabled:opacity-40 disabled:shadow-none"
            >
              <Plus className="w-6 h-6" strokeWidth={3} />
            </button>

            {showSuggestions && (
              <ul className="absolute left-0 right-[88px] top-[52px] z-20 bg-card rounded-2xl shadow-[0_8px_24px_rgba(42,33,27,0.15)] border border-line overflow-hidden">
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setName(''); setQty(''); add(s.name, s.last_quantity) }}
                      className="w-full flex items-center gap-3 px-4 h-11 text-left text-[15px] font-bold hover:bg-soft"
                    >
                      <span className="flex-1 truncate">{s.name}</span>
                      <span className={cn('text-[10px] font-extrabold px-2 py-0.5 rounded-full', TONE_CHIP[getSection(s.section).tone])}>{getSection(s.section).label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </form>

          {frequent.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-extrabold text-faint uppercase tracking-wider px-1">Ofte købt</span>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
                {frequent.map((h) => (
                  <span key={h.id} className="flex-shrink-0 flex items-stretch rounded-full border border-dashed border-faint/60 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => add(h.name, h.last_quantity)}
                      className="h-9 pl-3 pr-2 text-[13px] font-bold text-body flex items-center gap-1 active:bg-soft"
                    >
                      <Plus className="w-3.5 h-3.5 text-accent-ink" strokeWidth={3} /> {h.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => forget(h)}
                      aria-label={`Glem ${h.name}`}
                      className="w-8 flex items-center justify-center text-faint hover:text-danger-ink border-l border-dashed border-faint/40"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center text-center gap-3 py-14">
          <span className="w-16 h-16 rounded-3xl bg-info-soft flex items-center justify-center">
            <ShoppingBasket className="w-8 h-8 text-info-ink" />
          </span>
          <p className="font-display text-xl font-semibold">Indkøbslisten er tom</p>
          <p className="text-sm font-semibold text-muted max-w-xs">Skriv en vare ovenfor – appen sorterer den i den rigtige sektion, og alle i huset ser den med det samme.</p>
        </div>
      ) : (
        <>
          {groups.map((g) => (
            <section key={g.section.id} className="flex flex-col gap-1.5">
              <h2 className={cn('self-start text-[11px] font-extrabold px-2.5 py-1 rounded-full ml-1', TONE_CHIP[g.section.tone])}>{g.section.label}</h2>
              <div className="bg-card rounded-card shadow-card overflow-hidden">
                {g.items.map((item, i) => (
                  <Row key={item.id} item={item} big={shopMode} profiles={profiles} onToggle={() => toggle(item)} onOpen={() => setEditing(item)} isLast={i === g.items.length - 1} />
                ))}
              </div>
            </section>
          ))}

          {pending.length === 0 && purchased.length > 0 && (
            <div className="bg-good-soft rounded-card px-4 py-5 text-center">
              <p className="font-display text-lg font-semibold text-good-ink">Alt er købt</p>
              <p className="text-[13px] font-semibold text-body mt-1">Ryd listen, når posen er pakket ud.</p>
            </div>
          )}

          {purchased.length > 0 && (
            <section className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[11px] font-extrabold text-faint uppercase tracking-wider">Købt ({purchased.length})</h2>
                <button type="button" onClick={clear} className="h-9 px-2 text-[13px] font-extrabold text-accent-ink flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> Ryd købte
                </button>
              </div>
              <div className="bg-card/60 rounded-card overflow-hidden">
                {purchased.map((item, i) => (
                  <Row key={item.id} item={item} big={shopMode} profiles={profiles} onToggle={() => toggle(item)} onOpen={() => setEditing(item)} isLast={i === purchased.length - 1} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {shopMode && (
        <p className="text-center text-xs font-bold text-faint pb-2">Skærmen holdes tændt, mens du handler.</p>
      )}

      <ItemSheet item={editing} onClose={() => setEditing(null)} onSave={save} onRemove={remove} />
    </div>
  )
}

function Row({ item, big, profiles, onToggle, onOpen, isLast }: {
  item: ShoppingItem
  big: boolean
  profiles: Profiles
  onToggle: () => void
  onOpen: () => void
  isLast: boolean
}) {
  const p = profiles[item.added_by]
  const sectionLabel = SECTIONS.find((s) => s.id === item.section)?.label
  return (
    <div className={cn('flex items-center', !isLast && 'border-b border-line', item.is_purchased && 'opacity-60')}>
      <button
        type="button"
        onClick={onToggle}
        role="checkbox"
        aria-checked={item.is_purchased}
        aria-label={`${item.name}${item.is_purchased ? ' – købt' : ''}`}
        className={cn('flex items-center justify-center pl-4 pr-2 flex-shrink-0', big ? 'min-h-[60px]' : 'min-h-[52px]')}
      >
        <span
          className={cn(
            'rounded-full flex items-center justify-center transition-colors',
            big ? 'w-9 h-9' : 'w-7 h-7',
            item.is_purchased ? 'bg-good text-white' : 'border-[2.5px] border-line'
          )}
        >
          {item.is_purchased && <Check className={big ? 'w-5 h-5' : 'w-4 h-4'} strokeWidth={3.5} />}
        </span>
      </button>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Rediger ${item.name}`}
        className={cn('flex-1 min-w-0 flex items-center gap-2.5 pr-4 text-left', big ? 'min-h-[60px]' : 'min-h-[52px]')}
      >
        <span className={cn('flex-1 min-w-0 font-extrabold truncate', big ? 'text-[17px]' : 'text-[15px]', item.is_purchased ? 'line-through text-faint' : 'text-ink')}>
          {item.name}
          {item.is_purchased && sectionLabel && <span className="ml-2 text-[11px] font-bold text-faint no-underline">{sectionLabel}</span>}
        </span>
        {item.quantity && (
          <span className="text-xs font-extrabold text-muted bg-soft px-2.5 py-1 rounded-full flex-shrink-0">{item.quantity}</span>
        )}
        <Avatar id={item.added_by} emoji={p?.avatar_emoji} name={displayName(p)} size="xs" />
      </button>
    </div>
  )
}

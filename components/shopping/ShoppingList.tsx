'use client'

import { useState } from 'react'
import { ShoppingItem } from './ShoppingItem'
import { ShoppingForm } from './ShoppingForm'
import { useRealtimeShopping } from '@/lib/hooks/useRealtimeShopping'
import { clearPurchased } from '@/lib/actions/shopping'
import { ShoppingCart, Trash2, CheckCircle2 } from 'lucide-react'
import type { ShoppingItem as ShoppingItemType } from '@/lib/types'

interface ShoppingListProps {
  initialItems: ShoppingItemType[]
  homeId: string
}

export function ShoppingList({ initialItems, homeId }: ShoppingListProps) {
  const items = useRealtimeShopping(homeId, initialItems)
  const [clearing, setClearing] = useState(false)

  const pending = items.filter((i) => !i.is_purchased)
  const purchased = items.filter((i) => i.is_purchased)

  async function handleClearPurchased() {
    setClearing(true)
    try {
      await clearPurchased()
    } finally {
      setClearing(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="relative mb-6 pt-2">
        <div className="absolute -top-4 -right-4 w-40 h-40 rounded-full bg-green-500/6 blur-3xl pointer-events-none" />
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Indkøb</h1>
            <div className="flex items-center gap-2 mt-3">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] text-xs font-semibold text-zinc-300">
                <ShoppingCart className="w-3.5 h-3.5 text-zinc-400" />
                {pending.length} tilbage
              </span>
              {purchased.length > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-xs font-semibold text-green-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {purchased.length} lagt i kurv
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <ShoppingForm />

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
            <ShoppingCart className="w-7 h-7 text-zinc-600" />
          </div>
          <p className="text-zinc-500 text-sm font-medium">Indkøbslisten er tom</p>
        </div>
      ) : (
        <div className="space-y-5 pb-4">
          {pending.length > 0 && (
            <div className="space-y-2">
              {pending.map((item, i) => (
                <ShoppingItem key={item.id} item={item} style={{ animation: `fade-in-up 0.4s ${i * 0.05}s ease-out both` }} />
              ))}
            </div>
          )}

          {purchased.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
                  I kurven ({purchased.length})
                </p>
                <button
                  onClick={handleClearPurchased}
                  disabled={clearing}
                  className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-50 px-2.5 py-1 rounded-xl hover:bg-red-500/10"
                >
                  <Trash2 className="w-3 h-3" />
                  Ryd alle
                </button>
              </div>
              <div className="space-y-2">
                {purchased.map((item) => (
                  <ShoppingItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

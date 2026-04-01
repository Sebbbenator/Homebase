'use client'

import { useState } from 'react'
import { ShoppingItem } from './ShoppingItem'
import { ShoppingForm } from './ShoppingForm'
import { useRealtimeShopping } from '@/lib/hooks/useRealtimeShopping'
import { clearPurchased } from '@/lib/actions/shopping'
import { ShoppingCart, Trash2 } from 'lucide-react'
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
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-50">Shopping</h1>
        <p className="text-xs text-neutral-500 mt-0.5">
          {pending.length} items left
        </p>
      </div>

      <ShoppingForm />

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center mb-3">
            <ShoppingCart className="w-6 h-6 text-neutral-500" />
          </div>
          <p className="text-neutral-500 text-sm">Shopping list is empty</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <div className="space-y-2">
              {pending.map((item, i) => (
                <ShoppingItem key={item.id} item={item} style={{ animation: `fade-in-up 0.4s ${i * 0.05}s ease-out both` }} />
              ))}
            </div>
          )}

          {purchased.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Purchased ({purchased.length})
                </p>
                <button
                  onClick={handleClearPurchased}
                  disabled={clearing}
                  className="flex items-center gap-1 text-xs text-neutral-500 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear all
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

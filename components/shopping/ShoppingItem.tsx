'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { togglePurchased, removeShoppingItem } from '@/lib/actions/shopping'
import { cn } from '@/lib/utils'
import type { ShoppingItem as ShoppingItemType } from '@/lib/types'

interface ShoppingItemProps {
  item: ShoppingItemType
  style?: React.CSSProperties
}

export function ShoppingItem({ item, style }: ShoppingItemProps) {
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    try {
      await togglePurchased(item.id, item.is_purchased)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    try {
      await removeShoppingItem(item.id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={style}
      className={cn(
        'group flex items-center rounded-xl border transition-all',
        item.is_purchased
          ? 'bg-neutral-900/40 border-neutral-800/50 opacity-60'
          : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
      )}
    >
      <button
        onClick={handleToggle}
        disabled={loading}
        className="flex items-center gap-3 flex-1 min-w-0 px-4 py-3 min-h-[44px]"
      >
        <span
          className={cn(
            'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all',
            item.is_purchased
              ? 'bg-green-600 border-green-600'
              : 'border-neutral-600 group-hover:border-green-500'
          )}
        >
          {item.is_purchased && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>

        <span
          className={cn(
            'flex-1 text-sm font-medium text-left truncate',
            item.is_purchased ? 'line-through text-neutral-500' : 'text-neutral-100'
          )}
        >
          {item.name}
        </span>

        {item.quantity && (
          <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full flex-shrink-0">
            {item.quantity}
          </span>
        )}
      </button>

      <button
        onClick={handleDelete}
        disabled={loading}
        className="p-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-r-xl text-neutral-500 hover:text-red-400 hover:bg-red-500/10 active:bg-red-500/20 transition-all flex-shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

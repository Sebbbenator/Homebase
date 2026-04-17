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
        'group flex items-center gap-3 px-4 py-3.5 rounded-3xl border transition-all',
        item.is_purchased
          ? 'bg-white/[0.02] border-white/[0.03] opacity-50'
          : 'bg-[#16161e] border-white/[0.05] active:scale-[0.99]'
      )}
    >
      <button
        onClick={handleToggle}
        disabled={loading}
        className={cn(
          'w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all',
          item.is_purchased
            ? 'bg-green-500 border-green-500 shadow-sm shadow-green-500/30'
            : 'border-zinc-600 hover:border-orange-500'
        )}
      >
        {item.is_purchased && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <span
        className={cn(
          'flex-1 text-sm font-semibold',
          item.is_purchased ? 'line-through text-zinc-600' : 'text-white'
        )}
      >
        {item.name}
      </span>

      {item.quantity && (
        <span className="text-xs font-medium text-zinc-500 bg-white/[0.05] px-2.5 py-1 rounded-full">
          {item.quantity}
        </span>
      )}

      <button
        onClick={handleDelete}
        disabled={loading}
        className="opacity-0 group-hover:opacity-100 group-active:opacity-100 p-1.5 rounded-xl hover:bg-red-500/15 text-zinc-600 hover:text-red-400 transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

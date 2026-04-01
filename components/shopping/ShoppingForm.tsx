'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { addShoppingItem } from '@/lib/actions/shopping'

export function ShoppingForm() {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await addShoppingItem(name.trim(), quantity.trim() || undefined)
      setName('')
      setQuantity('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add item..."
        className="flex-1 px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-50 placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
      />
      <input
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="Qty"
        className="w-20 px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-50 placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-10 h-10 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0"
      >
        <Plus className="w-5 h-5 text-white" />
      </button>
    </form>
  )
}

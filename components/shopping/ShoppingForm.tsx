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
        placeholder="Tilføj vare..."
        className="flex-1 px-4 py-3 bg-[#16161e] border border-white/[0.06] rounded-2xl text-white placeholder-zinc-600 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition"
      />
      <input
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="Antal"
        className="w-20 px-3 py-3 bg-[#16161e] border border-white/[0.06] rounded-2xl text-white placeholder-zinc-600 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition"
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:opacity-40 flex items-center justify-center transition-all shadow-lg shadow-orange-600/20 active:scale-95 flex-shrink-0"
      >
        <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
      </button>
    </form>
  )
}

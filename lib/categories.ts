export const CATEGORIES = [
  {
    id: 'common',
    label: 'Fællesområder',
    color: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    activeColor: 'bg-orange-500 text-white',
    borderColor: '#f97316',
  },
  {
    id: 'kitchen',
    label: 'Køkken',
    color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    activeColor: 'bg-amber-500 text-white',
    borderColor: '#f59e0b',
  },
  {
    id: 'bathroom',
    label: 'Badeværelse',
    color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    activeColor: 'bg-blue-500 text-white',
    borderColor: '#3b82f6',
  },
  {
    id: 'living',
    label: 'Stue',
    color: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    activeColor: 'bg-purple-500 text-white',
    borderColor: '#a855f7',
  },
  {
    id: 'bedroom',
    label: 'Soveværelse',
    color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    activeColor: 'bg-indigo-500 text-white',
    borderColor: '#6366f1',
  },
  {
    id: 'laundry',
    label: 'Tøjvask',
    color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    activeColor: 'bg-cyan-500 text-white',
    borderColor: '#06b6d4',
  },
  {
    id: 'outdoor',
    label: 'Udendørs',
    color: 'bg-green-500/15 text-green-400 border-green-500/30',
    activeColor: 'bg-green-500 text-white',
    borderColor: '#22c55e',
  },
  {
    id: 'other',
    label: 'Andet',
    color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    activeColor: 'bg-zinc-500 text-white',
    borderColor: '#71717a',
  },
] as const

export type CategoryId = typeof CATEGORIES[number]['id']

export function getCategory(id: string) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}

export const CATEGORIES = [
  { id: 'kitchen', label: 'Køkken', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  { id: 'bathroom', label: 'Badeværelse', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  { id: 'living', label: 'Stue', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  { id: 'bedroom', label: 'Soveværelse', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
  { id: 'laundry', label: 'Tøjvask', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  { id: 'outdoor', label: 'Udendørs', color: 'bg-green-500/15 text-green-400 border-green-500/30' },
  { id: 'other', label: 'Andet', color: 'bg-neutral-500/15 text-neutral-400 border-neutral-500/30' },
] as const

export type CategoryId = typeof CATEGORIES[number]['id']

export function getCategory(id: string) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}
